import axios from 'axios'
import {createHttpClient} from 'contentful-sdk-core'
import {Entry, EntryCollection} from 'contentful'
import {pickBy} from 'lodash'

type CreateClientParams = {
  space: string, accessToken: string
}

type PageAbleParam = {
  skip?: number
  limit?: number
}

type ParamEnvironment = {
  environment: string
}

type EntriesQuery = {
  select?: Array<string>
}

type GetEntriesParams = ParamEnvironment & { query?: EntriesQuery & PageAbleParam & Record<string, any> }
type GetEntryParams = ParamEnvironment & { entryId: string, query?: EntriesQuery }

const cleanQuery = (query?: Record<string, any>) => pickBy(query, v => v !== undefined)

export const createClient = ({space, accessToken}: CreateClientParams) => {
  const cdaClient = createHttpClient(axios, {
    accessToken,
    space,
    throttle: 'auto',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/vnd.contentful.delivery.v1+json',
    },
    baseURL: `https://cdn.contentful.com/spaces/${space}/environments/`,
  })

  const cmaClient = createHttpClient(axios, {
    accessToken,
    space,
    throttle: 'auto',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/vnd.contentful.management.v1+json',
    },
    baseURL: `https://api.contentful.com/spaces/${space}/environments/`,
  })

  const count = {
    cda: 0,
    cma: 0,
  }

  return {
    requestCounts: () => count,
    cma: {
      requestCounts: () => count.cma,
      entries: {
        getMany: async ({environment, query}: GetEntriesParams) => {
          count.cma++
          const result = await cmaClient.get(`${environment}/entries`, {
            params: {...cleanQuery(query)},
          })
          return result.data as EntryCollection<any>
        },
        get: async ({environment, entryId, query}: GetEntryParams) => {
          count.cma++
          const result = await cmaClient.get(`${environment}/entries/${entryId}`, {
            params: {...cleanQuery(query)},
          })
          return result.data as Entry<any>
        },
      },
    },
    cda: {
      requestCounts: () => count.cda,
      entries: {
        getMany: async ({environment, query}: GetEntriesParams) => {
          count.cda++
          const result = await cdaClient.get(`${environment}/entries`, {
            params: {...cleanQuery(query)},
          })
          return result.data as EntryCollection<any>
        },
        get: async ({environment, entryId, query}: GetEntryParams) => {
          count.cda++
          const result = await cdaClient.get(`${environment}/entries/${entryId}`, {
            params: {...cleanQuery(query)},
          })
          return result.data as Entry<any>
        },
      },
    },
  }
}

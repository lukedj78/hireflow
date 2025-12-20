import { createSearchParamsCache, parseAsString } from 'nuqs/server'

export const searchParamsParsers = {
  q: parseAsString.withDefault(''),
  status: parseAsString.withDefault('all'),
  type: parseAsString.withDefault('all'),
}

export const searchParamsCache = createSearchParamsCache(searchParamsParsers)

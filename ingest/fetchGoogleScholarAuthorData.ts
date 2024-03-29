import _ from 'lodash'
import { ApolloClient, MutationOptions } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { createHttpLink } from 'apollo-link-http'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
import Harvester from './modules/harvester'
import { GoogleScholarDataSource } from './modules/googleScholarDataSource'
import NormedPerson from './modules/normedPerson'
import DataSourceConfig from '../ingest/modules/dataSourceConfig'

dotenv.config({
  path: '../.env'
})

const axios = require('axios');

// environment variables
process.env.NODE_ENV = 'development';

// uncomment below line to test this code against staging environment
// process.env.NODE_ENV = 'staging';

// config variables
// const config = require('../config/config.js');

const hasuraSecret = process.env.HASURA_SECRET
const graphQlEndPoint = process.env.GRAPHQL_END_POINT

const client = new ApolloClient({
  link: createHttpLink({
    uri: graphQlEndPoint,
    headers: {
      'x-hasura-admin-secret': hasuraSecret
    },
    fetch: fetch as any
  }),
  cache: new InMemoryCache()
})

async function main (): Promise<void> {

  const harvestStartYear = Number.parseInt(process.env.GOOGLE_SCHOLAR_HARVEST_START_YEAR)
  const harvestEndYear = Number.parseInt(process.env.GOOGLE_SCHOLAR_HARVEST_END_YEAR)
  let harvestYears = []

  for (let index = 0; index <= harvestEndYear - harvestStartYear; index++) {
    harvestYears.push((harvestStartYear+index))
  }

  const dsConfig: DataSourceConfig = {
    baseUrl: process.env.GOOGLE_SCHOLAR_BASE_URL,
    queryUrl: process.env.GOOGLE_SCHOLAR_QUERY_URL,
    apiKey: process.env.GOOGLE_SCHOLAR_API_KEY,
    sourceName: process.env.GOOGLE_SCHOLAR_SOURCE_NAME,
    pageSize: process.env.GOOGLE_SCHOLAR_PAGE_SIZE,  // page size must be a string for the request to work
    requestInterval: Number.parseInt(process.env.GOOGLE_SCHOLAR_REQUEST_INTERVAL),
    harvestYears: harvestYears,
    harvestDataDir: process.env.GOOGLE_SCHOLAR_HARVEST_DATA_DIR,
    batchSize: Number.parseInt(process.env.HARVEST_BATCH_SIZE),
    harvestFileBatchSize: Number.parseInt(process.env.HARVEST_DIR_FILE_BATCH_SIZE),
    harvestThreadCount: Number.parseInt(process.env.GOOGLE_SCHOLAR_HARVEST_THREAD_COUNT)
  }

  const googleScholarDS: GoogleScholarDataSource = new GoogleScholarDataSource(dsConfig)
  const googleScholarHarvester: Harvester = new Harvester(googleScholarDS, client)
  await googleScholarHarvester.executeHarvest()
}

main();

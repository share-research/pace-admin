import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { createHttpLink } from 'apollo-link-http'
import gql from 'graphql-tag'
import fetch from 'node-fetch'
import _ from 'lodash'
import { command as loadCsv } from './units/loadCsv'
import readPersons from '../client/src/gql/readPersons'
import readPublications from './gql/readPublications'
import updatePubAbstract from './gql/updatePubAbstract'
import { __EnumValue } from 'graphql'
import dotenv from 'dotenv'
import { command as writeCsv } from './units/writeCsv'
import moment from 'moment'
import pMap from 'p-map'

dotenv.config({
  path: '../.env'
})

const axios = require('axios');

const elsApiKey = process.env.SCOPUS_API_KEY
const elsCookie = process.env.SCOPUS_API_COOKIE

// environment variables
process.env.NODE_ENV = 'development';

const client = new ApolloClient({
  link: createHttpLink({
    uri: 'http://localhost:8002/v1/graphql',
    headers: {
      'x-hasura-admin-secret': 'mysecret'
    },
    fetch: fetch as any
  }),
  cache: new InMemoryCache()
})

async function wait(ms){
  return new Promise((resolve, reject)=> {
    setTimeout(() => resolve(true), ms );
  });
}

async function randomWait(seedTime, index){
  const waitTime = 1000 * (index % 5)
  //console.log(`Thread Waiting for ${waitTime} ms`)
  await wait(waitTime)
}

async function getScopusPaperAbstractData (baseUrl) {
  console.log(`Base url is: ${baseUrl}`)
  const url = `${baseUrl}?apiKey=${elsApiKey}`
  const response = await axios.get(url, {
    headers: {
      'httpAccept' : 'text/xml',
      'X-ELS-APIKey' : elsApiKey,
      'Cookie': elsCookie
    },
    withCredentials: true
  });

  //console.log(`Scopus response: ${JSON.stringify(response.data['full-text-retrieval-response'], null, 2)}`)
  return response.data;
}

async function getScopusPaperAbstractDataByPii (pii) {
  const baseUrl = `https://api-elsevier-com.proxy.library.nd.edu/content/article/pii/${encodeURIComponent(pii).replace('(', '%28').replace(')', '%29')}`
  return getScopusPaperAbstractData(baseUrl)
}

async function getScopusPaperAbstractDataByEid (eid) {
  const baseUrl = `https://api-elsevier-com.proxy.library.nd.edu/content/article/eid/${encodeURIComponent(eid).replace('(', '%28').replace(')', '%29')}`
  return getScopusPaperAbstractData(baseUrl)
}

async function getScopusPaperAbstractDataByScopusId (scopusId) {
  const baseUrl = `https://api-elsevier-com.proxy.library.nd.edu/content/article/scopus_id/${encodeURIComponent(scopusId).replace('(', '%28').replace(')', '%29')}`
  return getScopusPaperAbstractData(baseUrl)
}

async function getPublications () {
  const queryResult = await client.query(readPublications())
  return queryResult.data.publications
}

//
// Takes in an array of scopus records and returns a hash of scopus id to object:
// 'year', 'title', 'journal', 'doi', 'scopus_id', 'scopus_record'
//
// scopus_fulltext_record is the original json object
function getSimplifiedScopusPaper(scopusPaper){
  // console.log(`Simplifying paper: ${JSON.stringify(scopusPaper, null, 2)}`)
  return {
    title: (scopusPaper['coredata'] && scopusPaper['coredata']['dc:title']) ? scopusPaper['coredata']['dc:title'] : '',
    journal: (scopusPaper['coredata'] && scopusPaper['coredata']['prism:publicationName']) ? scopusPaper['coredata']['prism:publicationName'] : '',
    doi: (scopusPaper['coredata'] && scopusPaper['coredata']['prism:doi']) ? scopusPaper['coredata']['prism:doi'] : '',
    eid: (scopusPaper['coredata'] && scopusPaper['coredata']['eid']) ? scopusPaper['coredata']['eid']: '',
    scopus_abstract: (scopusPaper['coredata'] && scopusPaper['coredata']['dc:description']) ? scopusPaper['coredata']['dc:description'] : '',
    scopus_fulltext_record : scopusPaper
  }
}

async function main (): Promise<void> {

  const publications = await getPublications()
  const publicationsBySource = await _.groupBy(publications, (publication) => {
    return publication['source_name']
  })

  //const publication = publicationsBySource['Scopus'][0]
  const simplifiedScopusPapers = []
  let succeededScopusPapers = []
  let failedScopusPapers = []

  let paperCounter = 0
  await pMap(publicationsBySource['Scopus'], async (publication) => {
    
    try {
      paperCounter += 1
      randomWait(1000,paperCounter)
      
      let scopusAbstractData = undefined
      const eid = publication.scopus_eid
      const piiParts = eid.split('-')
      const pii = piiParts[piiParts.length - 1]
      if (publication.scopus_pii) {
        const pii = publication.scopus_pii
        scopusAbstractData = await getScopusPaperAbstractDataByPii(pii)
      // } else {
      //   const dcId = publication.source_metadata['dc:identifier']
      //   if (dcId) {
      //     const scopusId = dcId.replace('SCOPUS_ID:', '')
      //     scopusAbstractData = await getScopusPaperAbstractDataByScopusId(scopusId)
      //   } else if (publication.scopus_eid) {
      //     const eid = publication.scopus_eid
      //     scopusAbstractData = await getScopusPaperAbstractDataByEid(eid)
      //   }
      // }
      }
      if (scopusAbstractData) {
        if (_.isArray(scopusAbstractData['full-text-retrieval-response'])){
          const simplifiedScopusPaper = getSimplifiedScopusPaper(scopusAbstractData['full-text-retrieval-response'][0])
          succeededScopusPapers.push(simplifiedScopusPaper)
        } else {
          const simplifiedScopusPaper = getSimplifiedScopusPaper(scopusAbstractData['full-text-retrieval-response'])
          succeededScopusPapers.push(simplifiedScopusPaper)
          if (simplifiedScopusPaper.scopus_abstract) {
            console.log(JSON.stringify(succeededScopusPapers[0], null, 2))    
          }
        }
        // console.log(`Succeeded getting paper: ${JSON.stringify(simplifiedScopusPaper, null, 2)}`)
      }
    } catch (error) {
      const errorMessage = `Error on get scopus papers for doi: ${publication.doi}: ${error}`
      failedScopusPapers.push(errorMessage)
      console.log(error)
    }
  }, {concurrency: 3})

  console.log(JSON.stringify(failedScopusPapers, null, 2))
  _.each(succeededScopusPapers, (paper) => {
    if (paper.scopus_abstract) {
      console.log(JSON.stringify(succeededScopusPapers[0], null, 2))    
    }
  })

  // write data out to csv
  // flatten out array for data for csv and change scopus json object to string
  const outputScopusPapers = _.map(_.flatten(succeededScopusPapers), paper => {
    paper['scopus_fulltext_record'] = JSON.stringify(paper['scopus_fulltext_record'])
    return paper
  })

  //console.log(outputScopusPapers)
  await writeCsv({
    path: `../data/scopus_full_metadata.${moment().format('YYYYMMDDHHmmss')}.csv`,
    data: outputScopusPapers,
  });
  //  }
  // })
  // _.each(_.keys(abstracts), (doi) => {
  //   if (!abstracts[doi]){
  //     console.log(`Found Doi with null abstract: ${doi}`)
  //   } else {
  //     console.log('Found doi with existing abstract')
  //     console.log(`Writing abstract for doi: ${doi} abstract: ${abstracts[doi]}`)
  //     const resultUpdatePubAbstracts = client.mutate(updatePubAbstract(doi, abstracts[doi]))
  //     console.log(`Returned result: ${resultUpdatePubAbstracts}`)
  //   }
  // })

  // insert abstracts from PubMed
  // const dois = _.keys(abstracts)
  // const doi = '10.1002/ijc.24347'

  // console.log(`Writing abstract for doi: ${doi} abstract: ${abstracts[doi]}`)
  // const resultUpdatePubAbstracts = await client.mutate(updatePubAbstract(doi, abstracts[doi]))
  // console.log(`Returned result: ${resultUpdatePubAbstracts.data}`)
  // // next grab abstracts from Scopus using the scopus id and call to content/abstract
  // then update DB by DOI and publication id
  // in UI display the abstract that exists from any source
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main()
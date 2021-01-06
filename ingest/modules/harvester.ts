import _ from 'lodash'
import pMap from 'p-map'
import { command as writeCsv } from '../units/writeCsv'
import { dateRangesOverlapping } from '../units/dateRange'
import { randomWait } from '../units/randomWait'
import moment from 'moment'

export class Harvester {
  ds: DataSource

  constructor (ds: DataSource) {
    this.ds = ds
  }

  // TODO: Multiple harvest methods for different datasource queries?
  //
  // threadCount and waitInterval are optional parameters
  // It assumes that threadCount will be defined if you are also defining waitInterval
  //
  // threadCount default = 1 concurrent thread
  // waitInterval desc: wait time between harvests of each person search default = 1000 milliseconds in miliseconds
  async harvest (searchPersons: NormedPerson[], searchStartDate: Date, searchEndDate: Date = undefined, threadCount: number = 1, waitInterval: number = 1000) {
    let personCounter = 0
    let succeededPapers = []
    let failedPapers = []
    let succeededAuthors = []
    let failedAuthors = []
    await pMap(searchPersons, async (person) => {
      try {
        personCounter += 1
        console.log(`Getting publications for ${person.familyName}, ${person.givenName}`)
        await randomWait(0, waitInterval)
        
        // check that person start date and end date has some overlap with search date range
        if (dateRangesOverlapping(person.startDate, person.endDate, searchStartDate, searchEndDate)) {
          const harvestSet = await this.ds.getPublicationsByAuthorName(person, 0, searchStartDate, searchEndDate)
          console.log(`${this.ds.getSourceName()} Total Pubs found for author: ${person.familyName}, ${person.givenName}, ${harvestSet.totalResults}`)
          console.log(`${this.ds.getSourceName()} Pubs found length for author: ${person.familyName}, ${person.givenName}, ${harvestSet.publications.length}`)
          const normedPublications: NormedPublication[] = this.ds.getNormedPublications(harvestSet.publications)
          // console.log(`normed papers are: ${JSON.stringify(simplifiedPapers, null, 2)}`)
          //push in whole array for now and flatten later
          console.log(`${this.ds.getSourceName()} NormedPubs found length for author: ${person.familyName}, ${person.givenName}, ${normedPublications.length}`)
          succeededPapers.push(normedPublications)
          succeededAuthors.push(person)
        } else {
          console.log(`Warning: Skipping harvest of '${person.familyName}, ${person.givenName}' because person start date: ${person.startDate} and end date ${person.endDate} not within search start date ${searchStartDate} and end date ${searchEndDate}.)`)
        }
      } catch (error) {
        const errorMessage = `Error on get papers for author: ${person.familyName}, ${person.givenName}: ${error}`
        failedPapers.push(errorMessage)
        failedAuthors.push(person)
        console.log(errorMessage)
      }
    }, {concurrency: threadCount})

    return {
      'foundPublications': _.flattenDepth(succeededPapers, 1),
      'succeededAuthors': succeededAuthors,
      'errors': failedPapers,
      'failedAuthors': failedAuthors
    }
  }

  async harvestToCsv(searchPersons: NormedPerson[], searchStartDate: Date, searchEndDate: Date) {
    const harvested = await this.harvest(searchPersons, searchStartDate, searchEndDate, 1)
    const outputPapers = _.map(_.flatten(harvested['foundPublications']), pub => {
      pub['source_metadata'] = JSON.stringify(pub['source_metadata'])
      return pub
    })
    

    //write data out to csv
    //console.log(outputScopusPapers)
    await writeCsv({
      path: `../../data/${this.ds.getSourceName}.${searchStartDate.getFullYear}.${moment().format('YYYYMMDDHHmmss')}.csv`,
      data: outputPapers,
    });
  }
}
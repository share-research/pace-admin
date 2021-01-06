import { loadPersons } from '../loadPersons'
import _ from 'lodash'

const testCSVPath = './test/fixtures/persons_2020.csv'

const propMapNoLowercase = {
  ID: 'ID',
  givenName: 'Given_name',
  familyName: 'Family_Name',
  startDate: 'Start_Date',
  endDate: 'End_Date'
}
const propMapLowercaseKeysOnly = {
  id: 'ID',
  givenname: 'Given_name',
  familyname: 'Family_Name',
  startdate: 'Start_Date',
  enddate: 'End_Date'
}
const propMapAllLowercase = {
  id: 'id',
  givenname: 'given_name',
  familyname: 'family_name',
  startdate: 'start_date',
  enddate: 'end_date'
}

const expectedUnchangedColumns = [
  'id',
  'Given_name',
  'Family_Name',
  'Email',
  'Position_Title',
  'Institution_Id',
  'Start_Date',
  'End_Date'
]
const expectedLowerColumns = [
  'id',
  'given_name',
  'family_name',
  'email',
  'position_title',
  'institution_id',
  'start_date',
  'end_date'
]

const defaultExpectedPersons = [
  {
    id: 1,
    familyName: 'Alber',
    givenNameInitial: 'M',
    givenName: 'Mark',
    startDate: new Date('1/1/2017'),
    endDate: new Date('12/31/2017'),
    sourceIds: {
      scopusAffiliationId: undefined
    }
  }
]

test('test load persons works with property map with no lowerCase keys or values', async () => {
  expect.hasAssertions()
  const persons: NormedPerson[] = await loadPersons(testCSVPath, propMapNoLowercase)
  expect(persons).toEqual(expect.arrayContaining(defaultExpectedPersons))
})

test('test load persons works with property map with lowerCase propertyNames and non lowerCase mapped column names', async () => {
  expect.hasAssertions()
  const persons: NormedPerson[] = await loadPersons(testCSVPath, propMapLowercaseKeysOnly)
  expect(persons).toEqual(expect.arrayContaining(defaultExpectedPersons))
})
test('test load persons works with property map with lowerCase propertyNames and lowerCase mapped column names', async () => {
  expect.hasAssertions()
  const persons: NormedPerson[] = await loadPersons(testCSVPath, propMapAllLowercase)
  expect(persons).toEqual(expect.arrayContaining(defaultExpectedPersons))
})
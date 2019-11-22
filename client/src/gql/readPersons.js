import gql from 'graphql-tag'

export default function readPersons () {
  return {
    query: gql`
      query MyQuery {
        person (order_by: {persons_publications_aggregate: {count: desc}}){
          id
          given_name
          family_name
          person_publication_aggregate {
            aggregate {
              count
            }
          }
        }
      }
    `
  }
}

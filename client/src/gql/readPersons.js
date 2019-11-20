import gql from 'graphql-tag'

export default function readPersons () {
  return {
    query: gql`
      query MyQuery {
        persons (order_by: {persons_publications_aggregate: {count: desc}}){
          id
          given_name
          family_name
          persons_publications_aggregate {
            aggregate {
              count
            }
          }
        }
      }
    `
  }
}

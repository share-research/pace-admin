import gql from 'graphql-tag'

export default function readAuthorsByPublications (id) {
  return {
    query: gql`
      query MyQuery ($publication_id: Int!){
        authors_publications(
          where: {
              id: {_eq: $publication_id}
          }
        ){
            publication_id
            id
            family_name
            given_name
            position
        }
      }
    `,
    variables: {
      publication_id: id
    }
  }
}

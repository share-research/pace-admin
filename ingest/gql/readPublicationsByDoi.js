import gql from 'graphql-tag'

export default function readPublicationsByDoi (doi) {
  return {
    query: gql`
      query MyQuery ($doi: String!){
        publications (
          where: {
            doi: {_eq: $doi}
          }
        ){
          id
          title
          doi
          year
          csl_string
          csl
          source_name
          source_metadata
          scopus_eid: source_metadata(path: "eid")
          scopus_pii: source_metadata(path: "pii")
          pubmed_resource_identifiers: source_metadata(path: "resourceIdentifiers")
          journal_title: csl(path: "container-title")
        }
      }
    `,
    variables: {
      doi
    }
  }
}

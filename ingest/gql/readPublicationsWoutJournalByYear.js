import gql from 'graphql-tag'

export default function readPublicationsWoutJournalByYear (year) {
  return {
    query: gql`
      query MyQuery ($year: Int!){
        publications (where: {journal_id: {_is_null: true}, year: {_eq: $year}}) {
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
          wos_id: source_metadata(path: "uid")
          pubmed_resource_identifiers: source_metadata(path: "resourceIdentifiers")
          journal_title: csl(path: "container-title")
        }
      }
    `,
    variables: {
      year
    }
  }
}

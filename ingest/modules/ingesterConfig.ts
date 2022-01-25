export default interface IngesterConfig {
  minConfidence: Number,
  confidenceAlgorithmVersion: string,
  checkForNewPersonMatches: boolean,
  overwriteConfidenceSets: boolean,
  outputWarnings: boolean,
  outputPassed: boolean,
  defaultWaitInterval: number
  confirmedAuthorFileDir: string,
  defaultToBibTex: boolean,
  dedupByDoi: boolean,
  stagedIngestDir: string,
  outputIngestDir: string
  centerMemberYear: number,
  loggingBatchSize: number,
  loadPageSize?: number,
}
<template>
  <div class="q-pa-md yearFilter" style="min-width:300px">
    <q-range
      v-model="selectedPubYears"
      :step="1"
      :min="yearPubStaticMin"
      :max="yearPubStaticMax"
      @change="updatePubYears()"
      label-always
      snap
    />
    <q-item-label>Publication Year(s)</q-item-label>
  </div>
</template>

<script>
import { sync } from 'vuex-pathify'

import getYearFilterYears from '../../../gql/getYearFilterYears.gql'
import _ from 'lodash'

export default {
  data () {
    return {
    }
  },
  computed: {
    yearPubStaticMin: sync('filter/yearPubStaticMin'),
    yearPubStaticMax: sync('filter/yearPubStaticMax'),
    selectedPubYears: sync('filter/selectedPubYears'),
    changedPubYears: sync('filter/changedPubYears')
  },
  async created () {
    this.fetchData()
  },
  watch: {
    $route: 'fetchData'
  },
  methods: {
    async fetchData () {
      const results = await this.$apollo.query({
        query: getYearFilterYears
      })
      this.yearPubStaticMin = _.get(results, 'data.publications_aggregate.aggregate.min.year', 1800)
      this.yearPubStaticMax = _.get(results, 'data.publications_aggregate.aggregate.max.year', 2200)
      if (this.changedPubYears === undefined) {
        // set to current year minus - 1
        const currentDate = new Date(Date.now())
        const currentYear = currentDate.getFullYear()
        const lastYear = currentYear - 1
        this.selectedPubYears = {
          min: lastYear,
          max: lastYear
        }
      }
    },
    async updatePubYears () {
      if (this.selectedPubYears.min < this.yearPubStaticMin) this.selectedPubYears.min = this.yearPubStaticMin
      if (this.selectedPubYears.max > this.yearPubStaticMax) this.selectedPubYears.max = this.yearPubStaticMax
      this.changedPubYears = this.selectedPubYears
    }
  }
}
</script>

<style scoped>
  .yearFilter {
    padding-left: 40px;
    padding-right: 40px;
  }
</style>

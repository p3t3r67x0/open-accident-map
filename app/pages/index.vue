<template>
  <div class="page">
    <div class="page__wrapper">
      <div class="page__left">
        <ClientOnly>
          <AccidentMap
            :meta="metaData ?? null"
            :filters="filters"
            :districts="districtFeatures"
            @accident-selected="handleAccidentSelected"
          />
          <template #fallback>
            <div class="page__fallback">
              Karte wird geladen...
            </div>
          </template>
        </ClientOnly>
      </div>
      <div class="page__right">
        <FilterPanel
          :meta="metaData ?? null"
          :filters="filters"
          :details="selectedDetails"
          :districts="districtOptions"
          @update:filters="handleFilterUpdate"
        />
      </div>
    </div>
    <footer class="site-footer text-sm">
      <NuxtLink class="inline-block text-gray-600 hover:text-gray-900 focus:text-gray-900" to="/impressum">
        Impressum
      </NuxtLink>
      <span class="inline-block text-gray-600 px-3">|</span>
      <NuxtLink class="inline-block text-gray-600 hover:text-gray-900 focus:text-gray-900" to="/impressum#privacypolicy">
        Datenschutzerklärung
      </NuxtLink>
      <span class="inline-block text-gray-600 px-3">|</span>
      <NuxtLink class="inline-block text-gray-600 hover:text-gray-900 focus:text-gray-900" to="/lizenz">
        Lizenz
      </NuxtLink>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import type { AccidentDetail, AccidentFilters, MetaMap, DistrictOption, DistrictProperties } from '@/types/accident'

const filters = ref<AccidentFilters>({
  district: null,
  years: [],
  utyp1: null,
  uart: null,
})

const selectedDetails = ref<AccidentDetail[]>([])

const { data: metaData } = useFetch<MetaMap>('/data/meta.json', { server: false })
const { data: districtData } = useFetch<FeatureCollection<Polygon | MultiPolygon, DistrictProperties>>('/data/flensburg_stadtteile.geojson', { server: false })

const districtFeatures = computed<Feature[]>(() => {
  if (!districtData.value?.features) {
    return []
  }

  return districtData.value.features as Feature<Polygon | MultiPolygon, DistrictProperties>[]
})

const districtOptions = computed<DistrictOption[]>(() => {
  return districtFeatures.value
    .map((feature) => {
      const props = feature.properties as DistrictProperties | undefined
      const rawName = props?.AREA_NAME ?? ''
      const cleanedName = rawName.replace(/^\d+\s*/, '').trim() || rawName

      return {
        id: props?.AREA_ID ?? cleanedName,
        name: cleanedName,
      }
    })
    .filter((option) => option.id && option.name)
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
})

const handleAccidentSelected = (details: AccidentDetail[]) => {
  selectedDetails.value = details
}

const handleFilterUpdate = (value: AccidentFilters) => {
  filters.value = value
}
</script>

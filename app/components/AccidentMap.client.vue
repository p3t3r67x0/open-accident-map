<template>
  <div ref="container" class="h-full w-full min-h-[24rem]"></div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type {
  AccidentDetail,
  AccidentFilters,
  AccidentProperties,
  DistrictProperties,
  MetaMap,
} from '@/types/accident'
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import type { CircleMarker, GeoJSON, LatLngBounds, Map as LeafletMap, Path } from 'leaflet'

type DistrictFeature = Feature<Polygon | MultiPolygon, DistrictProperties>

const props = withDefaults(defineProps<{
  meta: MetaMap | null
  filters: AccidentFilters
  districts: DistrictFeature[]
}>(), {
  districts: () => [],
})

const emit = defineEmits<{
  (event: 'accident-selected', payload: AccidentDetail[]): void
}>()

const container = ref<HTMLDivElement | null>(null)

const isReady = computed(() => Boolean(props.meta))

let leaflet: typeof import('leaflet') | null = null
let map: LeafletMap | null = null
let districtsLayer: GeoJSON | null = null
let accidentsLayer: GeoJSON | null = null
let accidentData: FeatureCollection | null = null
let currentDistrict: Path | null = null
let currentMarker: CircleMarker | null = null
let currentMarkerProps: AccidentProperties | null = null
let districtGeometries: Record<string, Polygon | MultiPolygon> = {}
let districtLayers: Record<string, Path> = {}

const destroyMap = () => {
  if (map) {
    map.remove()
  }

  map = null
  districtsLayer = null
  accidentsLayer = null
  accidentData = null
  currentDistrict = null
  currentMarker = null
  currentMarkerProps = null
  districtGeometries = {}
  districtLayers = {}
}

const removeLeadingZero = (value: string | null): number | null => {
  if (value === null || value === undefined) {
    return null
  }

  if (value.startsWith('0')) {
    return parseInt(value.substring(1), 10)
  }

  return parseInt(value, 10)
}

const calculateRadius = (zoom: number): number => {
  if (zoom >= 16) {
    return 6
  }

  if (zoom >= 13) {
    return 4
  }

  return 2
}

const resolveMeta = (key: keyof MetaMap, value: string | null | undefined) => {
  if (!props.meta || value === undefined || value === null) {
    return undefined
  }

  const normalized = removeLeadingZero(value)

  return props.meta[key]?.find((item) => item.id === normalized)
}

const buildDetails = (properties: AccidentProperties): AccidentDetail[] => {
  const details: AccidentDetail[] = []

  const ukategorie = resolveMeta('ukategorie', properties.ukategorie)
  const utyp1 = resolveMeta('utyp1', properties.utyp1)
  const uart = resolveMeta('uart', properties.uart)
  const ulichtverh = resolveMeta('ulichtverh', properties.ulichtverh)
  const uland = resolveMeta('uland', properties.uland)
  const uwochentag = resolveMeta('uwochentag', properties.uwochentag)
  const umonat = resolveMeta('umonat', properties.umonat)
  const istrad = resolveMeta('istrad', properties.istrad)
  const istpkw = resolveMeta('istpkw', properties.istpkw)
  const istfuss = resolveMeta('istfuss', properties.istfuss)
  const istgkfz = resolveMeta('istgkfz', properties.istgkfz)
  const istkrad = resolveMeta('istkrad', properties.istkrad)
  const istsonstig = resolveMeta('istsonstig', properties.istsonstig)

  if (ukategorie) {
    details.push({
      key: 'ukategorie',
      label: '',
      value: ukategorie.name,
      highlight: true,
    })
  }

  if (utyp1) {
    details.push({
      key: 'utyp1',
      label: 'Unfalltyp',
      value: utyp1.name,
    })
  }

  if (uart) {
    details.push({
      key: 'uart',
      label: 'Unfallart',
      value: uart.name,
    })
  }

  details.push({
    key: 'ujahr',
    label: 'Jahr',
    value: properties.ujahr,
  })

  details.push({
    key: 'ustunde',
    label: 'Ungefähr',
    value: `${properties.ustunde} Uhr`,
  })

  if (umonat) {
    details.push({
      key: 'umonat',
      label: 'Monat',
      value: umonat.name,
    })
  }

  if (uwochentag) {
    details.push({
      key: 'uwochentag',
      label: 'Tag',
      value: uwochentag.name,
    })
  }

  if (uland) {
    details.push({
      key: 'uland',
      label: 'Bundesland',
      value: uland.name,
    })
  }

  if (ulichtverh) {
    details.push({
      key: 'ulichtverh',
      label: 'Lichtverhältnisse',
      value: ulichtverh.name,
    })
  }

  ;[
    { entry: istrad, key: 'istrad' },
    { entry: istpkw, key: 'istpkw' },
    { entry: istfuss, key: 'istfuss' },
    { entry: istgkfz, key: 'istgkfz' },
    { entry: istkrad, key: 'istkrad' },
    { entry: istsonstig, key: 'istsonstig' },
  ].forEach(({ entry, key }) => {
    if (entry) {
      details.push({
        key,
        label: '-',
        value: entry.name,
      })
    }
  })

  return details
}

const isPointInRing = (point: [number, number], ring: number[][]): boolean => {
  let inside = false

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]

    const intersects = ((yi > point[1]) !== (yj > point[1])) &&
      (point[0] < ((xj - xi) * (point[1] - yi)) / ((yj - yi) || Number.EPSILON) + xi)

    if (intersects) {
      inside = !inside
    }
  }

  return inside
}

const pointInPolygonCoordinates = (point: [number, number], coordinates: number[][][]): boolean => {
  if (!coordinates.length) {
    return false
  }

  if (!isPointInRing(point, coordinates[0])) {
    return false
  }

  for (let i = 1; i < coordinates.length; i += 1) {
    if (isPointInRing(point, coordinates[i])) {
      return false
    }
  }

  return true
}

const geometryContainsPoint = (
  point: [number, number],
  geometry: Polygon | MultiPolygon,
): boolean => {
  if (geometry.type === 'Polygon') {
    return pointInPolygonCoordinates(point, geometry.coordinates as number[][][])
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((polygon) => pointInPolygonCoordinates(point, polygon as number[][][]))
  }

  return false
}

const matchesFilters = (feature: Feature): boolean => {
  const { filters } = props
  const properties = feature.properties as AccidentProperties

  if (filters.years.length > 0 && !filters.years.includes(properties.ujahr)) {
    return false
  }

  if (
    filters.utyp1 !== null &&
    removeLeadingZero(properties.utyp1) !== filters.utyp1
  ) {
    return false
  }

  if (filters.uart !== null && removeLeadingZero(properties.uart) !== filters.uart) {
    return false
  }

  if (filters.district) {
    const geometry = districtGeometries[filters.district]
    if (!geometry) {
      return false
    }

    if (feature.geometry?.type !== 'Point') {
      return false
    }

    const coordinates = feature.geometry.coordinates as [number, number]
    const point: [number, number] = [coordinates[0], coordinates[1]]

    if (!geometryContainsPoint(point, geometry)) {
      return false
    }
  }

  return true
}

const highlightDistrict = (layer: Path) => {
  if (currentDistrict) {
    currentDistrict.setStyle({ fillColor: '#fff' })
  }

  layer.setStyle({ fillColor: '#d1e4fd' })
  currentDistrict = layer
}

const highlightMarker = (marker: CircleMarker) => {
  if (currentMarker) {
    currentMarker.setStyle({ color: '#f95016' })
  }

  marker.setStyle({ color: '#0033ff' })
  currentMarker = marker
}

const resetDistrictHighlight = () => {
  if (currentDistrict) {
    currentDistrict.setStyle({ fillColor: '#fff' })
    currentDistrict = null
  }
}

const syncDistrictHighlight = () => {
  if (!props.filters.district) {
    resetDistrictHighlight()
    return
  }

  const layer = districtLayers[props.filters.district]
  if (layer) {
    highlightDistrict(layer)

    // Focus the map on the selected district for easier navigation
    const bounds = (layer as Path & { getBounds?: () => LatLngBounds }).getBounds?.()
    if (bounds?.isValid() && map) {
      map.fitBounds(bounds, {
        padding: [100, 60, 160, 60],
        maxZoom: 16,
      })
    }
  } else {
    resetDistrictHighlight()
  }
}

const setupDistrictLayer = () => {
  if (!leaflet || !map) {
    return
  }

  if (!props.districts || props.districts.length === 0) {
    return
  }

  if (districtsLayer) {
    districtsLayer.remove()
  }

  districtGeometries = {}
  districtLayers = {}
  resetDistrictHighlight()

  const featureCollection: FeatureCollection<Polygon | MultiPolygon, DistrictProperties> = {
    type: 'FeatureCollection',
    features: props.districts,
  }

  districtsLayer = leaflet.geoJSON(featureCollection, {
    style: {
      fillColor: '#fff',
      fillOpacity: 0.6,
      color: '#989898',
      weight: 2,
    },
    onEachFeature: (feature, layer) => {
      const properties = feature.properties as DistrictProperties | undefined
      const districtId = properties?.AREA_ID

      if (districtId) {
        districtGeometries[districtId] = feature.geometry as Polygon | MultiPolygon
        districtLayers[districtId] = layer as Path
      }

      layer.on('click', () => {
        highlightDistrict(layer as Path)
      })
    },
  })

  districtsLayer.addTo(map)
  districtsLayer.bringToBack()

  if (accidentData) {
    renderAccidents()
  }

  if (accidentsLayer) {
    const group = leaflet.featureGroup([districtsLayer, accidentsLayer])
    const bounds = group.getBounds()

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [100, 50, 50, 50],
        maxZoom: 16,
      })
    }
  }

  syncDistrictHighlight()
}

const getTooltip = (props: AccidentProperties) => {
  const type = resolveMeta('utyp1', props.utyp1)
  return type ? `${type.name}, ${props.ujahr}` : props.ujahr
}

const buildAccidentLayer = (collection: FeatureCollection) => {
  if (!leaflet) {
    throw new Error('Leaflet is not initialised')
  }

  return leaflet.geoJSON(collection, {
    pointToLayer: (feature, latlng) => {
      const zoom = map?.getZoom() ?? 13
      const marker = leaflet!.circleMarker(latlng, {
        weight: 0,
        radius: calculateRadius(zoom),
        color: '#f95016',
        fillOpacity: 1,
      })

      marker.on('click', () => {
        if (!map) {
          return
        }

        highlightMarker(marker)

        const currentZoom = map.getZoom()
        const targetZoom = currentZoom < 18 ? 18 : currentZoom
        map.setView(latlng, targetZoom)

        if (feature?.properties) {
          const props = feature.properties as AccidentProperties
          currentMarkerProps = props
          const details = buildDetails(props)
          emit('accident-selected', details)
        }
      })

      if (feature?.properties) {
        marker.bindTooltip(getTooltip(feature.properties as AccidentProperties))
      }

      return marker
    },
  })
}

const renderAccidents = (resetSelection = false) => {
  if (!map || !leaflet || !accidentData) {
    return
  }

  if (accidentsLayer) {
    accidentsLayer.remove()
    accidentsLayer = null
  }

  const filteredFeatures = accidentData.features?.filter((feature) =>
    matchesFilters(feature as Feature),
  ) ?? []

  const filteredCollection: FeatureCollection = {
    ...accidentData,
    features: filteredFeatures,
  }

  accidentsLayer = buildAccidentLayer(filteredCollection)
  accidentsLayer.addTo(map)
  accidentsLayer.bringToFront()

  const zoom = map.getZoom()
  accidentsLayer.eachLayer((layer) => {
    const circle = layer as CircleMarker
    circle.setStyle({ radius: calculateRadius(zoom) })
  })

  if (resetSelection) {
    currentMarker = null
    currentMarkerProps = null
    emit('accident-selected', [])
  }
}

const initialiseMap = async () => {
  if (map || !container.value) {
    return
  }

  try {
    leaflet = await import('leaflet')

    map = leaflet.map(container.value, {
      maxZoom: 19,
    }).setView([54.7836, 9.4121], 2)

    leaflet.tileLayer('https://tiles.oklabflensburg.de/sgm/{z}/{x}/{y}.png', {
        maxZoom: 20,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="dc:rights">OpenStreetMap</a> contributors'
    }).addTo(map)

    accidentData = await fetch('https://api.oklabflensburg.de/accident/v1/details?query=Flensburg', {
      headers: {
        Accept: 'application/json',
      },
    }).then((res) => res.json())

    if (props.districts?.length) {
      setupDistrictLayer()
    }

    renderAccidents()

    if (districtsLayer && accidentsLayer) {
      const group = leaflet.featureGroup([districtsLayer, accidentsLayer])
      const bounds = group.getBounds()
      const center = bounds.getCenter()
      map.setView([center.lat + 0.01, center.lng], 13)
    }

    map.on('zoomend', () => {
      if (!map || !accidentsLayer) {
        return
      }

      const zoom = map.getZoom()
      accidentsLayer.eachLayer((layer) => {
        const circle = layer as CircleMarker
        circle.setStyle({ radius: calculateRadius(zoom) })
      })
    })
  } catch (error) {
    console.error('Failed to initialise map', error)
  }
}

onMounted(() => {
  if (isReady.value) {
    initialiseMap()
  }
})

watch(isReady, (ready) => {
  if (ready) {
    initialiseMap()
  }
})

watch(
  () => props.filters,
  () => {
    renderAccidents(true)
  },
  { deep: true },
)

watch(
  () => props.filters.district,
  () => {
    syncDistrictHighlight()
  },
)

watch(
  () => props.districts,
  () => {
    if (!map || !leaflet) {
      return
    }

    setupDistrictLayer()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  destroyMap()
})
</script>

<style scoped>
.leaflet-container {
  min-height: 24rem;
}
</style>

<template>
  <div
    class="filter-panel"
    :class="{
      'filter-panel--expanded': isExpanded,
      'filter-panel--desktop': isDesktop,
    }"
  >
    <button
      type="button"
      class="filter-panel__handle"
      @click="togglePanel"
      @touchstart.stop="onTouchStart"
      @touchend.stop="onTouchEnd"
      :aria-expanded="isExpanded"
      aria-controls="filter-panel-content"
      aria-label="Filterbereich umschalten"
    >
      <span class="filter-panel__handle-bar" />
    </button>

    <div
      id="filter-panel-content"
      v-show="isExpanded || isDesktop"
      class="filter-panel__content"
      @touchstart.stop="onTouchStart"
      @touchend.stop="onTouchEnd"
    >
      <div class="py-2 px-3">
        <h1 class="text-2xl md:text-3xl font-bold">Unfallkarte 2023</h1>
        <h2 class="text-xl md:text-2xl mb-2 md:mb-4">Stadtplan für Flensburg</h2>
      </div>

      <div class="px-3">
        <div v-if="details.length" class="mb-4 md:mb-8">
          <ul class="p-3 space-y-2 bg-gray-700 text-white">
            <li v-for="item in details" :key="item.key">
              <template v-if="item.highlight">
                <span class="text-xl font-semibold">{{ item.value }}</span>
              </template>
              <template v-else-if="item.label === '-'">
                <span class="font-semibold mr-2">{{ item.label }}</span>
                <span>{{ item.value }}</span>
              </template>
              <template v-else>
                <span v-if="item.label" class="font-semibold mr-2">{{ item.label }}</span>
                <span>{{ item.value }}</span>
              </template>
            </li>
          </ul>
        </div>
        <div v-else class="mb-4 md:mb-8 rounded bg-white p-3 text-gray-600">
          Wähle einen Unfallpunkt auf der Karte, um weitere Details zu sehen.
        </div>
      </div>
      <form class="px-3" @submit.prevent>
        <div class="m-4 mt-0" id="districtWrapper">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="district">
            Stadtteil auswählen
          </label>
          <select
            id="district"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline cursor-pointer"
            :value="filters.district ?? ''"
            @change="updateFilters({ district: parseDistrictValue($event) })"
          >
            <option value="">Alle Stadtteile</option>
            <option v-for="district in districtOptions" :key="district.id" :value="district.id">
              {{ district.name }}
            </option>
          </select>
        </div>
        <hr>
        <div class="m-4" id="utyp1Wrapper">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="utyp1">
            Unfall Typ auswählen
          </label>
          <select
            id="utyp1"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline cursor-pointer"
            :value="filters.utyp1 ?? 0"
            @change="updateFilters({ utyp1: parseSelectValue($event) })"
          >
            <option :value="0">Keine Auswahl</option>
            <option
              v-for="entry in meta?.utyp1 ?? []"
              :key="entry.id"
              :value="entry.id"
            >
              {{ entry.name }}
            </option>
          </select>
        </div>
        <hr>
        <div class="m-4" id="uartWrapper">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="uart">
            Unfall Hergang auswählen
          </label>
          <select
            id="uart"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline cursor-pointer"
            :value="filters.uart ?? 0"
            @change="updateFilters({ uart: parseSelectValue($event) })"
          >
            <option :value="0">Keine Auswahl</option>
            <option
              v-for="entry in meta?.uart ?? []"
              :key="entry.id"
              :value="entry.id"
            >
              {{ entry.name }}
            </option>
          </select>
        </div>
        <hr>
        <div class="m-4">
          <span class="font-bold text-gray-500">Jahre</span>
        </div>
        <div class="m-4 flex flex-wrap gap-y-2">
          <label
            v-for="year in yearRows[0]"
            :key="year"
            class="flex w-1/3 items-center justify-center gap-2 px-2 py-2 text-gray-500 font-bold cursor-pointer"
          >
            <input
              class="mr-2 leading-tight"
              type="checkbox"
              :value="year"
              :checked="filters.years.includes(year)"
              @change="toggleYear(year, ($event.target as HTMLInputElement).checked)"
            >
            <span class="text-sm">{{ year }}</span>
          </label>
        </div>
        <div class="m-4 flex flex-wrap gap-y-2">
          <label
            v-for="year in yearRows[1]"
            :key="year"
            class="flex w-1/3 items-center justify-center gap-2 px-2 py-2 text-gray-500 font-bold cursor-pointer"
          >
            <input
              class="mr-2 leading-tight"
              type="checkbox"
              :value="year"
              :checked="filters.years.includes(year)"
              @change="toggleYear(year, ($event.target as HTMLInputElement).checked)"
            >
            <span class="text-sm">{{ year }}</span>
          </label>
        </div>
        <div class="m-4 flex flex-wrap gap-y-2">
          <label
            v-for="year in yearRows[2]"
            :key="year"
            class="flex w-1/3 items-center justify-center gap-2 py-2 text-gray-500 font-bold cursor-pointer"
          >
            <input
              class="mr-2 leading-tight"
              type="checkbox"
              :value="year"
              :checked="filters.years.includes(year)"
              @change="toggleYear(year, ($event.target as HTMLInputElement).checked)"
            >
              <span class="text-sm">{{ year }}</span>
          </label>
        </div>
      </form>

      <div class="pb-2 px-3 space-y-6">
        <section>
          <h3 class="text-xl md:text-2xl mb-2 md:mb-3">Verkehrslenkung</h3>
          <p class="font-mono">
            Während einer kleinen Brainstorming Session ist diese interaktive Karte mit den Daten des Bundesamtes für Kartographie
            und Geodäsie entstanden. Nach einigen Stunden der maschinellen Aufarbeitung und Betrachtung der Datensätze haben
            wir uns entschlossen, die Daten in eine Postgis Postgres Datenbank einzupflegen und zu indexieren. Unser Ziel ist es
            Entscheidungsträgern in Kommunen, Verwaltungen und auch privaten Unternehmen eine Datenbasierte Entscheidung anhand
            von Daten und Ereignissen zu treffen.
          </p>
        </section>
        <section>
          <h3 class="text-xl md:text-2xl mb-2 md:mb-3">Überlegungen</h3>
          <p class="font-mono">
            Wir haben uns mit folgenden Fragestellungen auseinandergesetzt, welche Straßen oder Kreuzungen sind besonders häufig
            von Unfällen betroffen? An welchen Orten häufen sich Verkehrsunfälle mit Todesfolge oder Schwerstverletzen? Welche
            Informationen werden der Allgemeinheit über
            <a class="text-blue-600 hover:text-blue-500 focus:text-blue-500" href="https://overpass-turbo.eu" target="_blank" rel="noopener">
              OpenStreetMap
            </a>
            angeboten?
          </p>
        </section>
        <section>
          <h3 class="text-xl md:text-2xl mb-2 md:mb-3">Quellcode</h3>
          <p class="font-mono">
            Der aktuelle Entwicklungsstand kann auf
            <a class="text-blue-600 hover:text-blue-500 focus:text-blue-500" href="https://github.com/oklabflensburg/open-accident-map" target="_blank" rel="noopener">
              GitHub
            </a>
            eingesehen werden und von jeder Kommune, Stadt oder Land kostenfrei und lizenzfrei genutzt und redeployed werden.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, withDefaults } from 'vue'
import type { AccidentDetail, AccidentFilters, MetaMap, DistrictOption } from '@/types/accident'

const props = withDefaults(defineProps<{
  meta: MetaMap | null
  filters: AccidentFilters
  details: AccidentDetail[]
  districts: DistrictOption[]
}>(), {
  districts: () => [],
})

const emit = defineEmits<{
  (e: 'update:filters', value: AccidentFilters): void
}>()

const districtOptions = computed(() => props.districts ?? [])

const yearOptions = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023']

const yearRows = computed(() => [
  yearOptions.slice(0, 3),
  yearOptions.slice(3, 6),
  yearOptions.slice(6, 8),
])

const updateFilters = (patch: Partial<AccidentFilters>) => {
  emit('update:filters', {
    ...props.filters,
    ...patch,
  })
}

const parseDistrictValue = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  return value === '' ? null : value
}

const parseSelectValue = (event: Event) => {
  const value = Number((event.target as HTMLSelectElement).value)
  return value === 0 ? null : value
}

const toggleYear = (year: string, checked: boolean) => {
  const years = new Set(props.filters.years)
  if (checked) {
    years.add(year)
  } else {
    years.delete(year)
  }

  updateFilters({ years: Array.from(years).sort() })
}

const isExpanded = ref(false)
const isDesktop = ref(false)
const touchStartY = ref<number | null>(null)
const touchEndY = ref<number | null>(null)
const touchHandled = ref(false)

const togglePanel = () => {
  if (isDesktop.value) {
    return
  }

  if (touchHandled.value) {
    touchHandled.value = false
    return
  }

  isExpanded.value = !isExpanded.value
}

const setInitialState = () => {
  if (typeof window === 'undefined') {
    return
  }

  isDesktop.value = window.innerWidth >= 768
  isExpanded.value = isDesktop.value
}

const handleResize = () => {
  if (typeof window === 'undefined') {
    return
  }

  const wasDesktop = isDesktop.value
  isDesktop.value = window.innerWidth >= 768

  if (isDesktop.value) {
    isExpanded.value = true
  } else if (wasDesktop) {
    isExpanded.value = false
  }
}

const onTouchStart = (event: TouchEvent) => {
  if (isDesktop.value) {
    return
  }

  touchStartY.value = event.touches[0].clientY
  touchHandled.value = false
}

const onTouchEnd = (event: TouchEvent) => {
  if (isDesktop.value) {
    return
  }

  if (touchStartY.value === null) {
    return
  }

  touchEndY.value = event.changedTouches[0].clientY
  const deltaY = touchStartY.value - touchEndY.value

  if (Math.abs(deltaY) < 30) {
    isExpanded.value = !isExpanded.value
    touchHandled.value = true
  } else if (deltaY > 0) {
    isExpanded.value = true
    touchHandled.value = true
  } else {
    isExpanded.value = false
    touchHandled.value = true
  }

  touchStartY.value = null
  touchEndY.value = null
}

onMounted(() => {
  setInitialState()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }
})
</script>

<style scoped>
.filter-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: auto;
  max-height: none;
  background-color: transparent;
  position: relative;
  z-index: 1100;
}

.filter-panel__content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-panel__handle {
  display: none;
}

.filter-panel__handle-bar {
  display: block;
  width: 48px;
  height: 4px;
  margin: 0 auto;
  border-radius: 9999px;
  background-color: #9ca3af; /* tailwind gray-400 */
}

@media (max-width: 767px) {
  .filter-panel {
    position: sticky;
    bottom: 0;
    border-top-left-radius: 1.5rem;
    border-top-right-radius: 1.5rem;
    background-color: #f3f4f6; /* tailwind gray-100 */
    box-shadow: 0 -10px 30px rgba(55, 65, 81, 0.15);
    overflow: hidden;
    max-height: 3.5rem;
    transition: max-height 0.3s ease;
    z-index: 1100;
  }

  .filter-panel--expanded {
    max-height: 75vh;
  }

  .filter-panel__handle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 0.75rem 0;
    background: transparent;
    cursor: pointer;
  }

  .filter-panel__content {
    overflow-y: auto;
    padding-bottom: 1.5rem;
    max-height: calc(75vh - 3.5rem);
    transition: opacity 0.2s ease;
    opacity: 1;
  }

  .filter-panel:not(.filter-panel--expanded) .filter-panel__content {
    max-height: 0;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    padding-bottom: 0;
    gap: 0;
  }
}

@media (min-width: 768px) {
  .filter-panel {
    height: 100%;
    overflow-y: auto;
    padding-top: 0;
  }

  .filter-panel__content {
    max-height: none;
  }
}

.filter-panel--desktop {
  position: static;
  max-height: none;
  border-radius: 0;
  box-shadow: none;
  background-color: transparent;
  overflow: visible;
}

.filter-panel--desktop .filter-panel__handle {
  display: none;
}
</style>

export interface MetaEntry {
  id: number
  name: string
}

export type MetaMap = Record<string, MetaEntry[]>

export interface AccidentProperties {
  ags: string
  ujahr: string
  ustunde: string
  uwochentag: string
  umonat: string
  uland: string
  uart: string
  utyp1: string
  ukategorie: string
  ulichtverh: string
  istrad: string
  istpkw: string
  istfuss: string
  istgkfz: string
  istkrad: string
  istsonstig: string
  [key: string]: string
}

export interface AccidentDetail {
  key: string
  label: string
  value: string
  highlight?: boolean
}

export interface AccidentFilters {
  district: string | null
  years: string[]
  utyp1: number | null
  uart: number | null
}

export interface DistrictProperties {
  AREA_ID: string
  AREA_NAME: string
  [key: string]: string
}

export interface DistrictOption {
  id: string
  name: string
}

# Unfallkarte

> Interaktive Karte mit Verkehrsunfällen mit Personenschaden (2016 – 2024) – Daten der Statistischen Ämter des Bundes und der Länder sowie des BKG, angereichert mit lokalen Metadaten.

![Screenshot Unfallkarte](https://raw.githubusercontent.com/oklabflensburg/open-accident-map/main/screenshot_unfallkarte.webp)


## Project Overview

- Nuxt 3 + Leaflet Frontend liefert eine interaktive Karte mit Filtermöglichkeiten und Detailansicht.
- PostGIS-Datenbank hält Unfallpunkte und Metadaten; Import erfolgt über bereitgestellte SQL-Skripte oder GDAL (`ogr2ogr`).
- Python-Tools unterstützen das Einspielen von GeoJSON-Daten in Postgres.
- Beispiel-Datensätze für Flensburg liegen in `data/` sowie als gebündelte Assets unter `app/public/data/` und `static/`.


## Repository Layout

- `app/` – Nuxt 3 Frontend (TypeScript, TailwindCSS, Leaflet) inklusive Seiten, Komponenten und Konfiguration.
- `data/` – Beispieldaten (`accidents_YYYY.geojson`) und das Schema `de_accident_meta_schema.sql`.
- `static/` – Statisch ausgelieferte GeoJSON- und Icon-Dateien (Bestand aus der vorherigen Implementierung).
- `tools/` – Python-Skript und Virtualenv zum Import von GeoJSON-Unfalldaten in Postgres.
- `CONTRIBUTING.md` – Hinweise zur Mitarbeit.


## Requirements

**Frontend**
- Node.js ≥ 20 (getestet mit 20.x) und `pnpm` (oder alternativ `npm`/`yarn`).
- Optional: `NUXT_INLINE_SCRIPT_NONCE`, wenn ein CSP-Nonce gesetzt werden soll.

**Datenimport / Backend**
- PostgreSQL 15/16 mit aktivem PostGIS-Extension-Pack.
- GDAL (`ogr2ogr`) für das Importieren der amtlichen Shape-Dateien.
- Python 3.10+ inkl. `pip`/`venv` zum Ausführen der Skripte in `tools/`.
- Komplettinstallation der Debian/Ubuntu-Pakete (Beispiel):
  `sudo apt update && sudo apt install wget unzip postgresql-16 postgresql-postgis gdal-bin python3 python3-venv git git-lfs`


## Running the Nuxt Frontend

```bash
cd app
pnpm install
pnpm dev
```

- Standardmäßig läuft die Entwicklungsinstanz auf `http://localhost:3000`.
- Produktions-Builds mit `pnpm build` und `pnpm preview`, oder statische Ausgabe via `pnpm generate`.
- Die API-Basis ist in `app/api/config.js` konfiguriert (`https://api.open-accident-map.de/query/`). Passe sie bei Bedarf an eigene Backends an.
- Frontend-Daten werden aus `public/data` geladen. Weitere Kommunen lassen sich hinzufügen, indem ihre GeoJSON-Dateien dort abgelegt und entsprechende Fetches z. B. in `components/AccidentMap.client.vue` erweitert werden.


## Preparing a PostGIS Database

### 1. Datenbank anlegen und PostGIS aktivieren

```bash
sudo -u postgres createuser --pwprompt oklab
sudo -u postgres createdb -O oklab oklab
psql -d oklab -c "CREATE EXTENSION postgis;"
```

Alternativ können bestehende Benutzer und Datenbanken genutzt werden.


### 2. Metadaten importieren

```bash
psql -U oklab -h localhost -d oklab -f data/de_accident_meta_schema.sql
```

Das Script erzeugt Tabellen für Unfallkategorien, Lichtverhältnisse, Beteiligte usw. und füllt sie mit Lookup-Werten.


### 3. Unfallpunkte importieren

Seit den Daten des Jahres 2024 verwenden die Shape-Dateien neue Tabellennamen und Ordnerstrukturen. Der Import erfolgt pro Jahr:

```bash
wget https://www.opengeodata.nrw.de/produkte/transport_verkehr/unfallatlas/Unfallorte2024_EPSG25832_Shape.zip
unzip Unfallorte2024_EPSG25832_Shape.zip
ogr2ogr -f "PostgreSQL" PG:"host=localhost port=5432 dbname=oklab user=oklab" -lco GEOMETRY_NAME=geom -lco SPATIAL_INDEX=GIST -lco PRECISION=YES -nlt POINT -append -nln de_accident_points -s_srs shp/Unfallorte_2024_LR_BasisDLM.prj -t_srs EPSG:4326 shp/Unfallorte_2024_LR_BasisDLM.shp 

wget https://www.opengeodata.nrw.de/produkte/transport_verkehr/unfallatlas/Unfallorte2023_EPSG25832_Shape.zip
unzip Unfallorte2023_EPSG25832_Shape.zip
ogr2ogr -f "PostgreSQL" PG:"host=localhost port=5432 dbname=oklab user=oklab" -lco GEOMETRY_NAME=geom -lco SPATIAL_INDEX=GIST -lco PRECISION=YES -nlt POINT -append -nln de_accident_points -s_srs shp/Unfallorte_2023_LR_BasisDLM.prj -t_srs EPSG:4326 shp/Unfallorte_2023_LR_BasisDLM.shp

wget https://www.opengeodata.nrw.de/produkte/transport_verkehr/unfallatlas/Unfallorte2022_EPSG25832_Shape.zip
unzip Unfallorte2022_EPSG25832_Shape.zip
ogr2ogr -f "PostgreSQL" PG:"host=localhost port=5432 dbname=oklab user=oklab" -lco GEOMETRY_NAME=geom -lco SPATIAL_INDEX=GIST -lco PRECISION=YES -nlt POINT -append -nln de_accident_points -s_srs shp/Unfallorte2022_LinRef.prj -t_srs EPSG:4326 shp/Unfallorte2022_LinRef.shp

wget https://www.opengeodata.nrw.de/produkte/transport_verkehr/unfallatlas/Unfallorte2021_EPSG25832_Shape.zip
unzip Unfallorte2021_EPSG25832_Shape.zip
ogr2ogr -f "PostgreSQL" PG:"host=localhost port=5432 dbname=oklab user=oklab" -lco GEOMETRY_NAME=geom -lco SPATIAL_INDEX=GIST -lco PRECISION=YES -nlt POINT -append -nln de_accident_points -s_srs Unfallorte202_EPSG25832_Shape/shapefile/Unfallorte_2021_LR_BasisDLM.prj -t_srs EPSG:4326 Unfallorte202_EPSG25832_Shape/shapefile/Unfallorte_2021_LR_BasisDLM.shp

wget https://www.opengeodata.nrw.de/produkte/transport_verkehr/unfallatlas/Unfallorte2020_EPSG25832_Shape.zip
unzip Unfallorte2020_EPSG25832_Shape.zip
ogr2ogr -f "PostgreSQL" PG:"host=localhost port=5432 dbname=oklab user=oklab" -lco GEOMETRY_NAME=geom -lco SPATIAL_INDEX=GIST -lco PRECISION=YES -nlt POINT -append -nln de_accident_points -s_srs Shapefile/Unfallorte2020_LinRef.prj -t_srs EPSG:4326 Shapefile/Unfallorte2020_LinRef.shp

wget https://www.opengeodata.nrw.de/produkte/transport_verkehr/unfallatlas/Unfallorte2019_EPSG25832_Shape.zip
unzip Unfallorte2019_EPSG25832_Shape.zip
ogr2ogr -f "PostgreSQL" PG:"host=localhost port=5432 dbname=oklab user=oklab" -lco GEOMETRY_NAME=geom -lco SPATIAL_INDEX=GIST -lco PRECISION=YES -nlt POINT -append -nln de_accident_points -s_srs Shapefile/Unfallorte2019_LinRef.prj -t_srs EPSG:4326 Shapefile/Unfallorte2019_LinRef.shp

wget https://www.opengeodata.nrw.de/produkte/transport_verkehr/unfallatlas/Unfallorte2018_EPSG25832_Shape.zip
unzip Unfallorte2018_EPSG25832_Shape.zip
ogr2ogr -f "PostgreSQL" PG:"host=localhost port=5432 dbname=oklab user=oklab" -lco GEOMETRY_NAME=geom -lco SPATIAL_INDEX=GIST -lco PRECISION=YES -nlt POINT -append -nln de_accident_points -s_srs Shapefile/Unfallorte2018_LinRef.prj -t_srs EPSG:4326 Shapefile/Unfallorte2018_LinRef.shp

wget https://www.opengeodata.nrw.de/produkte/transport_verkehr/unfallatlas/Unfallorte2017_EPSG25832_Shape.zip
unzip Unfallorte2017_EPSG25832_Shape.zip
ogr2ogr -f "PostgreSQL" PG:"host=localhost port=5432 dbname=oklab user=oklab" -lco GEOMETRY_NAME=geom -lco SPATIAL_INDEX=GIST -lco PRECISION=YES -nlt POINT -append -nln de_accident_points -s_srs Shapefile/Unfallorte2017_LinRef.prj -t_srs EPSG:4326 Shapefile/Unfallorte2017_LinRef.shp

wget https://www.opengeodata.nrw.de/produkte/transport_verkehr/unfallatlas/Unfallorte2016_EPSG25832_Shape.zip
unzip Unfallorte2016_EPSG25832_Shape.zip
ogr2ogr -f "PostgreSQL" PG:"host=localhost port=5432 dbname=oklab user=oklab" -lco GEOMETRY_NAME=geom -lco SPATIAL_INDEX=GIST -lco PRECISION=YES -nlt POINT -append -nln de_accident_points -s_srs Shapefile/Unfaelle_2016_LinRef.prj -t_srs EPSG:4326 Shapefile/Unfaelle_2016_LinRef.shp
```


### 4. Alternative: Python-Importer

Das Skript `tools/insert_accidents.py` importiert GeoJSON-Dateien in eine Tabelle `accidents`. Es erwartet eine `.env` im Projektwurzelverzeichnis mit:

```
DB_NAME=oklab
DB_USER=oklab
DB_PASS=secret
DB_HOST=localhost
DB_PORT=5432
```

Installiere die Abhängigkeiten (`python -m venv tools/venv && tools/venv/bin/pip install -r tools/requirements.txt`) und rufe anschließend z. B. `tools/venv/bin/python tools/insert_accidents.py data/accidents_2024.geojson` auf.


## Converting Shapefiles to GeoJSON

Für lokale Analysen oder zum Bereitstellen statischer Dateien kannst du die Shape-Dateien auch direkt nach GeoJSON wandeln:

```bash
ogr2ogr -f GeoJSON \
  -s_srs shp/Unfallorte_2024_LR_BasisDLM.prj \
  -t_srs EPSG:4326 \
  accidents_2024.geojson \
  shp/Unfallorte_2024_LR_BasisDLM.shp
```

Das Beispiel nutzt die 2024er-Struktur; passe Pfade für andere Jahre an.


## Working with the bundled demo data

- `data/accidents_YYYY.geojson` enthält vorberechnete Beispieldatensätze für mehrere Jahrgänge.
- `app/public/data/meta.json` liefert die Metadaten, die im Frontend zur Auflösung der Codes verwendet werden.
- `static/` spiegelt ältere Deployment-Artefakte wider; nutze `app/public/data` für neue Builds.


## How to Contribute

Beiträge sind willkommen! Hinweise zu Entwicklungsrichtlinien, Coding Style und Ablauf findest du in [CONTRIBUTING.md](CONTRIBUTING.md).


## License

Dieses Repository steht unter der [CC0-1.0](LICENSE)-Lizenz.

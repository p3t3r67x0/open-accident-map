export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
  ],
  css: [
    'leaflet/dist/leaflet.css',
    '~/assets/css/main.css',
  ],
  app: {
    head: {
      title: 'Open Accident Map',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          hid: 'description',
          name: 'description',
          content: 'Interaktive Karte mit Verkehrsunfällen in Flensburg',
        },
      ],
    },
  },
})

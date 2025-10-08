const scriptNonce = process.env.NUXT_INLINE_SCRIPT_NONCE || 'nonce1234'

export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      scriptNonce,
    },
  },
  modules: [
    '@nuxtjs/tailwindcss',
  ],
  css: [
    'leaflet/dist/leaflet.css',
    '~/assets/css/main.css',
  ],
  app: {
    head: {
      title: 'Unfallkarte Flensburg',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          hid: 'description',
          name: 'description',
          content: 'Interaktive Karte mit Verkehrsunfällen in Flensburg',
        },
      ],
      ...(scriptNonce ? { nonce: scriptNonce } : {}),
    },
  },
})

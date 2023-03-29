import { defineNuxtPlugin } from "#app";
import Openlayers from "vue3-openlayers";
import 'vue3-openlayers/dist/vue3-openlayers.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Openlayers);
});

// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@nuxt/ui", "@pinia/nuxt", "@nuxt/devtools", "@nuxt/icon"],

  pinia: {
    plugins: ["~/plugins/pinia-persist.client.ts"],
  },

  imports: {
    autoImport: true,
  },

  css: ["~/assets/css/main.css"],

  compatibilityDate: "2026-06-30",

  devtools: {
    enabled: true,
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: "http://localhost:3000",
    },
  },

  vite: {
    define: {
      __VUE_PROD_DEVTOOLS__: false,
    },
  },
});
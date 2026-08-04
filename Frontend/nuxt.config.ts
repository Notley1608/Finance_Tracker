// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  modules: ["@nuxt/ui"],
  css: ["~/assets/css/main.css"],
  compatibilityDate: "2026-06-30",
  devtools: { enabled: true },
  public: {
    apiBaseUrl: 'http://localhost:3000',
  },
});

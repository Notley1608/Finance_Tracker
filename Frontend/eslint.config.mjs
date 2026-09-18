import { createConfigForNuxt } from '@nuxt/eslint-config'

export default createConfigForNuxt({
  features: {
    standalone: true,
  },
  gitignore: {
    files: [
      '.nuxt',
      '.output',
      '.data',
      'dist',
      'node_modules',
      '.DS_Store',
      'public',
    ],
  },
})
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          background: '#121212',
          surface: '#1e1e1e',
          primary: '#4fc3f7',
          secondary: '#81c784',
          error: '#e57373',
          info: '#64b5f6',
          success: '#81c784',
          warning: '#ffb74d',
        },
      },
    },
  },
  defaults: {
    VCard: { flat: true },
    VBtn: { variant: 'text', density: 'compact' },
    VTextField: { density: 'compact', hideDetails: true },
    VSelect: { density: 'compact', hideDetails: true },
    VSwitch: { density: 'compact', hideDetails: true },
    VExpansionPanel: { flat: true },
  },
})

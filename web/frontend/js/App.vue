<template>
  <n-config-provider
    :locale="naiveLocales[pageLanguage()] ?? enUS"
    :date-locale="naiveDateLocales[pageLanguage()] ?? dateEnUS"
    :theme="naiveTheme"
    :theme-overrides="naiveThemeOverrides"
  >
    <n-dialog-provider>
      <n-message-provider>
        <div v-if="panelLayout" class="min-h-screen flex bg-app text-body">
          <status-notifier />
          <mfa-enforcement-modal />

          <main-sidebar />

          <div class="flex-1 min-w-0 flex flex-col min-h-screen">
            <main-navbar />

            <main
              id="main-section"
              class="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8"
            >
              <div class="content min-w-0">
                <content-view />
                <div v-if="!$route.name" />
              </div>
            </main>
          </div>
        </div>

        <div v-else class="min-h-screen flex flex-col bg-app text-body">
          <guest-navbar />

          <main id="main-section" class="flex-1 flex flex-col justify-center px-4 sm:px-6 py-8">
            <div class="content w-full">
              <content-view />
            </div>
          </main>
        </div>
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup>
import { computed, onMounted, provide, ref, watch } from 'vue'
import {
  NConfigProvider,
  NDialogProvider,
  NMessageProvider,
  lightTheme,
  darkTheme,
  ptBR,
  datePtBR,
  ruRU,
  dateRuRU,
  enUS,
  dateEnUS,
  esAR,
  dateEsAR,
  deDE,
  dateDeDE,
} from 'naive-ui'
import { THEME_KEY } from 'vue-echarts'
import MainNavbar from './components/MainNavbar.vue'
import GuestNavbar from './components/GuestNavbar.vue'
import MainSidebar from './components/MainSidebar.vue'
import ContentView from './components/ContentView.vue'
import StatusNotifier from './components/StatusNotifier.vue'
import MfaEnforcementModal from './components/blocks/MfaEnforcementModal.vue'
import { pageLanguage } from './i18n/i18n'
import { guestPages } from './routes'

import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from './store/auth'
import { useUISettingsStore } from './store/uiSettings'
import { useNodeStore } from './store/node'
import { useDaemonTaskStore } from './store/daemonTask'
import { useGameStore } from './store/game'
import { useServerStore } from './store/server'
import { useUserStore } from './store/user'

const naiveLocales = {
  pt: ptBR,
  en: enUS,
  ru: ruRU,
  es: esAR,
  de: deDE,
}

const naiveDateLocales = {
  pt: datePtBR,
  en: dateEnUS,
  ru: dateRuRU,
  es: dateEsAR,
  de: dateDeDE,
}

const route = useRoute()
const router = useRouter()

const authStore = useAuthStore()
const uiSettingsStore = useUISettingsStore()
const nodeStore = useNodeStore()
const daemonTaskStore = useDaemonTaskStore()
const gameStore = useGameStore()
const serverStore = useServerStore()
const userStore = useUserStore()

const panelLayout = computed(() => {
  return !!authStore.user && !guestPages.includes(route.name)
})

const FALLBACK = {
  accent: { light: '#0E8BB8', dark: '#36B8E8' },
  accentHover: { light: '#0A749C', dark: '#59C7EF' },
  primaryFg: { light: '#FFFFFF', dark: '#0D1821' },
  success: { light: '#188858', dark: '#4CCB91' },
  successHover: { light: '#136E47', dark: '#67D6A2' },
  warning: { light: '#B97814', dark: '#F0BC5E' },
  warningHover: { light: '#99620F', dark: '#F4C97A' },
  danger: { light: '#C93B3B', dark: '#F07878' },
  dangerHover: { light: '#A92E2E', dark: '#F59393' },
  info: { light: '#1677A8', dark: '#6DBFE8' },
  appBg: { light: '#F3F5F7', dark: '#202225' },
  sidebarBg: { light: '#EBEEF2', dark: '#292C30' },
  topbarBg: { light: '#FFFFFF', dark: '#25282C' },
  surface: { light: '#FFFFFF', dark: '#2C2F33' },
  raised: { light: '#F8FAFC', dark: '#30343A' },
  hover: { light: '#EDF1F5', dark: '#383D43' },
  border: { light: '#D4DBE3', dark: '#40454C' },
  borderStrong: { light: '#B8C3CF', dark: '#505761' },
  text: { light: '#161A1E', dark: '#F1F3F5' },
  textSecondary: { light: '#4B5563', dark: '#B8C0C9' },
  textMuted: { light: '#6B7684', dark: '#929DA8' },
  tableHeader: { light: '#F1F4F8', dark: '#2C2F33' },
  tableRowHover: { light: '#F6F8FA', dark: '#2C3035' },
}

function buildNaiveOverrides(mode) {
  const styles = getComputedStyle(document.documentElement)
  const v = (name, fallback) => {
    const value = styles.getPropertyValue(name).trim()
    return value || (typeof fallback === 'string' ? fallback : fallback[mode])
  }

  const accent = v('--gameap-accent', FALLBACK.accent)
  const accentHover = v('--gameap-accent-hover', FALLBACK.accentHover)
  const primaryFg = v('--gameap-primary-fg', FALLBACK.primaryFg)
  const border = v('--gameap-border', FALLBACK.border)
  const borderStrong = v('--gameap-border-strong', FALLBACK.borderStrong)
  const surface = v('--gameap-surface', FALLBACK.surface)
  const raised = v('--gameap-surface-raised', FALLBACK.raised)
  const sidebarBg = v('--gameap-sidebar-bg', FALLBACK.sidebarBg)
  const topbarBg = v('--gameap-topbar-bg', FALLBACK.topbarBg)
  const hover = v('--gameap-surface-hover', FALLBACK.hover)
  const text = v('--gameap-text', FALLBACK.text)
  const textSecondary = v('--gameap-text-secondary', FALLBACK.textSecondary)
  const textMuted = v('--gameap-text-muted', FALLBACK.textMuted)
  const tableHeader = v('--gameap-table-header', FALLBACK.tableHeader)
  const tableRowHover = v('--gameap-table-row-hover', FALLBACK.tableRowHover)

  return {
    common: {
      fontFamily: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontFamilyMono: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      borderRadius: '8px',
      borderRadiusSmall: '6px',
      primaryColor: accent,
      primaryColorHover: accentHover,
      primaryColorPressed: accentHover,
      primaryColorSuppl: accent,
      infoColor: v('--gameap-info', FALLBACK.info),
      infoColorHover: accentHover,
      infoColorPressed: accentHover,
      infoColorSuppl: v('--gameap-info', FALLBACK.info),
      successColor: v('--gameap-success', FALLBACK.success),
      successColorHover: v('--gameap-success-hover', FALLBACK.successHover),
      successColorPressed: v('--gameap-success-hover', FALLBACK.successHover),
      successColorSuppl: v('--gameap-success', FALLBACK.success),
      warningColor: v('--gameap-warning', FALLBACK.warning),
      warningColorHover: v('--gameap-warning-hover', FALLBACK.warningHover),
      warningColorPressed: v('--gameap-warning-hover', FALLBACK.warningHover),
      warningColorSuppl: v('--gameap-warning', FALLBACK.warning),
      errorColor: v('--gameap-danger', FALLBACK.danger),
      errorColorHover: v('--gameap-danger-hover', FALLBACK.dangerHover),
      errorColorPressed: v('--gameap-danger-hover', FALLBACK.dangerHover),
      errorColorSuppl: v('--gameap-danger', FALLBACK.danger),
      bodyColor: v('--gameap-app-bg', FALLBACK.appBg),
      cardColor: surface,
      modalColor: raised,
      popoverColor: raised,
      tableColor: topbarBg,
      tableHeaderColor: tableHeader,
      inputColor: sidebarBg,
      inputColorDisabled: surface,
      borderColor: border,
      dividerColor: border,
      hoverColor: hover,
      textColorBase: text,
      textColor1: text,
      textColor2: textSecondary,
      textColor3: textMuted,
      placeholderColor: textMuted,
    },
    Button: {
      heightMedium: '40px',
      heightSmall: '32px',
      borderRadiusMedium: '7px',
      borderRadiusSmall: '6px',
      textColorPrimary: primaryFg,
      textColorHoverPrimary: primaryFg,
      textColorPressedPrimary: primaryFg,
      textColorFocusPrimary: primaryFg,
      fontWeight: '500',
    },
    Input: {
      heightMedium: '40px',
      borderRadius: '8px',
      color: sidebarBg,
      colorFocus: sidebarBg,
      border: `1px solid ${border}`,
      borderHover: `1px solid ${borderStrong}`,
      borderFocus: `1px solid ${accent}`,
      boxShadowFocus: '0 0 0 2px rgba(54, 184, 232, 0.22)',
    },
    InternalSelection: {
      heightMedium: '40px',
      borderRadius: '8px',
      color: sidebarBg,
      colorActive: sidebarBg,
      border: `1px solid ${border}`,
      borderHover: `1px solid ${borderStrong}`,
      borderActive: `1px solid ${accent}`,
      borderFocus: `1px solid ${accent}`,
      boxShadowActive: '0 0 0 2px rgba(54, 184, 232, 0.22)',
      boxShadowFocus: '0 0 0 2px rgba(54, 184, 232, 0.22)',
    },
    InternalSelectMenu: {
      color: raised,
      borderRadius: '8px',
      optionColorPending: hover,
      optionColorActive: mode === 'dark' ? '#173642' : '#E3F4FA',
      optionTextColorActive: accent,
    },
    Card: {
      color: surface,
      borderColor: border,
      borderRadius: '8px',
      titleFontSizeSmall: '15px',
      titleFontSizeMedium: '16px',
      titleFontWeight: '600',
    },
    Modal: {
      color: raised,
      borderRadius: '10px',
    },
    Dialog: {
      color: raised,
      borderRadius: '10px',
    },
    Popover: {
      color: raised,
      borderRadius: '8px',
    },
    Dropdown: {
      color: raised,
      borderRadius: '8px',
      optionColorHover: hover,
    },
    Tabs: {
      tabTextColorLine: textMuted,
      tabTextColorActiveLine: accent,
      tabTextColorHoverLine: text,
      barColor: accent,
      tabFontWeightActive: '600',
    },
    DataTable: {
      borderColor: border,
      thColor: tableHeader,
      thColorModal: tableHeader,
      thTextColor: textSecondary,
      thFontWeight: '600',
      tdColor: topbarBg,
      tdColorModal: surface,
      tdColorHover: tableRowHover,
      tdColorStriped: tableRowHover,
      tdColorHoverModal: hover,
      tdTextColor: text,
      borderRadius: '8px',
    },
  }
}

const naiveThemeOverrides = ref(buildNaiveOverrides(uiSettingsStore.currentTheme))

function applyTheme(theme) {
  document.documentElement.classList.remove('dark', 'light')
  document.documentElement.classList.add(theme)
  naiveThemeOverrides.value = buildNaiveOverrides(theme)
}

onMounted(() => {
  applyTheme(uiSettingsStore.currentTheme)
})

watch(
  () => uiSettingsStore.currentTheme,
  (newTheme) => {
    applyTheme(newTheme)
  },
)

const naiveTheme = computed(() => {
  return uiSettingsStore.currentTheme === 'dark' ? darkTheme : lightTheme
})

provide(
  THEME_KEY,
  computed(() => (uiSettingsStore.currentTheme === 'dark' ? 'dark' : 'default')),
)

const onAnyStoreAction = ({ onError }) => {
  onError((error) => {
    if (error.response && error.response.status) {
      switch (error.response.status) {
        case 401:
          authStore.logout().then(() => {
            window.location.href = '/'
          })
          break
        case 403:
          router.push({ name: 'error403' })
          break
        case 404:
          router.push({ name: 'error404' })
          break
      }
    }
  })
}

nodeStore.$onAction(onAnyStoreAction)
daemonTaskStore.$onAction(onAnyStoreAction)
gameStore.$onAction(onAnyStoreAction)
serverStore.$onAction(onAnyStoreAction)
userStore.$onAction(onAnyStoreAction)
</script>

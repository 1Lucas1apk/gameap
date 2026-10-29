<template>
  <header class="sticky top-0 z-20 flex h-16 w-full shrink-0 items-center justify-between border-b border-border bg-topbar px-4 sm:px-6 lg:px-8">
    <!-- Left: Mobile Drawer Trigger & Compact Brand (only < 1024px) -->
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="gi-focus-ring inline-flex h-10 w-10 items-center justify-center rounded-[7px] text-secondary transition-colors duration-150 hover:bg-surface-hover hover:text-body lg:hidden"
        :aria-label="trans('sidebar.expand')"
        @click="uiSettingsStore.toggleMobileMenu()"
      >
        <GIcon name="bars" class="text-[16px]" />
      </button>

      <router-link
        :to="{ name: 'home' }"
        class="flex items-center lg:hidden no-underline"
      >
        <img
          src="/images/gap_logo_white_mini.png"
          class="logo-mini gi-brand-logo"
          alt="GameAP"
        />
      </router-link>
    </div>

    <!-- Right: Global Utilities (Plugins, Language, Theme, Help) -->
    <div class="flex items-center gap-1.5 sm:gap-2">
      <PluginSlot
        v-if="pluginsStore.isInitialized"
        name="navbar-items"
        :context="{ isAdmin }"
      />

      <!-- Language Selector -->
      <MainNavbarDropdown
        v-if="languageItems.length > 0 && languageItems[0].length > 1"
        :button-text="currentLangLabel"
        button-icon="globe"
        :items="languageItems"
      />

      <!-- Theme Toggle -->
      <n-tooltip placement="bottom">
        <template #trigger>
          <button
            type="button"
            data-testid="theme-toggle"
            class="gi-focus-ring inline-flex h-9 w-9 items-center justify-center rounded-btn text-secondary transition-colors duration-150 hover:bg-surface-hover hover:text-body"
            :aria-label="themeTooltip"
            @click="switchTheme"
          >
            <GIcon v-if="currentTheme === 'dark'" name="sun" class="text-[15px]" />
            <GIcon v-else name="moon" class="text-[15px]" />
          </button>
        </template>
        {{ themeTooltip }}
      </n-tooltip>

      <!-- Help & Documentation -->
      <MainNavbarDropdown
        :button-text="trans('navbar.help')"
        button-icon="help"
        :items="helpItems"
      />
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { NTooltip } from 'naive-ui'
import { GIcon } from '@gameap/ui'
import { trans, pageLanguage, getAvailableLanguages, getCurrentLanguage } from '@/i18n/i18n'
import MainNavbarDropdown from './MainNavbarDropdown.vue'
import { useAuthStore } from '@/store/auth'
import { useUISettingsStore } from '@/store/uiSettings'
import { usePluginsStore } from '@/store/plugins'
import PluginSlot from '@/plugins/components/PluginSlot.vue'
import { hubUrl } from '@/parts/hub'

const authStore = useAuthStore()
const uiSettingsStore = useUISettingsStore()
const pluginsStore = usePluginsStore()

const isAdmin = computed(() => authStore.isAdmin)
const currentTheme = computed(() => uiSettingsStore.currentTheme)

const themeTooltip = computed(() => {
  return currentTheme.value === 'dark'
    ? trans('profile.theme_light')
    : trans('profile.theme_dark')
})

const currentLangCode = computed(() => getCurrentLanguage() || 'en')

const currentLangLabel = computed(() => {
  return currentLangCode.value.toUpperCase()
})

const languageItems = computed(() => {
  const langs = getAvailableLanguages()
  if (!Array.isArray(langs) || langs.length === 0) {
    return []
  }

  return [
    langs.map((l) => ({
      label: l.native_name || l.name || l.code.toUpperCase(),
      active: l.code === currentLangCode.value,
      onClick: () => selectLanguage(l.code),
    })),
  ]
})

function selectLanguage(code) {
  if (code === currentLangCode.value) return
  uiSettingsStore.setLanguage(code)
  window.location.reload()
}

const helpItems = computed(() => {
  const items = [
    {
      icon: 'book',
      label: trans('navbar.documentation'),
      link: pageLanguage() === 'ru' ? 'https://docs.gameap.com/ru/' : 'https://docs.gameap.com/en/',
    },
  ]

  if (isAdmin.value) {
    items.push({
      icon: 'box-open',
      label: trans('hub.title'),
      link: hubUrl(),
    })
  }

  items.push({
    icon: 'admin-panel',
    label: trans('navbar.api_documentation'),
    link: 'https://openapi.gameap.io/',
  })

  return [items]
})

function switchTheme() {
  uiSettingsStore.toggleTheme()
}
</script>

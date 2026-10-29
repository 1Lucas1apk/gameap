<template>
  <header class="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-topbar px-4 sm:px-6 lg:px-8">
    <div class="flex items-center">
      <a id="brand-link" class="navbar-brand flex items-center no-underline" href="/">
        <img id="brand-logo" src="/images/gap_logo_white.png" class="logo gi-brand-logo" alt="GameAP" />
      </a>
    </div>

    <div class="flex items-center gap-2">
      <MainNavbarDropdown
        v-if="languageItems.length > 0 && languageItems[0].length > 1"
        :button-text="currentLangLabel"
        button-icon="globe"
        :items="languageItems"
      />

      <n-tooltip placement="bottom">
        <template #trigger>
          <button
            type="button"
            data-testid="theme-toggle"
            class="gi-focus-ring inline-flex h-9 w-9 items-center justify-center rounded-btn text-secondary transition-colors duration-150 hover:bg-surface-hover hover:text-body"
            :aria-label="themeTooltip"
            @click="uiSettingsStore.toggleTheme()"
          >
            <GIcon v-if="currentTheme === 'dark'" name="sun" class="text-[15px]" />
            <GIcon v-else name="moon" class="text-[15px]" />
          </button>
        </template>
        {{ themeTooltip }}
      </n-tooltip>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { NTooltip } from 'naive-ui'
import { GIcon } from '@gameap/ui'
import { trans, getAvailableLanguages, getCurrentLanguage } from '@/i18n/i18n'
import { useUISettingsStore } from '@/store/uiSettings'
import MainNavbarDropdown from './MainNavbarDropdown.vue'

const uiSettingsStore = useUISettingsStore()

const currentTheme = computed(() => uiSettingsStore.currentTheme)
const themeTooltip = computed(() =>
  currentTheme.value === 'dark' ? trans('profile.theme_light') : trans('profile.theme_dark'),
)

const currentLangCode = computed(() => getCurrentLanguage() || 'en')
const currentLangLabel = computed(() => currentLangCode.value.toUpperCase())

const languageItems = computed(() => {
  const langs = getAvailableLanguages()
  if (!Array.isArray(langs) || langs.length === 0) return []
  return [
    langs.map((l) => ({
      label: l.native_name || l.name || l.code.toUpperCase(),
      active: l.code === currentLangCode.value,
      onClick: () => {
        if (l.code !== currentLangCode.value) {
          uiSettingsStore.setLanguage(l.code)
          window.location.reload()
        }
      },
    })),
  ]
})
</script>

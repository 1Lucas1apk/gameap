<template>
  <!-- Desktop Persistent Sidebar -->
  <aside
    :class="[
      'sidebar-menu hidden lg:flex flex-col h-screen sticky top-0 shrink-0 bg-sidebar border-r border-border select-none z-30 transition-[width] duration-200 ease-out',
      minimized ? 'w-[72px]' : 'w-64',
    ]"
  >
    <!-- Brand Header (~72px) -->
    <div
      :class="[
        'flex h-[72px] shrink-0 items-center border-b border-border/80',
        minimized ? 'justify-center px-3' : 'justify-between px-5',
      ]"
    >
      <router-link
        id="brand-link"
        :to="{ name: 'home' }"
        class="gi-focus-ring flex items-center gap-2.5 rounded-md py-1 no-underline"
        :aria-label="'GameAP'"
      >
        <img
          v-if="minimized"
          src="/images/gap_logo_white_mini.png"
          class="logo-mini gi-brand-logo"
          alt="GameAP"
        />
        <img
          v-else
          id="brand-logo"
          src="/images/gap_logo_white.png"
          class="logo gi-brand-logo"
          alt="GameAP"
        />
      </router-link>

      <n-tooltip v-if="!minimized" placement="right">
        <template #trigger>
          <button
            type="button"
            class="gi-focus-ring inline-flex h-8 w-8 items-center justify-center rounded-[7px] text-muted transition-colors duration-150 hover:bg-surface-hover hover:text-body"
            :aria-label="trans('sidebar.minimize')"
            @click="toggleMinimized"
          >
            <GIcon name="sidebar-collapse" class="text-[13px]" />
          </button>
        </template>
        {{ trans('sidebar.minimize') }}
      </n-tooltip>
    </div>

    <!-- Navigation & Pinned Account Footer -->
    <nav
      ref="desktopNavRef"
      aria-label="Main navigation"
      class="flex flex-1 flex-col min-h-0"
    >
      <!-- Scrollable Navigation Groups -->
      <div class="no-scrollbar flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <!-- Control / Main Group -->
        <div>
          <div
            v-if="!minimized"
            class="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted"
          >
            {{ trans('sidebar.control') }}
          </div>
          <div class="space-y-1">
            <template v-for="link in serversLinks" :key="link.route.name">
              <n-tooltip v-if="minimized" placement="right">
                <template #trigger>
                  <router-link
                    :to="link.route"
                    :class="navItemClasses(isItemActive(link.route), true)"
                    :aria-current="isItemActive(link.route) ? 'page' : undefined"
                  >
                    <span
                      v-if="isItemActive(link.route)"
                      class="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-accent"
                      aria-hidden="true"
                    />
                    <GIcon
                      :name="link.icon"
                      :class="navIconClasses(isItemActive(link.route))"
                    />
                    <span class="sr-only">{{ link.text }}</span>
                  </router-link>
                </template>
                {{ link.text }}
              </n-tooltip>

              <router-link
                v-else
                :to="link.route"
                :class="navItemClasses(isItemActive(link.route), false)"
                :aria-current="isItemActive(link.route) ? 'page' : undefined"
              >
                <span
                  v-if="isItemActive(link.route)"
                  class="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-accent"
                  aria-hidden="true"
                />
                <GIcon
                  :name="link.icon"
                  :class="navIconClasses(isItemActive(link.route))"
                />
                <span class="truncate">{{ link.text }}</span>
              </router-link>
            </template>

            <template
              v-for="item in pluginServersMenuItems"
              :key="item.pluginId + '-' + item.text"
            >
              <n-tooltip v-if="minimized" placement="right">
                <template #trigger>
                  <router-link
                    :to="item.route"
                    :class="navItemClasses(isItemActive(item.route), true)"
                  >
                    <span
                      v-if="isItemActive(item.route)"
                      class="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-accent"
                      aria-hidden="true"
                    />
                    <GIcon
                      :name="item.icon"
                      :class="navIconClasses(isItemActive(item.route))"
                    />
                    <span class="sr-only">{{ pluginsStore.resolvePluginText(item.pluginId, item.text) }}</span>
                  </router-link>
                </template>
                {{ pluginsStore.resolvePluginText(item.pluginId, item.text) }}
              </n-tooltip>

              <router-link
                v-else
                :to="item.route"
                :class="navItemClasses(isItemActive(item.route), false)"
              >
                <span
                  v-if="isItemActive(item.route)"
                  class="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-accent"
                  aria-hidden="true"
                />
                <GIcon
                  :name="item.icon"
                  :class="navIconClasses(isItemActive(item.route))"
                />
                <span class="truncate">{{ pluginsStore.resolvePluginText(item.pluginId, item.text) }}</span>
              </router-link>
            </template>
          </div>
        </div>

        <!-- Administration Group -->
        <div v-if="isAdmin">
          <div
            v-if="!minimized"
            class="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted"
          >
            {{ trans('sidebar.admin') }}
          </div>
          <div v-else class="mx-2 my-2 border-t border-border/70" aria-hidden="true" />

          <div class="space-y-1">
            <template v-for="item in adminMenuItems" :key="item.key">
              <n-tooltip v-if="minimized" placement="right">
                <template #trigger>
                  <router-link
                    :to="item.route"
                    :class="navItemClasses(isItemActive(item.route), true)"
                    :aria-current="isItemActive(item.route) ? 'page' : undefined"
                  >
                    <span
                      v-if="isItemActive(item.route)"
                      class="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-accent"
                      aria-hidden="true"
                    />
                    <GIcon
                      :name="item.icon"
                      :class="navIconClasses(isItemActive(item.route))"
                    />
                    <span class="sr-only">{{ item.text }}</span>
                  </router-link>
                </template>
                {{ item.text }}
              </n-tooltip>

              <router-link
                v-else
                :to="item.route"
                :class="navItemClasses(isItemActive(item.route), false)"
                :aria-current="isItemActive(item.route) ? 'page' : undefined"
              >
                <span
                  v-if="isItemActive(item.route)"
                  class="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-accent"
                  aria-hidden="true"
                />
                <GIcon
                  :name="item.icon"
                  :class="navIconClasses(isItemActive(item.route))"
                />
                <span class="truncate">{{ item.text }}</span>
              </router-link>
            </template>
          </div>
        </div>

        <!-- Custom Plugin Sections -->
        <div v-for="(items, section) in customPluginSections" :key="section">
          <div
            v-if="!minimized"
            class="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted"
          >
            {{ section }}
          </div>
          <div v-else class="mx-2 my-2 border-t border-border/70" aria-hidden="true" />

          <div class="space-y-1">
            <template v-for="item in items" :key="item.pluginId + '-' + item.text">
              <n-tooltip v-if="minimized" placement="right">
                <template #trigger>
                  <router-link
                    :to="item.route"
                    :class="navItemClasses(isItemActive(item.route), true)"
                  >
                    <span
                      v-if="isItemActive(item.route)"
                      class="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-accent"
                      aria-hidden="true"
                    />
                    <GIcon
                      :name="item.icon"
                      :class="navIconClasses(isItemActive(item.route))"
                    />
                    <span class="sr-only">{{ pluginsStore.resolvePluginText(item.pluginId, item.text) }}</span>
                  </router-link>
                </template>
                {{ pluginsStore.resolvePluginText(item.pluginId, item.text) }}
              </n-tooltip>

              <router-link
                v-else
                :to="item.route"
                :class="navItemClasses(isItemActive(item.route), false)"
              >
                <span
                  v-if="isItemActive(item.route)"
                  class="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-accent"
                  aria-hidden="true"
                />
                <GIcon
                  :name="item.icon"
                  :class="navIconClasses(isItemActive(item.route))"
                />
                <span class="truncate">{{ pluginsStore.resolvePluginText(item.pluginId, item.text) }}</span>
              </router-link>
            </template>
          </div>
        </div>

        <PluginSlot
          v-if="pluginsStore.isInitialized"
          name="sidebar-sections"
          :context="{ minimized, isAdmin }"
        />
      </div>

      <!-- Expand button when minimized -->
      <div v-if="minimized" class="px-3 pb-2">
        <n-tooltip placement="right">
          <template #trigger>
            <button
              type="button"
              class="gi-focus-ring flex h-10 w-full items-center justify-center rounded-[7px] text-muted transition-colors duration-150 hover:bg-surface-hover hover:text-body"
              :aria-label="trans('sidebar.expand')"
              @click="toggleMinimized"
            >
              <GIcon name="sidebar-expand" class="text-[14px]" />
            </button>
          </template>
          {{ trans('sidebar.expand') }}
        </n-tooltip>
      </div>

      <!-- Pinned User Account Footer -->
      <div
        v-if="user"
        ref="accountWrapRef"
        class="relative mt-auto border-t border-border p-3"
      >
        <n-tooltip :disabled="!minimized" placement="right">
          <template #trigger>
            <button
              type="button"
              :class="[
                'gi-focus-ring flex w-full items-center rounded-[8px] transition-colors duration-150 hover:bg-surface-hover text-left',
                minimized ? 'justify-center p-2' : 'gap-3 px-2.5 py-2',
                accountMenuOpen ? 'bg-surface-hover' : '',
              ]"
              :aria-expanded="accountMenuOpen ? 'true' : 'false'"
              aria-haspopup="menu"
              @click="accountMenuOpen = !accountMenuOpen"
            >
              <span
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface-raised text-[13px] font-semibold text-accent"
                aria-hidden="true"
              >
                {{ userInitial }}
              </span>

              <span v-if="!minimized" class="min-w-0 flex-1">
                <span class="block truncate text-[13.5px] font-semibold leading-5 text-body">
                  {{ user.name || user.login }}
                </span>
                <span class="block truncate text-[12px] leading-4 text-muted">
                  {{ roleLabel }}
                </span>
              </span>
              <span v-else class="sr-only">{{ user.name || user.login }}</span>

              <GIcon
                v-if="!minimized"
                :name="accountMenuOpen ? 'chevron-down' : 'chevron-up'"
                class="text-[11px] text-muted shrink-0"
              />
            </button>
          </template>
          {{ user.name || user.login }} ({{ roleLabel }})
        </n-tooltip>

        <!-- Account Popover Menu -->
        <div
          v-if="accountMenuOpen"
          role="menu"
          :class="[
            'absolute z-50 rounded-[8px] border border-border bg-surface-raised py-1 shadow-xl divide-y divide-border',
            minimized ? 'left-full bottom-3 ml-2 w-56' : 'left-3 right-3 bottom-full mb-2',
          ]"
        >
          <div class="px-3 py-2">
            <div class="truncate text-[13px] font-semibold text-body">
              {{ user.name || user.login }}
            </div>
            <div v-if="user.email" class="truncate text-[12px] text-muted">
              {{ user.email }}
            </div>
          </div>

          <div class="p-1">
            <router-link
              :to="{ name: 'profile' }"
              class="flex items-center gap-2.5 rounded-[6px] px-3 py-2 text-[13.5px] text-secondary no-underline transition-colors hover:bg-surface-hover hover:text-body"
              @click="accountMenuOpen = false"
            >
              <GIcon name="profile" class="w-4 text-center text-[14px] text-muted" />
              <span>{{ trans('navbar.profile') }}</span>
            </router-link>

            <router-link
              :to="{ name: 'tokens' }"
              class="flex items-center gap-2.5 rounded-[6px] px-3 py-2 text-[13.5px] text-secondary no-underline transition-colors hover:bg-surface-hover hover:text-body"
              @click="accountMenuOpen = false"
            >
              <GIcon name="key" class="w-4 text-center text-[14px] text-muted" />
              <span>{{ trans('tokens.tokens') }}</span>
            </router-link>
          </div>

          <div class="p-1">
            <a
              href="#"
              class="flex items-center gap-2.5 rounded-[6px] px-3 py-2 text-[13.5px] text-danger no-underline transition-colors hover:bg-surface-hover"
              @click.prevent="logout"
            >
              <GIcon name="logout" class="w-4 text-center text-[14px]" />
              <span>{{ trans('navbar.sign_out') }}</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  </aside>

  <!-- Responsive Mobile Slide-Over Drawer (< 1024px) -->
  <div
    v-if="mobileOpen"
    class="fixed inset-0 z-50 flex lg:hidden"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="fixed inset-0 bg-black/60 backdrop-blur-[1px] transition-opacity"
      aria-hidden="true"
      @click="closeMobile"
    />

    <aside class="relative z-10 flex h-full w-72 max-w-[84vw] flex-col bg-sidebar border-r border-border shadow-2xl">
      <div class="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
        <router-link
          :to="{ name: 'home' }"
          class="flex items-center gap-2 no-underline"
          @click="closeMobile"
        >
          <img
            src="/images/gap_logo_white.png"
            class="logo gi-brand-logo"
            alt="GameAP"
          />
        </router-link>

        <button
          type="button"
          class="gi-focus-ring inline-flex h-9 w-9 items-center justify-center rounded-[7px] text-muted hover:bg-surface-hover hover:text-body"
          :aria-label="trans('main.close')"
          @click="closeMobile"
        >
          <GIcon name="close" class="text-[16px]" />
        </button>
      </div>

      <nav class="no-scrollbar flex-1 overflow-y-auto px-3 py-4 space-y-6" aria-label="Mobile navigation">
        <div>
          <div class="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
            {{ trans('sidebar.control') }}
          </div>
          <div class="space-y-1">
            <router-link
              v-for="link in serversLinks"
              :key="'m-' + link.route.name"
              :to="link.route"
              :class="navItemClasses(isItemActive(link.route), false)"
              @click="closeMobile"
            >
              <span
                v-if="isItemActive(link.route)"
                class="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-accent"
                aria-hidden="true"
              />
              <GIcon :name="link.icon" :class="navIconClasses(isItemActive(link.route))" />
              <span class="truncate">{{ link.text }}</span>
            </router-link>

            <router-link
              v-for="item in pluginServersMenuItems"
              :key="'m-plug-' + item.pluginId + '-' + item.text"
              :to="item.route"
              :class="navItemClasses(isItemActive(item.route), false)"
              @click="closeMobile"
            >
              <GIcon :name="item.icon" :class="navIconClasses(isItemActive(item.route))" />
              <span class="truncate">{{ pluginsStore.resolvePluginText(item.pluginId, item.text) }}</span>
            </router-link>
          </div>
        </div>

        <div v-if="isAdmin">
          <div class="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
            {{ trans('sidebar.admin') }}
          </div>
          <div class="space-y-1">
            <router-link
              v-for="item in adminMenuItems"
              :key="'m-adm-' + item.key"
              :to="item.route"
              :class="navItemClasses(isItemActive(item.route), false)"
              @click="closeMobile"
            >
              <span
                v-if="isItemActive(item.route)"
                class="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-accent"
                aria-hidden="true"
              />
              <GIcon :name="item.icon" :class="navIconClasses(isItemActive(item.route))" />
              <span class="truncate">{{ item.text }}</span>
            </router-link>
          </div>
        </div>

        <div v-for="(items, section) in customPluginSections" :key="'m-sec-' + section">
          <div class="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
            {{ section }}
          </div>
          <div class="space-y-1">
            <router-link
              v-for="item in items"
              :key="'m-c-' + item.pluginId + '-' + item.text"
              :to="item.route"
              :class="navItemClasses(isItemActive(item.route), false)"
              @click="closeMobile"
            >
              <GIcon :name="item.icon" :class="navIconClasses(isItemActive(item.route))" />
              <span class="truncate">{{ pluginsStore.resolvePluginText(item.pluginId, item.text) }}</span>
            </router-link>
          </div>
        </div>
      </nav>

      <!-- Mobile Drawer User Footer -->
      <div v-if="user" class="border-t border-border p-3 space-y-1">
        <div class="flex items-center gap-3 px-2 py-1.5">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface-raised text-[13px] font-semibold text-accent">
            {{ userInitial }}
          </span>
          <div class="min-w-0 flex-1">
            <div class="truncate text-[13.5px] font-semibold text-body">{{ user.name || user.login }}</div>
            <div class="truncate text-[12px] text-muted">{{ roleLabel }}</div>
          </div>
        </div>

        <router-link
          :to="{ name: 'profile' }"
          class="flex items-center gap-2.5 rounded-[7px] px-3 py-2 text-[13.5px] text-secondary no-underline hover:bg-surface-hover hover:text-body"
          @click="closeMobile"
        >
          <GIcon name="profile" class="w-4 text-center text-[14px] text-muted" />
          <span>{{ trans('navbar.profile') }}</span>
        </router-link>

        <router-link
          :to="{ name: 'tokens' }"
          class="flex items-center gap-2.5 rounded-[7px] px-3 py-2 text-[13.5px] text-secondary no-underline hover:bg-surface-hover hover:text-body"
          @click="closeMobile"
        >
          <GIcon name="key" class="w-4 text-center text-[14px] text-muted" />
          <span>{{ trans('tokens.tokens') }}</span>
        </router-link>

        <a
          href="#"
          class="flex items-center gap-2.5 rounded-[7px] px-3 py-2 text-[13.5px] text-danger no-underline hover:bg-surface-hover"
          @click.prevent="logout"
        >
          <GIcon name="logout" class="w-4 text-center text-[14px]" />
          <span>{{ trans('navbar.sign_out') }}</span>
        </a>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NTooltip } from 'naive-ui'
import { GIcon } from '@gameap/ui'
import { trans } from '@/i18n/i18n'
import { serversLinks } from './bars'
import { useAuthStore } from '@/store/auth'
import { useUISettingsStore } from '@/store/uiSettings'
import { usePluginsStore } from '@/store/plugins'
import PluginSlot from '@/plugins/components/PluginSlot.vue'
import { useAdminMenuItems } from '@/composables/useAdminMenuItems'
import { errorNotification } from '@/parts/dialogs'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const uiSettingsStore = useUISettingsStore()
const pluginsStore = usePluginsStore()

const accountMenuOpen = ref(false)
const accountWrapRef = ref(null)

const minimized = computed({
  get: () => uiSettingsStore.isMenuMinimized,
  set: (value) => uiSettingsStore.setMenuMinimized(value),
})

const mobileOpen = computed(() => uiSettingsStore.isMobileMenuOpen)

function closeMobile() {
  uiSettingsStore.closeMobileMenu()
}

function toggleMinimized() {
  accountMenuOpen.value = false
  uiSettingsStore.toggleMenuMinimized()
}

const user = computed(() => authStore.user)
const isAdmin = computed(() => authStore.isAdmin)

const userInitial = computed(() => {
  const source = user.value?.name || user.value?.login || 'U'
  return source.trim().charAt(0).toUpperCase()
})

const roleLabel = computed(() => {
  return isAdmin.value
    ? (trans('sidebar.role_admin') || trans('users.role_admin') || 'Administrador')
    : (trans('sidebar.role_user') || trans('users.role_user') || 'Usuário')
})

const pluginServersMenuItems = computed(() => pluginsStore.getMenuItems('servers'))
const adminMenuItems = useAdminMenuItems()

const customPluginSections = computed(() => {
  const items = pluginsStore.getMenuItems('custom')
  return items.reduce((acc, item) => {
    const section = item.section || 'Plugins'
    if (!acc[section]) acc[section] = []
    acc[section].push(item)
    return acc
  }, {})
})

function isItemActive(targetRoute) {
  if (!targetRoute) return false

  let targetPath = ''
  try {
    targetPath = router.resolve(targetRoute).path
  } catch {
    return false
  }

  const currentPath = route.path

  if (targetPath === '/' || targetPath === '/home') {
    return currentPath === '/' || currentPath === '/home'
  }

  if (targetPath === '/servers') {
    return currentPath === '/servers' || currentPath.startsWith('/servers/')
  }

  if (targetPath === '/admin/nodes') {
    return (
      currentPath.startsWith('/admin/nodes') ||
      currentPath.startsWith('/admin/dedicated_servers') ||
      currentPath.startsWith('/admin/client_certificates') ||
      currentPath.startsWith('/admin/gdaemon_tasks')
    )
  }

  return currentPath === targetPath || currentPath.startsWith(targetPath + '/')
}

function navItemClasses(active, isCollapsed) {
  const base =
    'gi-focus-ring relative flex h-[42px] items-center rounded-[7px] text-[14px] leading-5 no-underline transition-colors duration-150'
  const layout = isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'
  const state = active
    ? 'bg-surface-selected font-semibold text-body'
    : 'font-medium text-secondary hover:bg-surface-hover hover:text-body'
  return `${base} ${layout} ${state}`
}

function navIconClasses(active) {
  const base = 'w-[18px] text-center text-[15px] shrink-0 transition-colors duration-150'
  return active ? `${base} text-accent` : `${base} text-muted`
}

function logout() {
  accountMenuOpen.value = false
  closeMobile()
  authStore
    .logout()
    .then(() => {
      window.location.href = '/'
    })
    .catch((error) => {
      errorNotification(error)
    })
}

function handleDocumentClick(event) {
  if (accountMenuOpen.value && accountWrapRef.value && !accountWrapRef.value.contains(event.target)) {
    accountMenuOpen.value = false
  }
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    accountMenuOpen.value = false
    if (mobileOpen.value) {
      closeMobile()
    }
  }
}

watch(
  () => route.fullPath,
  () => {
    accountMenuOpen.value = false
    closeMobile()
  },
)

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentClick)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleDocumentClick)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

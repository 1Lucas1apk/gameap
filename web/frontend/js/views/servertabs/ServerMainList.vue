<script setup>
import { GIcon, GDataTable, GEmpty, GGameIcon, GStatusBadge } from '@gameap/ui'
import { h, ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { NPopover, NSelect, NTooltip, useMessage } from 'naive-ui'
import { trans } from '@/i18n/i18n'
import { useAuthStore } from '@/store/auth'
import { useServerFiltersStore } from '@/store/serverFilters'
import { useServerListStore } from '@/store/serverList'
import { usePluginsStore } from '@/store/plugins'
import { filterSlotComponents } from '@/plugins/permissions'
import GButton from '@/components/GButton.vue'
import ServerControlButton from './ServerControlButton.vue'
import { errorNotification } from '@/parts/dialogs'

const NOT_INSTALLED = 0
const INSTALLED = 1
const INSTALLATION_PROCESS = 2

const authStore = useAuthStore()
const filtersStore = useServerFiltersStore()
const serverListStore = useServerListStore()
const pluginsStore = usePluginsStore()
const message = useMessage()

const { servers: serversList, currentPage, perPage, total, lastPage } = storeToRefs(serverListStore)

const isSmallScreen = ref(window.innerWidth < 768)
const handleResize = () => {
  isSmallScreen.value = window.innerWidth < 768
}

const loading = ref(true)
const fetchError = ref(false)
const filterPopoverOpen = ref(false)
const tableRef = ref(null)

// Cache known games and IPs across filter changes so multi-select options don't vanish when filtered
const knownGamesMap = reactive(new Map())
const knownIPsSet = reactive(new Set())

const searchQuery = computed({
  get: () => filtersStore.searchQuery,
  set: (value) => filtersStore.setSearchQuery(value),
})

const selectedStatus = computed({
  get: () => filtersStore.selectedStatus,
  set: (value) => filtersStore.setStatusFilter(value),
})

const selectedGame = computed({
  get: () => filtersStore.selectedGame,
  set: (value) => filtersStore.setGameFilter(value),
})

const selectedIP = computed({
  get: () => filtersStore.selectedIP,
  set: (value) => filtersStore.setIPFilter(value),
})

const statusTabs = computed(() => [
  { key: 'all', label: trans('servers.filter_status_all') },
  { key: 'online', label: trans('servers.online'), dotClass: 'bg-success' },
  { key: 'offline', label: trans('servers.offline'), dotClass: 'bg-danger' },
])

function copyAddress(address) {
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(address).then(() => {
      message.success(trans('main.copied'))
    })
  }
}

const columns = computed(() => {
  const cols = [
    {
      title: trans('servers.column_server'),
      key: 'name',
      width: isSmallScreen.value ? undefined : '36%',
      render(row) {
        const nameNode = canManage(row.id)
          ? h(
              RouterLink,
              {
                to: '/servers/' + row.id,
                class:
                  'gi-focus-ring font-semibold text-[14.5px] leading-5 text-body hover:text-accent transition-colors no-underline truncate block',
              },
              { default: () => row.name },
            )
          : h(
              'span',
              { class: 'font-semibold text-[14.5px] leading-5 text-body truncate block' },
              row.name,
            )

        const gameName = row.game?.name || row.game?.code || ''
        const address = `${row.server_ip}:${row.server_port}`

        return h('div', { class: 'flex items-center gap-3 min-w-0' }, [
          h(
            'div',
            {
              class:
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-border bg-surface-raised text-secondary',
            },
            [h(GGameIcon, { game: row.game?.code || '' })],
          ),
          h('div', { class: 'min-w-0 flex-1' }, [
            nameNode,
            h(
              'div',
              { class: 'mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] leading-4 text-muted truncate' },
              [
                gameName ? h('span', { class: 'truncate' }, gameName) : null,
                isSmallScreen.value
                  ? h('span', { class: 'gi-mono text-[12px] text-secondary' }, address)
                  : null,
              ].filter(Boolean),
            ),
          ]),
        ])
      },
    },
  ]

  if (!isSmallScreen.value) {
    cols.push({
      title: trans('servers.column_address'),
      key: 'address',
      width: '24%',
      render(row) {
        const address = `${row.server_ip}:${row.server_port}`
        return h('div', { class: 'group inline-flex items-center gap-2' }, [
          h('span', { class: 'gi-mono text-[13px] text-secondary' }, address),
          h(
            NTooltip,
            { trigger: 'hover' },
            {
              trigger: () =>
                h(
                  'button',
                  {
                    type: 'button',
                    class:
                      'gi-focus-ring inline-flex h-6 w-6 items-center justify-center rounded text-muted opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-surface-hover hover:text-body transition-all',
                    'aria-label': trans('main.copy'),
                    onClick: () => copyAddress(address),
                  },
                  [h(GIcon, { name: 'copy', class: 'text-[11px]' })],
                ),
              default: () => trans('main.copy'),
            },
          ),
        ])
      },
    })
  }

  cols.push({
    title: trans('servers.status'),
    key: 'status',
    width: isSmallScreen.value ? undefined : '18%',
    render(row) {
      let badgeColor
      let statusText

      if (row.blocked) {
        badgeColor = 'orange'
        statusText = trans('servers.blocked')
      } else if (!row.enabled) {
        badgeColor = 'stone'
        statusText = trans('servers.disabled')
      } else if (!row.installed) {
        badgeColor = 'stone'
        statusText = trans('servers.not_installed')
      } else if (row.installed === INSTALLATION_PROCESS) {
        badgeColor = 'blue'
        statusText = trans('servers.installation')
      } else if (row.online) {
        badgeColor = 'green'
        statusText = trans('servers.online')
      } else {
        badgeColor = 'red'
        statusText = trans('servers.offline')
      }

      return h(GStatusBadge, { color: badgeColor, text: statusText })
    },
  })

  cols.push({
    title: trans('servers.column_actions'),
    key: 'actions',
    width: isSmallScreen.value ? undefined : '22%',
    render(row) {
      const buttons = []

      if (row.enabled && !row.blocked) {
        if (row.installed === NOT_INSTALLED && canUpdate(row.id)) {
          buttons.push(
            h(ServerControlButton, {
              command: 'install',
              'button-color': 'orange',
              'button-size': 'small',
              icon: 'download',
              text: trans('servers.install'),
              'server-id': row.id,
            }),
          )
        } else if (row.installed === INSTALLED) {
          if (row.online && canStop(row.id)) {
            buttons.push(
              h(ServerControlButton, {
                command: 'stop',
                'button-color': 'red',
                'button-size': 'small',
                icon: 'stop',
                text: trans('servers.stop'),
                'server-id': row.id,
              }),
            )
          }

          if (!row.online && canStart(row.id)) {
            buttons.push(
              h(ServerControlButton, {
                command: 'start',
                'button-color': 'green',
                'button-size': 'small',
                icon: 'play',
                text: trans('servers.start'),
                'server-id': row.id,
              }),
            )
          }

          if (canRestart(row.id)) {
            buttons.push(
              h(ServerControlButton, {
                command: 'restart',
                'button-color': 'orange',
                'button-size': 'small',
                icon: 'restart',
                text: trans('servers.restart'),
                'server-id': row.id,
              }),
            )
          }
        }
      }

      if (canManage(row.id)) {
        buttons.push(
          h(
            GButton,
            {
              color: 'white',
              size: 'small',
              route: '/servers/' + row.id,
            },
            {
              default: () => [
                h('span', { class: 'hidden xl:inline' }, trans('servers.control')),
                h(GIcon, { name: 'chevron-right', class: 'text-[11px]' }),
              ],
            },
          ),
        )
      }

      buttons.push(...pluginActions(row))

      return h('div', { class: 'flex flex-wrap items-center gap-1.5' }, buttons)
    },
  })

  return cols
})

const pagination = reactive({
  page: 1,
  pageSize: 30,
  pageCount: 1,
  itemCount: 0,
})

function syncDiscoveredOptions(list) {
  if (!Array.isArray(list)) return
  for (const srv of list) {
    if (srv?.game?.code && srv?.game?.name) {
      knownGamesMap.set(srv.game.code, srv.game.name)
    }
    if (srv?.server_ip) {
      knownIPsSet.add(srv.server_ip)
    }
  }
}

const fetchServers = () => {
  loading.value = true
  fetchError.value = false

  return serverListStore
    .fetchServersByFilter({
      page: pagination.page,
      perPage: pagination.pageSize,
      gameIds: selectedGame.value && selectedGame.value.length > 0 ? selectedGame.value : null,
    })
    .then(() => {
      syncDiscoveredOptions(serversList.value)
      pagination.pageCount = lastPage.value
      pagination.itemCount = total.value
      pagination.page = currentPage.value
      pagination.pageSize = perPage.value
    })
    .catch((error) => {
      fetchError.value = true
      errorNotification(error)
    })
    .finally(() => {
      loading.value = false
    })
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchServers()
}

watch(selectedGame, () => {
  pagination.page = 1
  fetchServers()
})

onMounted(() => {
  window.addEventListener('resize', handleResize)
  fetchServers()

  if (!authStore.isAdmin) {
    authStore.fetchServersAbilities().catch((error) => {
      errorNotification(error)
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const data = computed(() => {
  const q = (searchQuery.value || '').trim().toLowerCase()
  const status = selectedStatus.value
  const ips = selectedIP.value

  return serversList.value.filter((server) => {
    if (ips && ips.length > 0 && !ips.includes(server.server_ip)) {
      return false
    }

    if (status === 'online' && !server.online) {
      return false
    }

    if (status === 'offline' && server.online) {
      return false
    }

    if (q) {
      const nameMatch = (server.name || '').toLowerCase().includes(q)
      const gameNameMatch = (server.game?.name || '').toLowerCase().includes(q)
      const gameCodeMatch = (server.game?.code || '').toLowerCase().includes(q)
      const addrMatch = `${server.server_ip}:${server.server_port}`.toLowerCase().includes(q)
      if (!nameMatch && !gameNameMatch && !gameCodeMatch && !addrMatch) {
        return false
      }
    }

    return true
  })
})

const renderGameLabel = (option) => {
  return h('div', { class: 'flex items-center gap-2' }, [
    h(GGameIcon, { game: option.value }),
    h('span', {}, option.label),
  ])
}

const gamesOptions = computed(() => {
  const entries = Array.from(knownGamesMap.entries())
  entries.sort((a, b) => a[1].localeCompare(b[1]))
  return entries.map(([code, name]) => ({ label: name, value: code }))
})

const gamesIPOptions = computed(() => {
  return Array.from(knownIPsSet)
    .sort()
    .map((ip) => ({ label: ip, value: ip }))
})

const hasActiveFilters = computed(() => filtersStore.hasFilters)
const advancedFilterCount = computed(() => filtersStore.advancedFilterCount)

function clearAllFilters() {
  filtersStore.clearFilters()
  filterPopoverOpen.value = false
}

function canManage(serverId) {
  return authStore.canServerAbility(serverId, 'game-server-common')
}

function canStart(serverId) {
  return authStore.canServerAbility(serverId, 'game-server-start')
}

function canStop(serverId) {
  return authStore.canServerAbility(serverId, 'game-server-stop')
}

function canRestart(serverId) {
  return authStore.canServerAbility(serverId, 'game-server-restart')
}

function canUpdate(serverId) {
  return authStore.canServerAbility(serverId, 'game-server-update')
}

function serverAbilities(serverId) {
  return new Proxy(
    {},
    {
      get: (_target, ability) => authStore.canServerAbility(serverId, ability) === true,
    },
  )
}

function pluginActions(row) {
  if (!pluginsStore.isInitialized) {
    return []
  }

  return filterSlotComponents(pluginsStore.getSlotComponents('servers-list-actions'), {
    abilities: serverAbilities(row.id),
    game: row.game,
  }).map((item) =>
    h(item.component, {
      ...item.props,
      serverId: row.id,
      server: row,
      pluginId: item.pluginId,
    }),
  )
}
</script>

<template>
  <!-- Unified 40px Operational Toolbar -->
  <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
    <div class="flex flex-1 flex-wrap items-center gap-2.5 min-w-0">
      <!-- Search Input (340px desktop, 40px height) -->
      <div class="relative w-full sm:w-[320px] lg:w-[350px]">
        <GIcon
          name="search"
          class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-muted"
        />
        <input
          v-model="searchQuery"
          type="text"
          class="gi-toolbar-search w-full pl-9 pr-8"
          :placeholder="trans('servers.search_placeholder')"
          :aria-label="trans('servers.search_placeholder')"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="gi-focus-ring absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded text-muted hover:text-body"
          :aria-label="trans('main.clear')"
          @click="searchQuery = ''"
        >
          <GIcon name="close" class="text-[12px]" />
        </button>
      </div>

      <!-- Compact Segmented Status Filter (40px height) -->
      <div
        class="inline-flex h-10 items-center rounded-[8px] border border-border bg-sidebar p-1"
        role="group"
        :aria-label="trans('servers.status')"
      >
        <button
          v-for="tab in statusTabs"
          :key="tab.key"
          type="button"
          :class="[
            'gi-focus-ring inline-flex h-full items-center gap-1.5 rounded-[6px] px-3 text-[13px] font-medium transition-colors duration-150',
            selectedStatus === tab.key
              ? 'bg-surface-raised text-body shadow-sm'
              : 'text-muted hover:text-body',
          ]"
          @click="selectedStatus = tab.key"
        >
          <span
            v-if="tab.dotClass"
            :class="['h-1.5 w-1.5 rounded-full', tab.dotClass]"
            aria-hidden="true"
          />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Advanced Filters Popover Button (Game & IP) -->
      <n-popover
        v-model:show="filterPopoverOpen"
        trigger="click"
        placement="bottom-start"
        :show-arrow="false"
        raw
      >
        <template #trigger>
          <button
            type="button"
            :class="[
              'gi-focus-ring inline-flex h-10 items-center gap-2 rounded-[8px] border px-3.5 text-[13.5px] font-medium transition-colors duration-150',
              advancedFilterCount > 0
                ? 'border-accent/60 bg-surface-selected text-body'
                : 'border-border bg-sidebar text-secondary hover:bg-surface-hover hover:text-body',
            ]"
          >
            <GIcon name="sliders" class="text-[13px] text-muted" />
            <span>{{ trans('servers.filters') }}</span>
            <span
              v-if="advancedFilterCount > 0"
              class="gi-mono inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-primary-fg"
            >
              {{ advancedFilterCount }}
            </span>
          </button>
        </template>

        <div class="w-[320px] sm:w-[360px] rounded-[8px] border border-border bg-surface-raised p-4 shadow-xl space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-[13.5px] font-semibold text-body">{{ trans('servers.filters') }}</span>
            <button
              v-if="advancedFilterCount > 0"
              type="button"
              class="gi-focus-ring rounded px-1.5 py-0.5 text-[12.5px] font-medium text-accent hover:underline"
              @click="filtersStore.clearAdvancedFilters()"
            >
              {{ trans('servers.clear_filters') }}
            </button>
          </div>

          <div class="space-y-1.5">
            <label class="block text-[12px] font-medium text-secondary">
              {{ trans('servers.game') }}
            </label>
            <n-select
              v-model:value="selectedGame"
              :options="gamesOptions"
              :render-label="renderGameLabel"
              multiple
              clearable
              :placeholder="trans('servers.select_game_filter_placeholder')"
            />
          </div>

          <div class="space-y-1.5">
            <label class="block text-[12px] font-medium text-secondary">
              {{ trans('servers.ip_port') }}
            </label>
            <n-select
              v-model:value="selectedIP"
              :options="gamesIPOptions"
              multiple
              clearable
              :placeholder="trans('servers.select_ip_filter_placeholder')"
            />
          </div>
        </div>
      </n-popover>

      <!-- Inline Clear Filters Action -->
      <button
        v-if="hasActiveFilters"
        type="button"
        class="gi-focus-ring inline-flex h-10 items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-medium text-muted transition-colors hover:bg-surface-hover hover:text-body"
        @click="clearAllFilters"
      >
        <GIcon name="close" class="text-[12px]" />
        <span>{{ trans('servers.clear_filters') }}</span>
      </button>
    </div>
  </div>

  <!-- Error State -->
  <div
    v-if="fetchError && !loading"
    class="rounded-card border border-border bg-topbar overflow-hidden"
  >
    <GEmpty
      icon="alert"
      :title="trans('servers.load_error_title')"
      :description="trans('servers.load_error_description')"
    >
      <GButton color="primary" size="middle" @click="fetchServers">
        <GIcon name="refresh" class="text-[13px]" />
        <span>{{ trans('main.retry') }}</span>
      </GButton>
    </GEmpty>
  </div>

  <!-- Server Data Table / Skeleton / Contextual Empty States -->
  <GDataTable
    v-else
    ref="tableRef"
    remote
    :columns="columns"
    :data="data"
    :loading="loading"
    :pagination="pagination"
    :scroll-x="isSmallScreen ? 520 : undefined"
    @update:page="handlePageChange"
  >
    <template #empty>
      <!-- Filtered / Searched Empty State -->
      <GEmpty
        v-if="hasActiveFilters"
        icon="search"
        :title="trans('servers.no_results_title')"
        :description="trans('servers.no_results_description')"
      >
        <GButton color="white" size="middle" @click="clearAllFilters">
          <GIcon name="eraser" class="text-[13px]" />
          <span>{{ trans('servers.clear_filters') }}</span>
        </GButton>
      </GEmpty>

      <!-- Zero Servers Registered Empty State -->
      <GEmpty
        v-else
        icon="server"
        :title="trans('servers.empty_title')"
        :description="authStore.isAdmin ? trans('servers.empty_description') : trans('servers.empty_user_description')"
      >
        <GButton
          v-if="authStore.isAdmin"
          color="primary"
          size="middle"
          :route="{ name: 'admin.servers.create' }"
        >
          <GIcon name="plus" class="text-[13px]" />
          <span>{{ trans('servers.create') }}</span>
        </GButton>
      </GEmpty>
    </template>
  </GDataTable>
</template>

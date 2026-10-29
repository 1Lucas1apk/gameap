<template>
  <div>
    <GBreadcrumbs :items="breadcrumbs" />

    <GPageHeader
      :title="trans('servers.game_servers')"
      :description="trans('servers.admin_page_description')"
    >
      <template #actions>
        <GButton color="primary" size="middle" :route="{ name: 'admin.servers.create' }">
          <GIcon name="plus" class="text-[13px]" />
          <span>{{ trans('servers.create') }}</span>
        </GButton>
      </template>
    </GPageHeader>

    <!-- Unified 40px Admin Toolbar -->
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div class="flex flex-1 flex-wrap items-center gap-2.5 min-w-0">
        <!-- Search Input -->
        <div class="relative w-full sm:w-[300px] lg:w-[340px]">
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

        <!-- Status Filter -->
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
              statusFilter === tab.key
                ? 'bg-surface-raised text-body shadow-sm'
                : 'text-muted hover:text-body',
            ]"
            @click="statusFilter = tab.key"
          >
            <span
              v-if="tab.dotClass"
              :class="['h-1.5 w-1.5 rounded-full', tab.dotClass]"
              aria-hidden="true"
            />
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <!-- Node Selector -->
        <div v-if="nodeOptions.length > 0" class="w-full sm:w-[220px]">
          <n-select
            v-model:value="selectedNodeId"
            :options="nodeOptions"
            clearable
            :placeholder="trans('servers.dedicated_server')"
            @update:value="handleNodeFilterChange"
          />
        </div>

        <button
          v-if="hasActiveFilters"
          type="button"
          class="gi-focus-ring inline-flex h-10 items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-medium text-muted transition-colors hover:bg-surface-hover hover:text-body"
          @click="resetFilters"
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

    <!-- Table / Empty State -->
    <GDataTable
      v-else
      ref="tableRef"
      remote
      :columns="columns"
      :data="serversData"
      :loading="loading"
      :pagination="pagination"
      :scroll-x="isSmallScreen ? 560 : undefined"
      @update:page="handlePageChange"
    >
      <template #empty>
        <GEmpty
          v-if="hasActiveFilters"
          icon="search"
          :title="trans('servers.no_results_title')"
          :description="trans('servers.no_results_description')"
        >
          <GButton color="white" size="middle" @click="resetFilters">
            <GIcon name="eraser" class="text-[13px]" />
            <span>{{ trans('servers.clear_filters') }}</span>
          </GButton>
        </GEmpty>

        <GEmpty
          v-else
          icon="server"
          :title="trans('servers.empty_title')"
          :description="trans('servers.empty_description')"
        >
          <GButton color="primary" size="middle" :route="{ name: 'admin.servers.create' }">
            <GIcon name="plus" class="text-[13px]" />
            <span>{{ trans('servers.create') }}</span>
          </GButton>
        </GEmpty>
      </template>
    </GDataTable>
  </div>
</template>

<script setup>
import {
  GBreadcrumbs,
  GPageHeader,
  GIcon,
  GDataTable,
  GEmpty,
  GGameIcon,
  GStatusBadge,
} from '@gameap/ui'
import { NSelect, NTooltip, useMessage } from 'naive-ui'
import { trans } from '../../i18n/i18n'
import GButton from '../../components/GButton.vue'
import { h, onMounted, computed, ref, reactive } from 'vue'
import { useServerListStore } from '../../store/serverList'
import { useNodeListStore } from '../../store/nodeList'
import { errorNotification } from '../../parts/dialogs'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import { useIsSmallScreen } from '@/composables/useIsSmallScreen'

const INSTALLATION_PROCESS = 2

const serverListStore = useServerListStore()
const nodeListStore = useNodeListStore()
const message = useMessage()

const { servers, currentPage, perPage, total, lastPage } = storeToRefs(serverListStore)
const { nodes } = storeToRefs(nodeListStore)

const searchQuery = ref('')
const statusFilter = ref('all')
const selectedNodeId = ref(null)
const fetchError = ref(false)
const tableRef = ref(null)

const breadcrumbs = computed(() => [
  { route: '/', text: 'GameAP', icon: 'gameap' },
  { text: trans('sidebar.admin') },
  { text: trans('servers.game_servers') },
])

const statusTabs = computed(() => [
  { key: 'all', label: trans('servers.filter_status_all') },
  { key: 'online', label: trans('servers.online'), dotClass: 'bg-success' },
  { key: 'offline', label: trans('servers.offline'), dotClass: 'bg-danger' },
])

const nodeOptions = computed(() =>
  (nodes.value || []).map((n) => ({
    label: n.name,
    value: n.id,
  })),
)

const hasActiveFilters = computed(
  () =>
    Boolean(searchQuery.value.trim()) ||
    statusFilter.value !== 'all' ||
    selectedNodeId.value !== null,
)

function copyAddress(address) {
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(address).then(() => {
      message.success(trans('main.copied'))
    })
  }
}

const isSmallScreen = useIsSmallScreen()

const columns = computed(() => {
  const cols = [
    {
      title: trans('servers.column_server'),
      key: 'name',
      width: isSmallScreen.value ? undefined : '30%',
      render: (row) =>
        h('div', { class: 'flex items-center gap-3 min-w-0' }, [
          h(
            'div',
            {
              class:
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-border bg-surface-raised text-secondary',
            },
            [h(GGameIcon, { game: row.gameCode })],
          ),
          h('div', { class: 'min-w-0 flex-1' }, [
            h(
              RouterLink,
              {
                to: { name: 'admin.servers.edit', params: { id: row.id } },
                class:
                  'gi-focus-ring font-semibold text-[14.5px] leading-5 text-body hover:text-accent transition-colors no-underline truncate block',
              },
              { default: () => row.name },
            ),
            h('div', { class: 'mt-0.5 text-[12px] leading-4 text-muted truncate' }, row.game),
          ]),
        ]),
    },
    {
      title: trans('servers.column_address'),
      key: 'ipPort',
      width: isSmallScreen.value ? undefined : '20%',
      render: (row) =>
        h('div', { class: 'group inline-flex items-center gap-2' }, [
          h('span', { class: 'gi-mono text-[13px] text-secondary' }, row.ipPort),
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
                    onClick: () => copyAddress(row.ipPort),
                  },
                  [h(GIcon, { name: 'copy', class: 'text-[11px]' })],
                ),
              default: () => trans('main.copy'),
            },
          ),
        ]),
    },
  ]

  if (!isSmallScreen.value) {
    cols.push({
      title: trans('servers.dedicated_server'),
      key: 'node',
      width: '18%',
      render: (row) => {
        if (!row.nodeName) {
          return h('span', { class: 'text-muted' }, '—')
        }
        return h(
          RouterLink,
          {
            to: { name: 'admin.nodes.view', params: { id: row.nodeId } },
            class:
              'gi-focus-ring inline-flex items-center gap-1.5 text-[13.5px] font-medium text-secondary hover:text-accent transition-colors no-underline',
          },
          {
            default: () => [
              h(GIcon, { name: 'node', class: 'text-[12px] text-muted' }),
              h('span', { class: 'truncate' }, row.nodeName),
            ],
          },
        )
      },
    })
  }

  cols.push({
    title: trans('servers.status'),
    key: 'status',
    width: isSmallScreen.value ? undefined : '14%',
    render: (row) => h(GStatusBadge, { color: row.badgeColor, text: row.statusText }),
  })

  cols.push({
    title: trans('servers.column_actions'),
    key: 'actions',
    width: isSmallScreen.value ? undefined : '18%',
    render(row) {
      return h('div', { class: 'flex flex-wrap items-center gap-1.5' }, [
        h(
          GButton,
          {
            color: 'white',
            size: 'small',
            route: '/servers/' + row.id,
            title: trans('servers.control'),
          },
          {
            default: () => [h(GIcon, { name: 'terminal', class: 'text-[12px]' })],
          },
        ),
        h(
          GButton,
          {
            color: 'white',
            size: 'small',
            route: { name: 'admin.servers.edit', params: { id: row.id } },
          },
          {
            default: () => [
              h(GIcon, { name: 'edit', class: 'text-[12px]' }),
              h('span', { class: 'hidden xl:inline' }, trans('main.edit')),
            ],
          },
        ),
        h(
          GButton,
          {
            color: 'red',
            size: 'small',
            title: trans('main.delete'),
            onClick: () => onClickDelete(row.id),
          },
          {
            default: () => [
              h(GIcon, { name: 'delete', class: 'text-[12px]' }),
              h('span', { class: 'hidden xl:inline' }, trans('main.delete')),
            ],
          },
        ),
      ])
    },
  })

  return cols
})

const loading = computed(() => serverListStore.loading || nodeListStore.loading)

const pagination = reactive({
  page: 1,
  pageSize: 30,
  pageCount: 1,
  itemCount: 0,
})

onMounted(() => {
  fetchServers()
  fetchNodes()
})

const fetchServers = () => {
  fetchError.value = false
  return serverListStore
    .fetchServersByFilter({
      page: pagination.page,
      perPage: pagination.pageSize,
      nodeId: selectedNodeId.value || null,
    })
    .then(() => {
      pagination.pageCount = lastPage.value
      pagination.itemCount = total.value
      pagination.page = currentPage.value
      pagination.pageSize = perPage.value
    })
    .catch((error) => {
      fetchError.value = true
      errorNotification(error)
    })
}

const fetchNodes = () => {
  nodeListStore.fetchNodesByFilter([]).catch((error) => {
    errorNotification(error)
  })
}

function handleNodeFilterChange() {
  pagination.page = 1
  fetchServers()
}

function resetFilters() {
  const hadNode = selectedNodeId.value !== null
  searchQuery.value = ''
  statusFilter.value = 'all'
  selectedNodeId.value = null
  if (hadNode) {
    pagination.page = 1
    fetchServers()
  }
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchServers()
}

const serversData = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const st = statusFilter.value

  return servers.value
    .map((server) => {
      const node = nodes.value.find((n) => n.id === server.ds_id)
      let badgeColor = 'red'
      let statusText = trans('servers.offline')

      if (server.blocked) {
        badgeColor = 'orange'
        statusText = trans('servers.blocked')
      } else if (!server.enabled) {
        badgeColor = 'stone'
        statusText = trans('servers.disabled')
      } else if (!server.installed) {
        badgeColor = 'stone'
        statusText = trans('servers.not_installed')
      } else if (server.installed === INSTALLATION_PROCESS) {
        badgeColor = 'blue'
        statusText = trans('servers.installation')
      } else if (server.online) {
        badgeColor = 'green'
        statusText = trans('servers.online')
      }

      return {
        id: server.id,
        name: server.name,
        game: server.game?.name || '',
        gameCode: server.game?.code || '',
        nodeId: server.ds_id,
        nodeName: node?.name || '',
        ipPort: `${server.server_ip}:${server.server_port}`,
        online: Boolean(server.online),
        badgeColor,
        statusText,
      }
    })
    .filter((row) => {
      if (st === 'online' && !row.online) return false
      if (st === 'offline' && row.online) return false

      if (q) {
        const match =
          row.name.toLowerCase().includes(q) ||
          row.game.toLowerCase().includes(q) ||
          row.gameCode.toLowerCase().includes(q) ||
          row.ipPort.toLowerCase().includes(q) ||
          row.nodeName.toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
})

const onClickDelete = (id) => {
  let deleteFiles = false

  window.$dialog.warning({
    title: trans('servers.delete_confirm_msg'),
    content: () =>
      h('label', { class: 'mt-4 mb-2 flex items-center gap-2 cursor-pointer text-[13.5px] text-secondary' }, [
        h('input', {
          type: 'checkbox',
          id: 'delete-files-checkbox',
          class: 'rounded border-border',
          onChange: (e) => {
            deleteFiles = Boolean(e?.target?.checked)
          },
        }),
        h('span', {}, trans('servers.delete_files')),
      ]),
    positiveText: trans('main.yes'),
    negativeText: trans('main.no'),
    closable: true,
    onPositiveClick: () => {
      deleteByID(id, deleteFiles)
    },
  })
}

const deleteByID = (id, deleteFiles) => {
  serverListStore
    .deleteById(id, deleteFiles)
    .catch((error) => {
      errorNotification(error)
    })
    .finally(() => {
      fetchServers()
    })
}
</script>

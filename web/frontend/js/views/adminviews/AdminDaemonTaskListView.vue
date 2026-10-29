<template>
  <div>
    <GBreadcrumbs :items="breadcrumbs" />

    <GPageHeader
      :title="trans('gdaemon_tasks.gdaemon_tasks')"
      :description="trans('gdaemon_tasks.page_description')"
    />

    <!-- Structured 40px Multi-Filter Toolbar -->
    <div class="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
      <n-select
        v-model:value="search.tasks"
        multiple
        clearable
        :options="taskOptions"
        :placeholder="trans('gdaemon_tasks.task')"
        :render-label="renderTaskOptionLabel"
        @update:value="onUpdateFilters"
      />
      <n-select
        v-model:value="search.statuses"
        multiple
        clearable
        :options="statusOptions"
        :placeholder="trans('gdaemon_tasks.status')"
        :render-label="renderStatusOptionLabel"
        :render-tag="renderStatusOptionTag"
        @update:value="onUpdateFilters"
      />
      <n-select
        v-model:value="search.servers"
        multiple
        clearable
        :options="serverOptions"
        :placeholder="trans('servers.game_servers')"
        @update:value="onUpdateFilters"
      />
      <n-select
        v-model:value="search.nodes"
        multiple
        clearable
        :options="nodeOptions"
        :placeholder="trans('dedicated_servers.dedicated_servers')"
        @update:value="onUpdateFilters"
      />
      <div>
        <GButton
          color="white"
          size="middle"
          class="w-full sm:w-auto"
          :disabled="!isFiltersSet()"
          @click="clearFilters"
        >
          <GIcon name="eraser" class="text-[13px] text-muted" />
          <span>{{ trans('main.clear_filters') }}</span>
        </GButton>
      </div>
    </div>

    <GDataTable
      ref="tableRef"
      remote
      :columns="columns"
      :data="listData"
      :loading="loading"
      :pagination="pagination"
      :scroll-x="800"
      @update:page="handlePageChange"
    >
      <template #empty>
        <GEmpty icon="tasks" :title="trans('main.empty_list')">
          <GButton v-if="isFiltersSet()" color="white" size="middle" @click="clearFilters">
            <GIcon name="eraser" class="text-[13px]" />
            <span>{{ trans('main.clear_filters') }}</span>
          </GButton>
        </GEmpty>
      </template>
    </GDataTable>
  </div>
</template>

<script setup>
import { GBreadcrumbs, GPageHeader, GEmpty, GStatusBadge, GIcon, GDataTable } from '@gameap/ui'
import { computed, h, ref, reactive, onMounted, onUnmounted } from 'vue'
import { NSelect } from 'naive-ui'
import { trans } from '@/i18n/i18n'
import { useDaemonTaskListStore } from '@/store/daemonTaskList'
import { useNodeListStore } from '@/store/nodeList'
import { useServerListStore } from '@/store/serverList'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import GButton from '@/components/GButton.vue'
import { errorNotification } from '@/parts/dialogs'

const daemonTaskListStore = useDaemonTaskListStore()
const nodeListStore = useNodeListStore()
const serverListStore = useServerListStore()

const route = useRoute()
const router = useRouter()
const tableRef = ref(null)

const breadcrumbs = computed(() => [
  { route: '/', text: 'GameAP', icon: 'gameap' },
  { route: { name: 'admin.nodes.index' }, text: trans('sidebar.dedicated_servers') },
  { text: trans('gdaemon_tasks.gdaemon_tasks') },
])

const isSmallScreen = ref(window.innerWidth < 1024)
const handleResize = () => {
  isSmallScreen.value = window.innerWidth < 1024
}

const formatDateTime = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const columns = computed(() => {
  const cols = [
    {
      title: trans('gdaemon_tasks.task'),
      key: 'task',
      ellipsis: { tooltip: true },
      render(row) {
        return h('div', { class: 'inline-flex items-center font-medium text-body' }, [
          ...renderTaskNameWithIcon(row.task, trans('gdaemon_tasks.' + row.task)),
        ])
      },
    },
    {
      title: trans('gdaemon_tasks.status'),
      key: 'status',
      className: 'whitespace-nowrap',
      width: 140,
      render(row) {
        return h(GStatusBadge, {
          status: row.status,
          text: trans('gdaemon_tasks.status_' + row.status),
        })
      },
    },
    {
      title: trans('servers.game_server'),
      ellipsis: { tooltip: true },
      render(row) {
        if (!row.serverId) return h('span', { class: 'text-muted' }, '—')
        const server = servers.value.find((s) => s.id === row.serverId)
        if (!server) return h('span', { class: 'text-muted' }, '—')

        return h(
          RouterLink,
          {
            to: { name: 'servers.control', params: { id: server.id } },
            class: 'font-medium text-body hover:text-accent transition-colors no-underline',
          },
          { default: () => server.name },
        )
      },
    },
    {
      title: trans('servers.dedicated_server'),
      ellipsis: { tooltip: true },
      render(row) {
        const node = nodes.value.find((n) => n.id === row.nodeId)
        return h('span', { class: 'text-secondary' }, node ? node.name : '—')
      },
    },
    {
      title: trans('gdaemon_tasks.created'),
      key: 'createdAt',
      className: 'whitespace-nowrap gi-mono text-[12.5px] text-secondary',
      width: 168,
    },
  ]

  if (!isSmallScreen.value) {
    cols.push({
      title: trans('gdaemon_tasks.updated'),
      key: 'updatedAt',
      className: 'whitespace-nowrap gi-mono text-[12.5px] text-secondary',
      width: 168,
    })
  }

  cols.push({
    title: trans('main.actions'),
    className: 'whitespace-nowrap',
    width: 120,
    render(row) {
      return h(
        GButton,
        {
          color: 'white',
          size: 'small',
          route: { name: 'admin.gdaemon_tasks.output', params: { id: row.id } },
        },
        {
          default: () => [
            h(GIcon, { name: 'view', class: 'text-[12px]' }),
            h('span', { class: 'hidden lg:inline' }, trans('main.view')),
          ],
        },
      )
    },
  })

  return cols
})

const { daemonTaskList, currentPage, total } = storeToRefs(daemonTaskListStore)
const { nodes } = storeToRefs(nodeListStore)
const { servers } = storeToRefs(serverListStore)

const pagination = reactive({
  page: currentPage,
  pageSize: 30,
})

const loading = computed(
  () => daemonTaskListStore.loading || nodeListStore.loading || serverListStore.loading,
)

onMounted(() => {
  currentPage.value = 1
  window.addEventListener('resize', handleResize)
  fetchTasks()
  fetchNodes()
  fetchServers()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const fetchTasks = () => {
  const filter = {
    page: currentPage.value,
  }
  if (search.value.tasks?.length) filter.tasks = search.value.tasks
  if (search.value.statuses?.length) filter.statuses = search.value.statuses
  if (search.value.servers?.length) filter.servers = search.value.servers
  if (search.value.nodes?.length) filter.nodes = search.value.nodes

  daemonTaskListStore
    .fetchTasksByFilter(filter)
    .then(() => {
      pagination.pageCount = total.lastPage
      pagination.itemCount = total.value
    })
    .catch((error) => {
      errorNotification(error)
    })
}

const fetchNodes = () => {
  nodeListStore.fetchNodesByFilter([]).catch((error) => {
    errorNotification(error)
  })
}

const fetchServers = () => {
  serverListStore.fetchServersByFilter({ perPage: 1000 }).catch((error) => {
    errorNotification(error)
  })
}

const listData = computed(() =>
  daemonTaskList.value.map((task) => ({
    id: task.id,
    task: task.task,
    status: task.status,
    serverId: task.server_id,
    nodeId: task.dedicated_server_id,
    createdAt: formatDateTime(task.created_at),
    updatedAt: formatDateTime(task.updated_at),
  })),
)

const parseNodesQuery = (value) => {
  if (!value) return null
  const ids = [
    ...new Set(
      (Array.isArray(value) ? value : [value])
        .flatMap((v) => String(v).split(','))
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ]
  return ids.length > 0 ? ids : null
}

const search = ref({
  tasks: null,
  statuses: null,
  servers: null,
  nodes: parseNodesQuery(route.query.node),
})

const taskOptions = computed(() => [
  { label: trans('gdaemon_tasks.gsstart'), value: 'gsstart' },
  { label: trans('gdaemon_tasks.gsstop'), value: 'gsstop' },
  { label: trans('gdaemon_tasks.gsrest'), value: 'gsrest' },
  { label: trans('gdaemon_tasks.gsupd'), value: 'gsupd' },
  { label: trans('gdaemon_tasks.gsinst'), value: 'gsinst' },
  { label: trans('gdaemon_tasks.gsdel'), value: 'gsdel' },
  { label: trans('gdaemon_tasks.gsmove'), value: 'gsmove' },
  { label: trans('gdaemon_tasks.cmdexec'), value: 'cmdexec' },
])

const statusOptions = computed(() => [
  { label: trans('gdaemon_tasks.status_waiting'), value: 'waiting' },
  { label: trans('gdaemon_tasks.status_working'), value: 'working' },
  { label: trans('gdaemon_tasks.status_error'), value: 'error' },
  { label: trans('gdaemon_tasks.status_success'), value: 'success' },
  { label: trans('gdaemon_tasks.status_canceled'), value: 'canceled' },
])

const renderTaskOptionLabel = (option) => {
  return renderTaskNameWithIcon(option.value, option.label)
}

const renderTaskNameWithIcon = (taskCode, taskName) => {
  const iconMap = {
    gsstart: 'play',
    gsstop: 'stop',
    gsrest: 'restart',
    gsupd: 'refresh',
    gsinst: 'download',
    gsdel: 'delete',
    gsmove: 'move',
    cmdexec: 'terminal',
  }
  const icon = iconMap[taskCode]
  return icon
    ? [h(GIcon, { name: icon, class: 'mr-2 text-[12px] text-muted' }), h('span', {}, taskName)]
    : [h('span', {}, taskName)]
}

const renderStatusOptionLabel = (option) => {
  return h(GStatusBadge, { status: option.value, text: option.label })
}

const renderStatusOptionTag = (item) => {
  return h(GStatusBadge, { status: item.option.value, text: item.option.label })
}

const nodeOptions = computed(() =>
  nodes.value.map((node) => ({
    label: node.name,
    value: node.id,
  })),
)

const serverOptions = computed(() =>
  servers.value.map((server) => ({
    label: server.name,
    value: server.id,
  })),
)

const handlePageChange = (page) => {
  currentPage.value = page
  fetchTasks()
}

const stripNodesQuery = () => {
  if (route.query.node === undefined) return
  const query = { ...route.query }
  delete query.node
  router.replace({ query })
}

const onUpdateFilters = () => {
  stripNodesQuery()
  currentPage.value = 1
  fetchTasks()
}

const isFiltersSet = () => {
  return Boolean(
    search.value.tasks?.length ||
      search.value.statuses?.length ||
      search.value.servers?.length ||
      search.value.nodes?.length,
  )
}

const clearFilters = () => {
  stripNodesQuery()
  search.value.tasks = null
  search.value.statuses = null
  search.value.servers = null
  search.value.nodes = null
  currentPage.value = 1
  fetchTasks()
}
</script>

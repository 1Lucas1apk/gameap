<template>
  <div>
    <GBreadcrumbs :items="breadcrumbs" />

    <GPageHeader
      :title="trans('home.main')"
      :description="trans('home.page_description')"
    >
      <template #actions>
        <GButton
          v-if="isAdmin"
          color="primary"
          size="middle"
          :route="{ name: 'admin.servers.create' }"
        >
          <GIcon name="plus" class="text-[13px]" />
          <span>{{ trans('servers.create') }}</span>
        </GButton>
      </template>
    </GPageHeader>

    <!-- Operational Summary Cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <!-- Game Servers Summary Card -->
      <router-link
        :to="{ name: 'servers' }"
        class="gi-focus-ring group flex flex-col justify-between rounded-card border border-border bg-surface p-5 no-underline transition-colors duration-150 hover:border-border-strong hover:bg-surface-raised"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="flex h-9 w-9 items-center justify-center rounded-[8px] border border-border bg-surface-raised text-accent">
              <GIcon name="server" class="text-[15px]" />
            </span>
            <span class="text-[15px] font-semibold text-body group-hover:text-accent transition-colors">
              {{ trans('servers.game_servers') }}
            </span>
          </div>
          <GIcon name="chevron-right" class="text-[12px] text-muted group-hover:text-body transition-colors" />
        </div>

        <div class="mt-5 flex items-baseline justify-between border-t border-border/60 pt-3.5">
          <div>
            <div class="text-[12px] text-muted">Total</div>
            <div class="gi-mono mt-0.5 text-[24px] font-semibold leading-7 text-body">
              <GIcon v-if="loading" name="loading" class="text-[16px] text-muted" />
              <span v-else>{{ serverTotal }}</span>
            </div>
          </div>

          <div class="flex items-center gap-4 text-[13px]">
            <div class="flex items-center gap-1.5">
              <span class="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
              <span class="text-muted">{{ trans('servers.online') }}:</span>
              <span class="gi-mono font-semibold text-body">{{ loading ? '—' : serverListStore.summary.online }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="h-2 w-2 rounded-full bg-danger" aria-hidden="true" />
              <span class="text-muted">{{ trans('servers.offline') }}:</span>
              <span class="gi-mono font-semibold text-body">{{ loading ? '—' : serverListStore.summary.offline }}</span>
            </div>
          </div>
        </div>
      </router-link>

      <!-- Dedicated Nodes Summary Card (Admin) -->
      <router-link
        v-if="isAdmin"
        :to="{ name: 'admin.nodes.index' }"
        class="gi-focus-ring group flex flex-col justify-between rounded-card border border-border bg-surface p-5 no-underline transition-colors duration-150 hover:border-border-strong hover:bg-surface-raised"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="flex h-9 w-9 items-center justify-center rounded-[8px] border border-border bg-surface-raised text-accent">
              <GIcon name="node" class="text-[15px]" />
            </span>
            <span class="text-[15px] font-semibold text-body group-hover:text-accent transition-colors">
              {{ trans('sidebar.dedicated_servers') }}
            </span>
          </div>
          <GIcon name="chevron-right" class="text-[12px] text-muted group-hover:text-body transition-colors" />
        </div>

        <div class="mt-5 flex items-baseline justify-between border-t border-border/60 pt-3.5">
          <div>
            <div class="text-[12px] text-muted">Total</div>
            <div class="gi-mono mt-0.5 text-[24px] font-semibold leading-7 text-body">
              <GIcon v-if="loading" name="loading" class="text-[16px] text-muted" />
              <span v-else>{{ nodeTotal }}</span>
            </div>
          </div>

          <div class="flex items-center gap-4 text-[13px]">
            <div class="flex items-center gap-1.5">
              <span class="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
              <span class="text-muted">{{ trans('dedicated_servers.online') }}:</span>
              <span class="gi-mono font-semibold text-body">{{ loading ? '—' : nodeListStore.summary.online }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="h-2 w-2 rounded-full bg-danger" aria-hidden="true" />
              <span class="text-muted">{{ trans('dedicated_servers.offline') }}:</span>
              <span class="gi-mono font-semibold text-body">{{ loading ? '—' : nodeListStore.summary.offline }}</span>
            </div>
          </div>
        </div>
      </router-link>

      <!-- Plugin Home Buttons -->
      <template v-for="btn in homeButtons" :key="btn.pluginId + '-' + btn.name">
        <component
          v-if="btn.component"
          :is="btn.component"
          v-bind="btn.props"
          :plugin-id="btn.pluginId"
        />
        <router-link
          v-else
          :to="btn.props.route"
          class="gi-focus-ring group flex flex-col justify-between rounded-card border border-border bg-surface p-5 no-underline transition-colors duration-150 hover:border-border-strong hover:bg-surface-raised"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="flex h-9 w-9 items-center justify-center rounded-[8px] border border-border bg-surface-raised text-accent">
                <GIcon v-if="hasIcon(btn.icon)" :name="btn.icon" class="text-[15px]" />
                <i v-else :class="btn.icon" />
              </span>
              <span class="text-[15px] font-semibold text-body group-hover:text-accent transition-colors">
                {{ pluginsStore.resolvePluginText(btn.pluginId, btn.label) }}
              </span>
            </div>
            <GIcon name="chevron-right" class="text-[12px] text-muted" />
          </div>
        </router-link>
      </template>
    </div>

    <!-- System Versions Block (Admin) -->
    <VersionsBlock v-if="isAdmin" class="mt-6" />

    <!-- Resources & Community Strip -->
    <div class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <!-- Documentation & API -->
      <div class="rounded-card border border-border bg-surface p-5 flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2 text-[14.5px] font-semibold text-body">
            <GIcon name="book" class="text-[14px] text-muted" />
            <span>{{ trans('home.need_help') }}</span>
          </div>
          <p class="mt-1 mb-0 text-[13px] text-muted">
            {{ trans('home.resources_subtitle') }}
          </p>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <GButton
            color="white"
            size="small"
            :link="pageLanguage() === 'ru' ? 'https://docs.gameap.com/ru/' : 'https://docs.gameap.com/en/'"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GIcon name="book" class="text-[12px] text-muted" />
            <span>{{ trans('home.documentation') }}</span>
          </GButton>

          <GButton
            color="white"
            size="small"
            link="https://openapi.gameap.io/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GIcon name="admin-panel" class="text-[12px] text-muted" />
            <span>{{ trans('home.api_documentation') }}</span>
          </GButton>
        </div>
      </div>

      <!-- Community Channels -->
      <div class="rounded-card border border-border bg-surface p-5 flex flex-col justify-between">
        <div class="flex items-center gap-2 text-[14.5px] font-semibold text-body">
          <GIcon name="comments" class="text-[14px] text-muted" />
          <span>{{ trans('home.channels') }}</span>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <GButton
            color="white"
            size="small"
            link="https://discord.gg/SqtHpZc"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GIcon name="discord" class="text-[13px] text-muted" />
            <span>Discord</span>
          </GButton>

          <GButton
            color="white"
            size="small"
            link="https://t.me/gameap"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GIcon name="telegram" class="text-[13px] text-muted" />
            <span>Telegram</span>
          </GButton>

          <GButton
            v-if="pageLanguage() === 'ru'"
            color="white"
            size="small"
            link="https://vk.com/gameap"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GIcon name="vk" class="text-[13px] text-muted" />
            <span>VKontakte</span>
          </GButton>

          <GButton
            color="white"
            size="small"
            link="https://www.reddit.com/r/gameap/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GIcon name="reddit" class="text-[13px] text-muted" />
            <span>Reddit</span>
          </GButton>
        </div>
      </div>

      <!-- Support GameAP -->
      <div class="rounded-card border border-border bg-surface p-5 flex flex-col justify-between">
        <div class="flex items-center gap-2 text-[14.5px] font-semibold text-body">
          <GIcon name="heart" class="text-[14px] text-muted" />
          <span>{{ trans('home.support_gameap') }}</span>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <GButton
            color="white"
            size="small"
            link="https://www.patreon.com/gameap"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GIcon name="patreon" class="text-[12px] text-muted" />
            <span>Patreon</span>
          </GButton>

          <GButton
            color="white"
            size="small"
            link="https://boosty.to/gameap"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Boosty</span>
            <GIcon name="external-link" class="text-[11px] text-muted" />
          </GButton>
        </div>
      </div>
    </div>

    <PluginSlot v-if="pluginsStore.isInitialized" name="dashboard-widgets" :context="{ isAdmin }" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { GBreadcrumbs, GPageHeader, GIcon, hasIcon } from '@gameap/ui'
import GButton from '../components/GButton.vue'
import PluginSlot from '../plugins/components/PluginSlot.vue'
import VersionsBlock from '../components/blocks/VersionsBlock.vue'
import { useAuthStore } from '@/store/auth'
import { usePluginsStore } from '@/store/plugins'
import { useNodeListStore } from '@/store/nodeList'
import { useServerListStore } from '@/store/serverList'
import { trans, pageLanguage } from '@/i18n/i18n'
import { errorNotification } from '@/parts/dialogs'

const authStore = useAuthStore()
const nodeListStore = useNodeListStore()
const serverListStore = useServerListStore()
const pluginsStore = usePluginsStore()

const breadcrumbs = computed(() => [
  { route: '/', text: 'GameAP', icon: 'gameap' },
  { text: trans('home.main') },
])

const isAdmin = computed(() => authStore.isAdmin)

const loading = computed(() => serverListStore.loading || nodeListStore.loading)

const serverTotal = computed(() => {
  const s = serverListStore.summary
  if (typeof s?.total === 'number') return s.total
  return (s?.online || 0) + (s?.offline || 0)
})

const nodeTotal = computed(() => {
  const n = nodeListStore.summary
  if (typeof n?.total === 'number') return n.total
  return (n?.online || 0) + (n?.offline || 0)
})

const homeButtons = computed(() => pluginsStore.getSlotComponents('home-buttons'))

onMounted(() => {
  if (authStore.mfaNudge?.hard_fail) {
    return
  }

  fetchServersSummary()

  if (isAdmin.value) {
    fetchNodesSummary()
  }
})

const fetchServersSummary = () => {
  serverListStore.fetchServersSummary().catch((error) => {
    errorNotification(error)
  })
}

const fetchNodesSummary = () => {
  nodeListStore.fetchNodesSummary().catch((error) => {
    errorNotification(error)
  })
}
</script>

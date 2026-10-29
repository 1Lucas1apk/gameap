<template>
  <div class="w-full rounded-card border border-border bg-surface p-5">
    <div class="grid grid-cols-1 gap-y-5 sm:grid-cols-2 sm:gap-y-0 sm:divide-x divide-border">
      <section class="sm:pr-6 flex flex-col">
        <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[15px] font-semibold text-body">
          <span>GameAP</span>
          <GStatusBadge v-if="!versionLoading" :color="panelBadgeColor" :text="panelCurrent" class="gi-mono" />
        </div>

        <GIcon v-if="versionLoading" name="loading" class="mt-3 self-start text-muted" />
        <div v-else class="mt-2 space-y-1 text-[13px] text-secondary">
          <div v-if="panelLatestStable">
            {{ trans('home.latest_stable') }}:
            <a class="gi-mono text-accent hover:underline" :href="panel.latest_stable_url" target="_blank" rel="noopener noreferrer">{{ panelLatestStable }}</a>
          </div>
          <div v-if="panelLatestBeta">
            {{ trans('home.latest_beta') }}:
            <a class="gi-mono text-accent hover:underline" :href="panel.latest_beta_url" target="_blank" rel="noopener noreferrer">{{ panelLatestBeta }}</a>
          </div>
        </div>
      </section>

      <section class="sm:pl-6 flex flex-col">
        <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[15px] font-semibold text-body">
          <span>GameAP Daemon</span>
          <template v-if="!daemonLoading && daemonStatus">
            <button
              v-if="daemonStatusClickable"
              type="button"
              class="gi-focus-ring cursor-pointer rounded-full hover:opacity-85"
              @click="nodesModalShown = true"
            >
              <GStatusBadge :color="daemonStatusColor" :text="daemonStatusText" />
            </button>
            <GStatusBadge v-else :color="daemonStatusColor" :text="daemonStatusText" />
          </template>
        </div>

        <GIcon v-if="daemonLoading" name="loading" class="mt-3 self-start text-muted" />
        <div v-else class="mt-2 space-y-1 text-[13px] text-secondary">
          <div v-if="daemonLatestStable">
            {{ trans('home.latest_stable') }}:
            <a class="gi-mono text-accent hover:underline" :href="daemon.latest_stable_url" target="_blank" rel="noopener noreferrer">{{ daemonLatestStable }}</a>
          </div>
          <div v-if="daemonLatestBeta">
            {{ trans('home.latest_beta') }}:
            <a class="gi-mono text-accent hover:underline" :href="daemon.latest_beta_url" target="_blank" rel="noopener noreferrer">{{ daemonLatestBeta }}</a>
          </div>
        </div>
      </section>
    </div>

    <div v-if="fetched && !updateCheckEnabled" class="mt-3 border-t border-border/60 pt-3 text-[13px] text-muted">
      {{ trans('home.update_check_disabled') }}
    </div>

    <DaemonVersionsModal v-model:show="nodesModalShown" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { GIcon, GStatusBadge } from '@gameap/ui'
import DaemonVersionsModal from '@/components/blocks/DaemonVersionsModal.vue'
import { useNodeListStore } from '@/store/nodeList'
import { useVersionStore } from '@/store/version'
import { displayVersion } from '@/utils/version'
import { trans } from '@/i18n/i18n'
import { errorNotification } from '@/parts/dialogs'

const versionStore = useVersionStore()
const nodeListStore = useNodeListStore()

const nodesModalShown = ref(false)

const versionLoading = computed(() => versionStore.loading)
const summaryLoading = computed(() => nodeListStore.loading)
const daemonLoading = computed(() => versionLoading.value || summaryLoading.value)
const fetched = computed(() => versionStore.fetched)
const panel = computed(() => versionStore.panel)
const daemon = computed(() => versionStore.daemon)
const updateCheckEnabled = computed(() => versionStore.updateCheckEnabled)

const panelCurrent = computed(() => displayVersion(panel.value.current) || '—')
const panelLatestStable = computed(() => displayVersion(panel.value.latest_stable))
const panelLatestBeta = computed(() => displayVersion(panel.value.latest_beta))
const daemonLatestStable = computed(() => displayVersion(daemon.value.latest_stable))
const daemonLatestBeta = computed(() => displayVersion(daemon.value.latest_beta))

const panelBadgeColor = computed(() => {
  if (panel.value.update_available) {
    return 'orange'
  }
  if (panel.value.is_release === true && panel.value.latest_stable) {
    return 'green'
  }
  return 'stone'
})

const summary = computed(() => nodeListStore.summary || {})
const summaryLoaded = computed(() => typeof summary.value.total === 'number')
const allNodes = computed(() => [
  ...(summary.value.onlineNodes || []),
  ...(summary.value.offlineNodes || []),
])
const nodesTotal = computed(() => summary.value.total || 0)
const outdatedCount = computed(() => allNodes.value.filter((node) => node.outdated).length)
const knownVersionCount = computed(() => allNodes.value.filter((node) => node.version).length)

const daemonStatus = computed(() => {
  if (!updateCheckEnabled.value) {
    return ''
  }
  if (!summaryLoaded.value) {
    return 'unavailable'
  }
  if (nodesTotal.value === 0) {
    return ''
  }
  if (outdatedCount.value > 0) {
    return 'outdated'
  }
  if (daemon.value.latest_stable && knownVersionCount.value === nodesTotal.value) {
    return 'actual'
  }
  return 'unavailable'
})

const daemonStatusClickable = computed(() => ['outdated', 'actual'].includes(daemonStatus.value))

const daemonStatusColor = computed(() => {
  return { outdated: 'orange', actual: 'green', unavailable: 'red' }[daemonStatus.value]
})

const daemonStatusText = computed(() => {
  switch (daemonStatus.value) {
    case 'outdated':
      return trans('home.daemons_outdated', { count: outdatedCount.value, total: nodesTotal.value })
    case 'actual':
      return trans('home.daemons_actual')
    default:
      return trans('home.version_info_unavailable')
  }
})

onMounted(() => {
  versionStore.ensureFetched().catch((error) => {
    errorNotification(error)
  })
})
</script>

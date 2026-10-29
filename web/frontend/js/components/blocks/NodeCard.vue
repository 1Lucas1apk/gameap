<template>
  <div
    class="node-card gi-focus-ring group cursor-pointer rounded-card border border-border bg-surface p-4 transition-colors duration-150 hover:border-border-strong hover:bg-surface-raised"
    role="button"
    tabindex="0"
    @click="$emit('open-details', node.id)"
    @keydown.enter="$emit('open-details', node.id)"
    @keydown.space.prevent="$emit('open-details', node.id)"
  >
    <!-- Header -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-2.5 min-w-0">
        <span
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-border bg-surface-raised text-secondary"
        >
          <GIcon :name="osIconName" class="text-[16px]" />
        </span>
        <div class="min-w-0">
          <div class="truncate text-[15px] font-semibold leading-5 text-body group-hover:text-accent transition-colors">
            {{ node.name }}
          </div>
          <div class="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] leading-4 text-muted">
            <span v-if="primaryIp" class="gi-mono text-secondary">{{ primaryIp }}</span>
            <span v-if="node.location">· {{ node.location }}</span>
            <span v-if="node.provider">· {{ node.provider }}</span>
          </div>
        </div>
      </div>

      <GStatusBadge
        :status="online ? 'online' : 'offline'"
        :text="online ? trans('dedicated_servers.online') : trans('dedicated_servers.offline')"
      />
    </div>

    <!-- Daemon Version Strip -->
    <div
      v-if="daemonVersion"
      class="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-[12px] text-muted"
    >
      <span>Daemon</span>
      <span class="gi-mono text-secondary">
        {{ displayVersion(daemonVersion) }}
        <template v-if="outdated && latestVersion">
          <span class="mx-1 text-muted" aria-hidden="true">&rarr;</span>
          <a
            class="gi-mono font-medium text-warning hover:underline"
            :href="latestUrl"
            target="_blank"
            rel="noopener noreferrer"
            @click.stop
          >{{ displayVersion(latestVersion) }}</a>
        </template>
      </span>
    </div>

    <!-- Metrics Area -->
    <div class="mt-3.5 border-t border-border/60 pt-3">
      <template v-if="online && hasMetrics">
        <div class="flex items-center gap-2.5 mb-2">
          <span class="w-10 text-[11px] font-semibold uppercase tracking-wider text-muted">CPU</span>
          <n-progress
            type="line"
            :percentage="cpuWidth"
            :color="cpuColor"
            :height="8"
            :border-radius="4"
            :show-indicator="false"
            class="flex-1"
          />
          <span class="gi-mono w-14 text-right text-[12px] text-secondary">{{ formatPercent(cpuPercent) }}</span>
        </div>

        <div class="flex items-center gap-2.5">
          <span class="w-10 text-[11px] font-semibold uppercase tracking-wider text-muted">RAM</span>
          <n-progress
            type="line"
            :percentage="memWidth"
            :color="memColor"
            :height="8"
            :border-radius="4"
            :show-indicator="false"
            class="flex-1"
          />
          <span class="gi-mono w-14 text-right text-[12px] text-secondary">{{ formatPercent(memPercent) }}</span>
        </div>

        <div
          v-if="hasNet"
          class="mt-2.5 flex justify-between text-[12px] gi-mono text-muted"
        >
          <span>
            <span class="text-success">↑</span>
            <span class="ml-1 text-secondary">{{ formatBitrate(snapshot?.netInBps) }}</span>
          </span>
          <span>
            <span class="text-accent">↓</span>
            <span class="ml-1 text-secondary">{{ formatBitrate(snapshot?.netOutBps) }}</span>
          </span>
        </div>
      </template>

      <div
        v-else
        class="flex items-center justify-center rounded-[6px] bg-topbar py-2.5 text-[12px] text-muted"
      >
        {{ online ? trans('dedicated_servers.no_metrics_data') : trans('dedicated_servers.metrics_unavailable') }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { NProgress } from 'naive-ui'
import { GIcon, GStatusBadge } from '@gameap/ui'
import { useThemeVars } from '@/utils/theme'
import { displayVersion } from '@/utils/version'
import { trans } from '@/i18n/i18n'

const props = defineProps({
  node: { type: Object, required: true },
  online: { type: Boolean, default: false },
  snapshot: { type: Object, default: null },
  daemonVersion: { type: String, default: '' },
  outdated: { type: Boolean, default: false },
  latestVersion: { type: String, default: '' },
  latestUrl: { type: String, default: '' },
})

defineEmits(['open-details'])

const osIconName = computed(() => {
  const os = String(props.node?.os || '').toLowerCase()
  if (os.startsWith('w')) return 'windows'
  if (os.startsWith('m')) return 'apple'
  return 'linux'
})

const primaryIp = computed(() => {
  const ip = props.node?.ip
  if (!Array.isArray(ip) || ip.length === 0) return ''
  return ip[0]
})

const cpuPercent = computed(() => props.snapshot?.cpuPercent ?? null)
const memPercent = computed(() => props.snapshot?.memPercent ?? null)

const cpuWidth = computed(() => clamp(cpuPercent.value, 0, 100))
const memWidth = computed(() => clamp(memPercent.value, 0, 100))

const { chartPalette, statusColors } = useThemeVars()

const cpuColor = computed(() => paletteFor(cpuPercent.value, chartPalette.value[0]))
const memColor = computed(() => paletteFor(memPercent.value, chartPalette.value[1]))

const hasMetrics = computed(
  () =>
    cpuPercent.value !== null ||
    memPercent.value !== null ||
    props.snapshot?.netInBps != null ||
    props.snapshot?.netOutBps != null,
)

const hasNet = computed(
  () => props.snapshot?.netInBps != null || props.snapshot?.netOutBps != null,
)

function clamp(v, min, max) {
  if (v === null || v === undefined || Number.isNaN(v)) return 0
  return Math.max(min, Math.min(max, Number(v)))
}

function paletteFor(v, base) {
  if (v === null || v === undefined) return base
  if (v > 90) return statusColors.value.danger
  if (v > 75) return statusColors.value.warning
  return base
}

function formatPercent(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  return `${Number(v).toFixed(1)}%`
}

function formatBitrate(bps) {
  if (bps === null || bps === undefined || Number.isNaN(bps)) return '—'
  const u = ['B/s', 'KiB/s', 'MiB/s', 'GiB/s']
  let i = 0
  let n = Number(bps)
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(1)} ${u[i]}`
}
</script>

<template>
  <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2.5">
    <!-- 40px Search Input -->
    <div class="relative w-full sm:w-[300px] lg:w-[340px]">
      <GIcon
        name="search"
        class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-muted"
      />
      <input
        v-model="searchInput"
        type="text"
        class="gi-toolbar-search w-full pl-9 pr-8"
        :placeholder="trans('dedicated_servers.filter_search_placeholder')"
        :aria-label="trans('dedicated_servers.filter_search_placeholder')"
      />
      <button
        v-if="searchInput"
        type="button"
        class="gi-focus-ring absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded text-muted hover:text-body"
        :aria-label="trans('main.clear')"
        @click="searchInput = ''"
      >
        <GIcon name="close" class="text-[12px]" />
      </button>
    </div>

    <!-- 40px Status Segmented Control -->
    <div
      class="inline-flex h-10 items-center rounded-[8px] border border-border bg-sidebar p-1"
      role="group"
      :aria-label="trans('servers.status')"
    >
      <button
        v-for="opt in statusOptions"
        :key="opt.value"
        type="button"
        :class="[
          'gi-focus-ring inline-flex h-full items-center gap-1.5 rounded-[6px] px-3 text-[13px] font-medium transition-colors duration-150',
          statusFilter === opt.value
            ? 'bg-surface-raised text-body shadow-sm'
            : 'text-muted hover:text-body',
        ]"
        @click="setStatus(opt.value)"
      >
        <span
          v-if="opt.dotClass"
          :class="['h-1.5 w-1.5 rounded-full', opt.dotClass]"
          aria-hidden="true"
        />
        <span>{{ opt.label }}</span>
      </button>
    </div>

    <!-- 40px OS Segmented Control -->
    <div
      class="inline-flex h-10 items-center rounded-[8px] border border-border bg-sidebar p-1"
      role="group"
      aria-label="OS"
    >
      <button
        v-for="opt in osOptions"
        :key="opt.value"
        type="button"
        :class="[
          'gi-focus-ring inline-flex h-full items-center gap-1.5 rounded-[6px] px-2.5 text-[13px] font-medium transition-colors duration-150',
          osFilter === opt.value
            ? 'bg-surface-raised text-body shadow-sm'
            : 'text-muted hover:text-body',
        ]"
        @click="setOs(opt.value)"
      >
        <GIcon v-if="opt.icon" :name="opt.icon" class="text-[12px]" />
        <span>{{ opt.label }}</span>
      </button>
    </div>

    <button
      v-if="hasAnyFilter"
      type="button"
      class="gi-focus-ring inline-flex h-10 items-center gap-1.5 rounded-[8px] px-3 text-[13px] font-medium text-muted transition-colors hover:bg-surface-hover hover:text-body"
      @click="$emit('clear')"
    >
      <GIcon name="close" class="text-[12px]" />
      <span>{{ trans('main.clear_filters') }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { GIcon } from '@gameap/ui'
import { trans } from '@/i18n/i18n'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ search: '', status: 'all', os: 'all' }),
  },
})

const emit = defineEmits(['update:modelValue', 'clear'])

const searchInput = ref(props.modelValue.search || '')
const statusFilter = ref(props.modelValue.status || 'all')
const osFilter = ref(props.modelValue.os || 'all')

const hasAnyFilter = computed(
  () =>
    Boolean(searchInput.value && searchInput.value.trim()) ||
    statusFilter.value !== 'all' ||
    osFilter.value !== 'all',
)

const statusOptions = computed(() => [
  { value: 'all', label: trans('main.all'), dotClass: null },
  { value: 'online', label: trans('dedicated_servers.online'), dotClass: 'bg-success' },
  { value: 'offline', label: trans('dedicated_servers.offline'), dotClass: 'bg-danger' },
])

const osOptions = computed(() => [
  { value: 'all', label: trans('main.all'), icon: null },
  { value: 'linux', label: 'Linux', icon: 'linux' },
  { value: 'windows', label: 'Windows', icon: 'windows' },
  { value: 'macos', label: 'macOS', icon: 'apple' },
])

let searchTimer = null
watch(searchInput, (v) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => emitUpdate({ search: v }), 160)
})

function setStatus(v) {
  statusFilter.value = v
  emitUpdate({ status: v })
}

function setOs(v) {
  osFilter.value = v
  emitUpdate({ os: v })
}

function emitUpdate(patch) {
  emit('update:modelValue', {
    search: searchInput.value,
    status: statusFilter.value,
    os: osFilter.value,
    ...patch,
  })
}

watch(
  () => props.modelValue,
  (v) => {
    searchInput.value = v.search || ''
    statusFilter.value = v.status || 'all'
    osFilter.value = v.os || 'all'
  },
  { deep: true },
)
</script>

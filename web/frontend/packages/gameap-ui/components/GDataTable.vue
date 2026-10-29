<template>
  <div :class="['w-full', attrs.class]" :data-testid="attrs['data-testid']">
    <!-- State 1: Initial / Empty Loading Skeleton -->
    <div
      v-if="loading && isEmpty"
      class="gi-data-table-wrap"
      role="status"
      aria-busy="true"
    >
      <div
        class="grid h-[44px] items-center gap-4 border-b border-border bg-table-header px-4"
        :style="skeletonGridStyle"
      >
        <div
          v-for="idx in skeletonColCount"
          :key="'th-' + idx"
          class="h-3 w-20 animate-pulse rounded bg-surface-hover"
        />
      </div>
      <div
        v-for="rowIdx in 4"
        :key="'row-' + rowIdx"
        class="grid min-h-[62px] items-center gap-4 border-b border-border/60 bg-table px-4 py-3.5 last:border-b-0"
        :style="skeletonGridStyle"
      >
        <div
          v-for="colIdx in skeletonColCount"
          :key="'td-' + rowIdx + '-' + colIdx"
          class="flex flex-col gap-1.5"
        >
          <div
            class="h-3.5 animate-pulse rounded bg-surface-raised"
            :class="colIdx === 1 ? 'w-3/4' : colIdx === skeletonColCount ? 'w-24' : 'w-1/2'"
          />
          <div
            v-if="colIdx === 1"
            class="h-2.5 w-2/5 animate-pulse rounded bg-surface-raised/70"
          />
        </div>
      </div>
    </div>

    <!-- State 2: Empty State (no orphaned table header or pagination) -->
    <div
      v-else-if="isEmpty && !keepHeaderOnEmpty"
      class="rounded-card border border-border bg-topbar overflow-hidden"
    >
      <slot name="empty">
        <GEmpty :title="fallbackEmptyText" icon="inbox" />
      </slot>
    </div>

    <!-- State 3: Populated Table -->
    <div v-else class="gi-data-table-wrap">
      <n-data-table v-bind="mergedProps">
        <template v-for="(_, slotName) in forwardedSlots" :key="slotName" #[slotName]="slotProps">
          <slot :name="slotName" v-bind="slotProps || {}" />
        </template>
      </n-data-table>
    </div>
  </div>
</template>

<script setup>
import { computed, useAttrs, useSlots } from 'vue'
import { NDataTable } from 'naive-ui'
import GEmpty from './GEmpty.vue'

const props = defineProps({
  bordered: {
    type: Boolean,
    default: false,
  },
  singleLine: {
    type: Boolean,
    default: true,
  },
  columns: {
    type: Array,
    default: () => [],
  },
  data: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  pagination: {
    type: [Object, Boolean],
    default: false,
  },
  remote: {
    type: Boolean,
    default: false,
  },
  keepHeaderOnEmpty: {
    type: Boolean,
    default: false,
  },
})

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()
const slots = useSlots()

const isEmpty = computed(() => !Array.isArray(props.data) || props.data.length === 0)

const skeletonColCount = computed(() => {
  const count = Array.isArray(props.columns) ? props.columns.length : 0
  return Math.min(Math.max(count || 4, 2), 6)
})

const skeletonGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${skeletonColCount.value}, minmax(0, 1fr))`,
}))

const fallbackEmptyText = computed(() => {
  if (typeof window !== 'undefined' && window.i18n?.main?.empty_list) {
    return window.i18n.main.empty_list
  }
  return 'Nenhum registro encontrado'
})

const effectivePagination = computed(() => {
  if (!props.pagination || isEmpty.value) {
    return false
  }
  if (typeof props.pagination === 'object') {
    const minPageSize = Array.isArray(props.pagination.pageSizes) && props.pagination.pageSizes.length > 0
      ? Math.min(...props.pagination.pageSizes)
      : (props.pagination.pageSize || 10)

    if (props.remote) {
      const pageCount = props.pagination.pageCount ?? 1
      const itemCount = props.pagination.itemCount ?? props.data.length
      if (pageCount <= 1 && itemCount <= minPageSize) {
        return false
      }
    } else if (props.data.length <= minPageSize) {
      return false
    }
  }
  return props.pagination
})

const forwardedSlots = computed(() => {
  const result = {}
  for (const key of Object.keys(slots)) {
    if (key !== 'empty') {
      result[key] = slots[key]
    }
  }
  return result
})

const tableAttrs = computed(() => {
  const rest = { ...attrs }
  delete rest.class
  delete rest['data-testid']
  return rest
})

const mergedProps = computed(() => ({
  bordered: false,
  singleLine: props.singleLine,
  columns: props.columns,
  data: props.data,
  loading: props.loading,
  pagination: effectivePagination.value,
  remote: props.remote,
  ...tableAttrs.value,
}))
</script>

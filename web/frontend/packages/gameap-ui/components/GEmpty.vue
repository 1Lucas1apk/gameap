<template>
  <div
    :class="[
      'flex flex-col items-center justify-center text-center px-6',
      size === 'compact' ? 'min-h-[180px] py-8' : 'min-h-[260px] py-10',
      bordered ? 'rounded-card border border-border bg-topbar' : '',
    ]"
    v-bind="attrs"
  >
    <div
      class="mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-[12px] border border-border bg-surface-raised text-muted"
      aria-hidden="true"
    >
      <slot name="icon">
        <GIcon :name="icon" class="text-[20px]" />
      </slot>
    </div>

    <h3
      v-if="effectiveTitle"
      class="m-0 text-[17.5px] font-semibold leading-6 text-body"
    >
      {{ effectiveTitle }}
    </h3>

    <p
      v-if="effectiveDescription"
      class="mt-1.5 mb-0 max-w-[420px] text-[14px] leading-[21px] text-secondary"
    >
      {{ effectiveDescription }}
    </p>

    <div
      v-if="$slots.extra || $slots.default"
      class="mt-5 flex flex-wrap items-center justify-center gap-2.5"
    >
      <slot name="extra" />
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed, useAttrs } from 'vue'
import GIcon from './GIcon.vue'

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: 'inbox',
  },
  bordered: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: 'default',
  },
})

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()

// When only `description` is provided (legacy callers), promote it cleanly to the title slot.
const effectiveTitle = computed(() => {
  if (props.title) {
    return props.title
  }
  return props.description || ''
})

const effectiveDescription = computed(() => {
  if (props.title && props.description) {
    return props.description
  }
  return ''
})
</script>

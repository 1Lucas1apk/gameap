<template>
  <span :class="spanClass">
    <span v-if="dot" class="gi-badge-dot" aria-hidden="true"></span>
    <slot>{{ statusText }}</slot>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    default: '',
  },
  text: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '',
  },
  dot: {
    type: Boolean,
    default: true,
  },
})

const badgeClasses = {
  waiting: 'badge-stone',
  working: 'badge-blue',
  installing: 'badge-blue',
  online: 'badge-green',
  success: 'badge-green',
  offline: 'badge-red',
  error: 'badge-red',
  warning: 'badge-orange',
  blocked: 'badge-orange',
  disabled: 'badge-stone',
  canceled: 'badge-stone',
}

const colorClasses = {
  light: 'badge-light',
  blue: 'badge-blue',
  red: 'badge-red',
  green: 'badge-green',
  orange: 'badge-orange',
  stone: 'badge-stone',
}

const spanClass = computed(() => {
  if (props.color) {
    const base = colorClasses[props.color] ?? 'badge-light'
    return `gi-badge ${base}`
  }

  const base = badgeClasses[props.status] ?? 'badge-light'
  return `gi-badge ${base}`
})

const statusText = computed(() => {
  return props.text ? props.text : props.status
})
</script>

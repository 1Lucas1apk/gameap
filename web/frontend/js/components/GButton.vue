<template>
  <a
    v-if="link"
    :class="classes"
    :href="isDisabled ? undefined : link"
    :aria-disabled="isDisabled ? 'true' : undefined"
    v-bind="forwardedAttrs"
  >
    <GIcon v-if="loading" name="loading" class="shrink-0" />
    <slot />
  </a>

  <router-link
    v-else-if="route"
    :to="route"
    :class="classes"
    :aria-disabled="isDisabled ? 'true' : undefined"
    v-bind="forwardedAttrs"
  >
    <GIcon v-if="loading" name="loading" class="shrink-0" />
    <slot />
  </router-link>

  <button
    v-else
    :type="type"
    :class="classes"
    :disabled="isDisabled"
    v-bind="forwardedAttrs"
    @click="buttonClick"
  >
    <GIcon v-if="loading" name="loading" class="shrink-0" />
    <slot />
  </button>
</template>

<script setup>
import { computed, useAttrs } from 'vue'
import { GIcon } from '@gameap/ui'

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()

const defaultClass =
  'gi-focus-ring inline-flex items-center justify-center gap-2 select-none border ' +
  'font-medium whitespace-nowrap rounded-btn no-underline transition-colors duration-150'

const defaultDisabledClass = 'opacity-50 cursor-not-allowed pointer-events-none'

const colors = {
  primary: 'gi-btn-primary',
  white: 'gi-btn-secondary',
  neutral: 'gi-btn-secondary',
  black: 'gi-btn-elevated',
  green: 'gi-btn-success',
  red: 'gi-btn-danger',
  orange: 'gi-btn-warning',
  blue: 'gi-btn-info',
  ghost: 'gi-btn-ghost',
}

const sizes = {
  small: 'h-8 px-2.5 text-[13px] leading-4',
  middle: 'h-10 px-4 text-[14px] leading-5',
  large: 'h-11 px-5 text-[15px] leading-5',
}

const props = defineProps({
  color: { type: String, default: 'white' },
  size: { type: String, default: 'middle' },
  link: { type: String, default: null },
  route: { type: [String, Object], default: null },
  class: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  type: { type: String, default: undefined },
})

const isDisabled = computed(() => props.disabled || props.loading)

const forwardedAttrs = computed(() => {
  const rest = { ...attrs }
  delete rest.class
  return rest
})

const classes = computed(() => {
  const color = colors[props.color] || colors.white
  const size = sizes[props.size] || sizes.middle

  const c = [defaultClass, color, size]

  if (isDisabled.value) {
    c.push(defaultDisabledClass)
  }

  if (props.class) {
    c.push(props.class)
  }

  if (attrs.class) {
    c.push(attrs.class)
  }

  return c.join(' ')
})

const emits = defineEmits(['click'])

const buttonClick = (event) => {
  if (!isDisabled.value) {
    emits('click', event)
  }
}
</script>

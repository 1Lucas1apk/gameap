<template>
  <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="gi-page-title m-0">
          <slot name="title">{{ title }}</slot>
        </h1>
        <slot name="badge" />
      </div>
      <p
        v-if="description || $slots.description"
        class="mt-1.5 mb-0 max-w-3xl text-[14px] leading-[21px] text-secondary"
      >
        <slot name="description">{{ description }}</slot>
      </p>
    </div>

    <div
      v-if="$slots.actions || $slots.default"
      class="flex flex-wrap items-center gap-2.5 shrink-0 sm:pt-0.5"
    >
      <slot name="actions" />
      <slot />
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
})
</script>

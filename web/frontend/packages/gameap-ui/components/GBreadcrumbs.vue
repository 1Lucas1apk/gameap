<template>
  <nav
    v-if="items && items.length > 0"
    class="mb-2 flex items-center text-[13px] leading-5 text-muted"
    aria-label="Breadcrumb"
  >
    <ol class="inline-flex flex-wrap items-center gap-y-1">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="inline-flex items-center"
      >
        <span
          v-if="index > 0"
          class="mx-2 select-none text-[12px] text-muted/60"
          aria-hidden="true"
        >/</span>

        <a
          v-if="item.link"
          :href="item.link"
          class="gi-focus-ring inline-flex items-center gap-1 rounded px-0.5 text-muted transition-colors duration-150 hover:text-body no-underline"
        >
          <BreadcrumbIcon v-if="item.icon" :icon="item.icon" />
          <span>{{ item.text }}</span>
        </a>

        <router-link
          v-else-if="item.route"
          :to="item.route"
          class="gi-focus-ring inline-flex items-center gap-1 rounded px-0.5 text-muted transition-colors duration-150 hover:text-body no-underline"
        >
          <BreadcrumbIcon v-if="item.icon" :icon="item.icon" />
          <span>{{ item.text }}</span>
        </router-link>

        <span
          v-else-if="item.render"
          class="inline-flex items-center gap-1 font-medium text-secondary"
        >
          <RenderNode :render="item.render" />
        </span>

        <span
          v-else
          class="inline-flex items-center gap-1 font-medium"
          :class="index === items.length - 1 ? 'text-secondary' : 'text-muted'"
        >
          <BreadcrumbIcon v-if="item.icon" :icon="item.icon" />
          <span>{{ item.text }}</span>
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import BreadcrumbIcon from './BreadcrumbIcon.vue'

defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

const RenderNode = (attr) => {
  return attr.render()
}
</script>

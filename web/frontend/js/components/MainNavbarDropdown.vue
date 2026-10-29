<template>
  <GMenu as="div" :class="$attrs.class" class="relative inline-flex items-center text-left">
    <GMenuButton
      @click="onMenuButtonClick"
      class="gi-focus-ring inline-flex h-9 items-center gap-2 rounded-btn px-3 text-[13.5px] font-medium text-secondary transition-colors duration-150 hover:bg-surface-hover hover:text-body"
    >
      <GIcon v-if="buttonIcon" :name="buttonIcon" class="text-[15px] text-muted" />
      <span v-if="props.buttonText" class="hidden sm:inline">{{ props.buttonText }}</span>
      <GIcon
        :name="menuOpened ? 'chevron-up' : 'chevron-down'"
        class="hidden sm:inline text-[11px] text-muted"
      />
    </GMenuButton>

    <transition
      @after-leave="transitionAfterLeave"
      enter-active-class="transition ease-out duration-120"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <GMenuItems
        :unmount="menuItemsUnmount"
        class="absolute right-0 top-full z-50 mt-1.5 w-56 origin-top-right divide-y divide-border rounded-[8px] border border-border bg-surface-raised py-1 shadow-xl focus:outline-none"
      >
        <div
          v-for="(itemGroup, groupIdx) in items"
          :key="groupIdx"
          class="py-1 px-1"
        >
          <GMenuItem
            v-for="(item, itemIdx) in itemGroup"
            :key="itemIdx"
            v-slot="{ active, close }"
          >
            <a
              v-if="item.route"
              @click="onLinkClick(item, close)"
              :class="[
                active ? 'bg-surface-hover text-body' : 'text-secondary',
                'flex items-center gap-2.5 rounded-[6px] px-3 py-2 text-[13.5px] leading-5 cursor-pointer no-underline transition-colors duration-100',
              ]"
            >
              <GIcon v-if="item.icon" :name="item.icon" class="w-4 text-center text-[14px] text-muted shrink-0" />
              <span class="truncate">{{ item.label }}</span>
            </a>

            <a
              v-else-if="item.link"
              :href="item.link"
              target="_blank"
              rel="noopener noreferrer"
              @click="onLinkClick(item, close)"
              :class="[
                active ? 'bg-surface-hover text-body' : 'text-secondary',
                'flex items-center justify-between gap-2.5 rounded-[6px] px-3 py-2 text-[13.5px] leading-5 no-underline transition-colors duration-100',
              ]"
            >
              <span class="flex items-center gap-2.5 min-w-0">
                <GIcon v-if="item.icon" :name="item.icon" class="w-4 text-center text-[14px] text-muted shrink-0" />
                <span class="truncate">{{ item.label }}</span>
              </span>
              <GIcon name="external-link" class="text-[11px] text-muted/70 shrink-0" />
            </a>

            <a
              v-else-if="item.onClick"
              href="#"
              @click.prevent="onActionClick(item, close)"
              :class="[
                active ? 'bg-surface-hover text-body' : 'text-secondary',
                item.active ? 'font-semibold text-accent' : '',
                'flex items-center justify-between gap-2.5 rounded-[6px] px-3 py-2 text-[13.5px] leading-5 cursor-pointer no-underline transition-colors duration-100',
              ]"
            >
              <span class="flex items-center gap-2.5 min-w-0">
                <GIcon v-if="item.icon" :name="item.icon" class="w-4 text-center text-[14px] text-muted shrink-0" />
                <span class="truncate">{{ item.label }}</span>
              </span>
              <GIcon v-if="item.active" name="check" class="text-[12px] text-accent shrink-0" />
            </a>
          </GMenuItem>
        </div>
      </GMenuItems>
    </transition>
  </GMenu>
</template>

<script setup>
import { GMenu, GMenuButton, GMenuItem, GMenuItems, GIcon } from '@gameap/ui'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  buttonText: {
    type: String,
    default: '',
  },
  buttonIcon: {
    type: String,
    default: '',
  },
  items: {
    type: Array,
    default: () => [],
  },
})

const menuItemsUnmount = ref(true)
const menuOpened = ref(false)

const onMenuButtonClick = () => {
  menuOpened.value = !menuOpened.value
}

const onLinkClick = (item, close) => {
  menuOpened.value = false
  close()

  if (item.route) {
    router.push(item.route)
  }
}

const onActionClick = (item, close) => {
  menuOpened.value = false
  close()

  if (item.onClick) {
    item.onClick()
  }
}

const transitionAfterLeave = () => {
  menuOpened.value = false
}
</script>

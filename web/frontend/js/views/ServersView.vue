<template>
  <div>
    <GBreadcrumbs :items="breadcrumbs" />

    <GPageHeader
      :title="trans('servers.game_servers')"
      :description="trans('servers.page_description')"
    >
      <template #actions>
        <GButton
          v-if="authStore.isAdmin"
          color="primary"
          size="middle"
          :route="{ name: 'admin.servers.create' }"
        >
          <GIcon name="plus" class="text-[13px]" />
          <span>{{ trans('servers.create') }}</span>
        </GButton>
      </template>
    </GPageHeader>

    <ServerMainList />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { GBreadcrumbs, GPageHeader, GIcon } from '@gameap/ui'
import GButton from '@/components/GButton.vue'
import ServerMainList from '@/views/servertabs/ServerMainList.vue'
import { trans } from '@/i18n/i18n'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()

const breadcrumbs = computed(() => [
  { route: '/', text: 'GameAP', icon: 'gameap' },
  { text: trans('servers.game_servers') },
])
</script>

<template>
  <div>
    <GBreadcrumbs :items="breadcrumbs" />

    <GPageHeader
      :title="trans('games.games')"
      :description="trans('games.page_description')"
    >
      <template #actions>
        <GButton color="white" size="middle" :route="{ name: 'admin.games.import' }">
          <GIcon name="download" class="text-[13px] text-muted" />
          <span>{{ trans('games.import') }}</span>
        </GButton>

        <GButton color="white" size="middle" @click="onClickGamesUpgrade">
          <GIcon name="sync" class="text-[13px] text-muted" />
          <span>{{ trans('games.upgrade') }}</span>
        </GButton>

        <GButton color="white" size="middle" @click="onClickModCreate()">
          <GIcon name="mods" class="text-[13px] text-muted" />
          <span>{{ trans('games.add_mod') }}</span>
        </GButton>

        <GButton
          color="primary"
          size="middle"
          data-testid="games-add-button"
          @click="onClickGameCreate"
        >
          <GIcon name="plus" class="text-[13px]" />
          <span>{{ trans('games.add') }}</span>
        </GButton>
      </template>
    </GPageHeader>

    <!-- 40px Search Toolbar -->
    <div class="mb-4 flex items-center gap-2.5">
      <div class="relative w-full sm:w-[320px] lg:w-[350px]">
        <GIcon
          name="search"
          class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-muted"
        />
        <input
          v-model="searchGames"
          type="text"
          class="gi-toolbar-search w-full pl-9 pr-8"
          :placeholder="trans('games.search_placeholder')"
          :aria-label="trans('games.search_placeholder')"
        />
        <button
          v-if="searchGames"
          type="button"
          class="gi-focus-ring absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded text-muted hover:text-body"
          :aria-label="trans('main.clear')"
          @click="clearSearch"
        >
          <GIcon name="close" class="text-[12px]" />
        </button>
      </div>
    </div>

    <GDataTable
      ref="tableRef"
      :columns="columns"
      :data="gamesData"
      :loading="loading"
      :pagination="pagination"
      :scroll-x="640"
    >
      <template #empty>
        <GEmpty
          icon="gamepad"
          :title="searchGames ? trans('servers.no_results_title') : trans('servers.empty_list')"
        >
          <GButton v-if="searchGames" color="white" size="middle" @click="clearSearch">
            <GIcon name="eraser" class="text-[13px]" />
            <span>{{ trans('main.clear') }}</span>
          </GButton>
        </GEmpty>
      </template>
    </GDataTable>

    <GModal
      v-model:show="gameCreateModalEnabled"
      :title="trans('games.title_add')"
      style="width: 600px"
    >
      <CreateGameForm v-model="gameCreateModel" @create="onCreateGame" />
    </GModal>

    <GModal
      v-model:show="modCreateModalEnabled"
      :title="trans('games.title_add_mod')"
      style="width: 600px"
    >
      <CreateModForm v-model="modCreateModel" @create="onCreateMod" />
    </GModal>
  </div>
</template>

<script setup>
import {
  GBreadcrumbs,
  GPageHeader,
  GDeletableList,
  GIcon,
  GDataTable,
  GModal,
  GEmpty,
  GGameIcon,
} from '@gameap/ui'
import { computed, ref, onMounted, h, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { trans } from '@/i18n/i18n'
import GButton from '@/components/GButton.vue'
import { useGameListStore } from '@/store/gameList'
import { errorNotification, notification } from '@/parts/dialogs'
import CreateModForm from './forms/CreateModForm.vue'
import CreateGameForm from './forms/CreateGameForm.vue'

const router = useRouter()
const gamesStore = useGameListStore()

const breadcrumbs = computed(() => [
  { route: '/', text: 'GameAP', icon: 'gameap' },
  { text: trans('sidebar.admin') },
  { text: trans('games.games') },
])

onMounted(() => {
  fetchGames()
  fetchAllGameMods()
})

const fetchGames = () => {
  gamesStore.fetchGames().catch((error) => {
    errorNotification(error)
  })
}

const fetchAllGameMods = () => {
  gamesStore.fetchAllGameMods().catch((error) => {
    errorNotification(error)
  })
}

const columns = computed(() => [
  {
    title: trans('games.name'),
    key: 'name',
    width: '38%',
    render(row) {
      return h('div', { class: 'flex items-center gap-3 min-w-0' }, [
        h(
          'div',
          {
            class:
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-border bg-surface-raised text-secondary',
          },
          [h(GGameIcon, { game: row.code })],
        ),
        h('div', { class: 'min-w-0 flex-1' }, [
          h(
            RouterLink,
            {
              to: { name: 'admin.games.edit', params: { code: row.code } },
              class:
                'gi-focus-ring font-semibold text-[14.5px] leading-5 text-body hover:text-accent transition-colors no-underline truncate block',
            },
            { default: () => row.name },
          ),
          h('div', { class: 'gi-mono mt-0.5 text-[12px] text-muted' }, row.code),
        ]),
      ])
    },
  },
  {
    title: trans('games.mods'),
    key: 'mods',
    width: '40%',
    render(row) {
      if (row.mods.length === 0) {
        return h(
          GButton,
          {
            color: 'white',
            size: 'small',
            onClick: () => onClickModCreate(row.code),
          },
          {
            default: () => [
              h(GIcon, { name: 'plus', class: 'text-[11px] text-muted' }),
              h('span', {}, trans('games.add_first_mod')),
            ],
          },
        )
      }

      return h(GDeletableList, {
        class: ['md:max-w-64'],
        items: row.mods,
        deleteCallback: onClickModDelete,
        clickCallback: onClickMod,
      })
    },
  },
  {
    title: trans('main.actions'),
    key: 'actions',
    width: '22%',
    render(row) {
      return h('div', { class: 'flex flex-wrap items-center gap-1.5' }, [
        h(
          GButton,
          {
            color: 'white',
            size: 'small',
            route: { name: 'admin.games.edit', params: { code: row.code } },
          },
          {
            default: () => [
              h(GIcon, { name: 'edit', class: 'text-[12px]' }),
              h('span', { class: 'hidden lg:inline' }, trans('main.edit')),
            ],
          },
        ),
        h(
          GButton,
          {
            color: 'red',
            size: 'small',
            title: trans('main.delete'),
            onClick: () => onClickGameDelete(row.code),
          },
          {
            default: () => [
              h(GIcon, { name: 'delete', class: 'text-[12px]' }),
              h('span', { class: 'hidden lg:inline' }, trans('main.delete')),
            ],
          },
        ),
      ])
    },
  },
])

const { loading, games, allGameMods } = storeToRefs(gamesStore)
const tableRef = ref(null)

const modCreateModalEnabled = ref(false)
const modCreateModel = ref({
  game: null,
  name: '',
  remoteRepositoryLinux: '',
  remoteRepositoryWindows: '',
})

const gameCreateModalEnabled = ref(false)
const gameCreateModel = ref({
  code: '',
  name: '',
  engine: '',
  engineVersion: '',
  remoteRepositoryLinux: '',
  remoteRepositoryWindows: '',
})

const pagination = {
  pageSize: 50,
}

const SEARCH_STORAGE_KEY = 'gameap_games_search'
const searchGames = ref(sessionStorage.getItem(SEARCH_STORAGE_KEY) || '')

watch(searchGames, (newValue) => {
  if (newValue) {
    sessionStorage.setItem(SEARCH_STORAGE_KEY, newValue)
  } else {
    sessionStorage.removeItem(SEARCH_STORAGE_KEY)
  }
})

const clearSearch = () => {
  searchGames.value = ''
}

const gamesData = computed(() => {
  const result = []
  const q = (searchGames.value || '').toLowerCase()

  games.value.forEach((game) => {
    if (q && !game.name.toLowerCase().includes(q) && !game.code.toLowerCase().includes(q)) {
      return
    }

    result.push({
      name: game.name,
      code: game.code,
      engine: game.engine,
      mods: getGameMods(game.code),
    })
  })

  return result.sort((a, b) => a.name.localeCompare(b.name))
})

const getGameMods = (gameCode) => {
  const mods = []
  allGameMods.value.forEach((gameMod) => {
    if (gameMod.game_code === gameCode) {
      mods.push({
        id: gameMod.id,
        name: gameMod.name,
        gameCode: gameMod.game_code,
      })
    }
  })

  return mods
}

const onClickGameDelete = (code) => {
  window.$dialog.warning({
    title: trans('games.delete_game_confirm_msg'),
    positiveText: trans('main.yes'),
    negativeText: trans('main.no'),
    closable: true,
    onPositiveClick: () => {
      deleteGameByCode(code)
    },
  })
}

const deleteGameByCode = (code) => {
  gamesStore
    .deleteGameByCode(code)
    .then(() => {
      fetchGames()
    })
    .catch((error) => {
      errorNotification(error)
    })
}

const onClickModCreate = (game) => {
  modCreateModel.value = {
    game: game || null,
    name: '',
    remoteRepositoryLinux: '',
    remoteRepositoryWindows: '',
  }
  modCreateModalEnabled.value = true
}

const onCreateMod = () => {
  const fields = {
    name: modCreateModel.value.name,
    game_code: modCreateModel.value.game,
    remote_repository_linux: modCreateModel.value.remoteRepositoryLinux,
    remote_repository_windows: modCreateModel.value.remoteRepositoryWindows,
  }

  gamesStore
    .createGameMod(fields)
    .then(() => {
      notification(
        {
          content: trans('games.mod_create_success_msg'),
          type: 'success',
        },
        () => {
          fetchAllGameMods()
        },
      )
    })
    .catch((error) => {
      errorNotification(error)
    })
    .finally(() => {
      modCreateModalEnabled.value = false
    })
}

const onClickGameCreate = () => {
  gameCreateModel.value = {
    code: '',
    name: '',
    remoteRepositoryLinux: '',
    remoteRepositoryWindows: '',
  }
  gameCreateModalEnabled.value = true
}

const onCreateGame = () => {
  const fields = {
    name: gameCreateModel.value.name,
    code: gameCreateModel.value.code,
    engine: gameCreateModel.value.engine || 'unknown',
    engine_version: gameCreateModel.value.engineVersion,
    remote_repository_linux: gameCreateModel.value.remoteRepositoryLinux,
    remote_repository_windows: gameCreateModel.value.remoteRepositoryWindows,
  }

  gamesStore
    .createGame(fields)
    .then(() => {
      notification({
        content: trans('games.create_success_msg'),
        type: 'success',
      })
      gameCreateModalEnabled.value = false
      router.push({ name: 'admin.games.edit', params: { code: fields.code } })
    })
    .catch((error) => {
      errorNotification(error)
    })
}

const onClickMod = (code, id) => {
  router.push({ name: 'admin.games.mods.edit', params: { code, id } })
}

const onClickModDelete = (id) => {
  window.$dialog.warning({
    title: trans('games.delete_mod_confirm_msg'),
    positiveText: trans('main.yes'),
    negativeText: trans('main.no'),
    closable: true,
    onPositiveClick: () => {
      deleteModById(id)
    },
  })
}

const deleteModById = (id) => {
  gamesStore
    .deleteModById(id)
    .then(() => {
      fetchAllGameMods()
    })
    .catch((error) => {
      errorNotification(error)
    })
}

const onClickGamesUpgrade = () => {
  window.$dialog.info({
    title: trans('games.d_upgrade_confirm'),
    positiveText: trans('main.yes'),
    negativeText: trans('main.no'),
    closable: true,
    onPositiveClick: () => {
      gamesStore
        .upgradeGames()
        .then(() => {
          notification({
            content: trans('games.upgrade_success_msg'),
            type: 'success',
          })
          fetchGames()
          fetchAllGameMods()
        })
        .catch((error) => {
          errorNotification(error)
        })
    },
  })
}
</script>

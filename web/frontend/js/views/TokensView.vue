<template>
  <div>
    <GBreadcrumbs :items="breadcrumbs" />

    <GPageHeader
      :title="trans('tokens.tokens')"
      :description="trans('tokens.page_description')"
    >
      <template #actions>
        <GButton
          color="primary"
          size="middle"
          data-testid="tokens-generate-button"
          @click="onClickGenerate"
        >
          <GIcon name="plus" class="text-[13px]" />
          <span>{{ trans('tokens.generate_token') }}</span>
        </GButton>
      </template>
    </GPageHeader>

    <GDataTable
      ref="tableRef"
      remote
      :columns="columns"
      :data="listData"
      :loading="loading"
      :pagination="pagination"
      :scroll-x="isSmallScreen ? 480 : 720"
    >
      <template #empty>
        <GEmpty icon="key" :title="trans('main.empty_list')">
          <GButton
            color="primary"
            size="middle"
            @click="onClickGenerate"
          >
            <GIcon name="plus" class="text-[13px]" />
            <span>{{ trans('tokens.generate_token') }}</span>
          </GButton>
        </GEmpty>
      </template>
    </GDataTable>

    <GModal
      v-model:show="generateTokenModalEnabled"
      :title="trans('tokens.generate_token')"
      style="width: 800px"
    >
      <GenerateTokenForm
        v-model="generateTokenModel"
        :abilities="abilities"
        @generate="onGenerateToken"
      />
    </GModal>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, h } from 'vue'
import { GBreadcrumbs, GPageHeader, GEmpty, GIcon, GDataTable, GModal } from '@gameap/ui'
import { trans } from '@/i18n/i18n'
import GButton from '@/components/GButton.vue'
import { useTokensStore } from '@/store/tokens'
import { storeToRefs } from 'pinia'
import { join } from 'lodash-es'
import { NButton, NInput, NInputGroup } from 'naive-ui'
import { errorNotification, notification } from '@/parts/dialogs'
import { copyToClipboard, isClipboardSupported } from '@/utils/clipboard'
import { useIsSmallScreen } from '@/composables/useIsSmallScreen'
import GenerateTokenForm from './forms/GenerateTokenForm.vue'

const tokensStore = useTokensStore()
const tableRef = ref(null)

const breadcrumbs = computed(() => [
  { route: '/', text: 'GameAP', icon: 'gameap' },
  { text: trans('tokens.tokens') },
])

const createColumns = () => [
  {
    title: trans('tokens.name'),
    key: 'name',
    render: (row) => h('span', { class: 'font-semibold text-body' }, row.name),
  },
  {
    title: trans('tokens.abilities'),
    key: 'abilities',
    width: '36%',
    ellipsis: { tooltip: true },
    render: (row) => h('span', { class: 'gi-mono text-[12.5px] text-secondary' }, row.abilities),
  },
  {
    title: trans('tokens.last_used'),
    key: 'lastUsedAt',
    render: (row) => h('span', { class: 'text-secondary text-[13px]' }, row.lastUsedAt),
  },
  {
    title: trans('main.actions'),
    key: 'actions',
    width: 140,
    render(row) {
      return h(
        GButton,
        {
          color: 'red',
          size: 'small',
          title: trans('main.delete'),
          onClick: () => onClickDelete(row.id),
        },
        {
          default: () => [
            h(GIcon, { name: 'delete', class: 'text-[12px]' }),
            h('span', { class: 'hidden lg:inline' }, trans('main.delete')),
          ],
        },
      )
    },
  },
]

const isSmallScreen = useIsSmallScreen()

const columns = computed(() => {
  const cols = createColumns()
  if (isSmallScreen.value) {
    return cols.filter((col) => col.key !== 'abilities')
  }
  return cols
})

const pagination = {
  pageSize: 30,
}

const { loading, tokens, abilities } = storeToRefs(tokensStore)

onMounted(() => {
  fetchTokens()
})

const fetchTokens = () => {
  tokensStore.fetchTokens().catch((error) => {
    errorNotification(error)
  })
}

const listData = computed(() => {
  if (!Array.isArray(tokens.value)) {
    return []
  }

  return tokens.value.map((token) => ({
    id: token.id,
    name: token.name,
    abilities: join(token.abilities, ', '),
    createdAt: new Date(token.created_at).toLocaleString(),
    lastUsedAt: token.last_used_at
      ? new Date(token.last_used_at).toLocaleString()
      : trans('main.never'),
  }))
})

const onClickGenerate = () => {
  tokensStore
    .fetchAbilities()
    .then(() => {
      generateTokenModel.value = {
        name: '',
        abilities: [],
      }
      generateTokenModalEnabled.value = true
    })
    .catch((error) => {
      errorNotification(error)
    })
}

const generateTokenModalEnabled = ref(false)
const generateTokenModel = ref({
  name: '',
  abilities: [],
})

const onGenerateToken = () => {
  tokensStore
    .createToken(generateTokenModel.value.name, generateTokenModel.value.abilities)
    .then((result) => {
      generateTokenModalEnabled.value = false
      fetchTokens()

      const copied = ref(false)

      window.$dialog.success({
        title: trans('main.success'),
        style: { width: '600px' },
        maskClosable: false,
        closable: false,
        positiveText: trans('main.close'),
        content: () =>
          h('div', [
            h(
              'div',
              {
                class: 'my-2 text-secondary',
                'data-testid': 'token-created-message',
              },
              trans('tokens.token_created_notification'),
            ),
            h(NInputGroup, { class: 'mt-3 mb-4' }, [
              h(NInput, {
                value: result.token,
                readonly: true,
                size: 'medium',
                style: 'width: 100%',
                class: 'gi-mono',
                'data-testid': 'token-created-value',
              }),
              isClipboardSupported()
                ? h(
                    NButton,
                    {
                      type: 'primary',
                      title: trans('main.copy'),
                      'data-testid': 'token-created-copy',
                      onClick: async () => {
                        const ok = await copyToClipboard(result.token)
                        if (ok) {
                          copied.value = true
                        }
                      },
                    },
                    {
                      default: () => [
                        copied.value ? h(GIcon, { name: 'check' }) : h(GIcon, { name: 'copy' }),
                      ],
                    },
                  )
                : null,
            ]),
          ]),
      })
    })
    .catch((error) => {
      errorNotification(error)
    })
}

const onClickDelete = (id) => {
  const deleteFunc = () => {
    tokensStore
      .deleteToken(id)
      .then(() => {
        notification({
          content: trans('tokens.token_removed_msg'),
          type: 'success',
        })
        fetchTokens()
      })
      .catch((error) => {
        errorNotification(error)
      })
  }

  window.$dialog.warning({
    title: trans('tokens.delete_confirm_msg'),
    positiveText: trans('main.yes'),
    negativeText: trans('main.no'),
    closable: true,
    onPositiveClick: () => {
      deleteFunc()
    },
  })
}
</script>

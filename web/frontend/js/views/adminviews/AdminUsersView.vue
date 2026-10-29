<template>
  <div>
    <GBreadcrumbs :items="breadcrumbs" />

    <GPageHeader
      :title="trans('users.users')"
      :description="trans('users.page_description')"
    >
      <template #actions>
        <GButton
          color="primary"
          size="middle"
          data-testid="users-create-button"
          @click="onClickCreate"
        >
          <GIcon name="plus" class="text-[13px]" />
          <span>{{ trans('users.create') }}</span>
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
          v-model="searchQuery"
          type="text"
          class="gi-toolbar-search w-full pl-9 pr-8"
          :placeholder="trans('users.search_placeholder')"
          :aria-label="trans('users.search_placeholder')"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="gi-focus-ring absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded text-muted hover:text-body"
          :aria-label="trans('main.clear')"
          @click="searchQuery = ''"
        >
          <GIcon name="close" class="text-[12px]" />
        </button>
      </div>
    </div>

    <GDataTable
      ref="tableRef"
      data-testid="users-table"
      keep-header-on-empty
      :columns="columns"
      :data="usersData"
      :loading="loading"
      :pagination="pagination"
      :scroll-x="560"
    />

    <GModal
      v-model:show="showUserModalEnabled"
      :title="trans('users.user')"
      style="width: 600px"
    >
      <PluginSlot
        v-if="pluginsStore.isInitialized"
        name="admin-user-info-above"
        :context="userInfoContext"
      />

      <GTable>
        <tbody>
          <tr>
            <td><strong>{{ trans('users.login') }}:</strong></td>
            <td class="gi-mono">{{ userStore.user.login }}</td>
          </tr>
          <tr>
            <td><strong>{{ trans('users.email') }}:</strong></td>
            <td>{{ userStore.user.email }}</td>
          </tr>
          <tr>
            <td><strong>{{ trans('users.name') }}:</strong></td>
            <td>{{ userStore.user.name }}</td>
          </tr>
          <tr>
            <td><strong>{{ trans('users.roles') }}:</strong></td>
            <td>{{ userStore.user.roles.join(', ') }}</td>
          </tr>
          <PluginSlot
            v-if="pluginsStore.isInitialized"
            name="admin-user-info-rows"
            :context="userInfoContext"
          />
        </tbody>
      </GTable>

      <PluginSlot
        v-if="pluginsStore.isInitialized"
        name="admin-user-info"
        :context="userInfoContext"
      />
    </GModal>

    <GModal
      v-model:show="createUserModalEnabled"
      :title="trans('users.create')"
      style="width: 600px"
    >
      <CreateUserForm v-model="createUserModel" @create="onCreate" />
    </GModal>
  </div>
</template>

<script setup>
import { GBreadcrumbs, GPageHeader, GIcon, GDataTable, GModal, GTable } from '@gameap/ui'
import { trans } from '@/i18n/i18n'
import { computed, h, ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useUserListStore } from '@/store/userList'
import { useUserStore } from '@/store/user'
import { useAuthStore } from '@/store/auth'
import { usePluginsStore } from '@/store/plugins'
import { storeToRefs } from 'pinia'
import { errorNotification, notification } from '@/parts/dialogs'
import GButton from '@/components/GButton.vue'
import CreateUserForm from './forms/CreateUserForm.vue'
import PluginSlot from '@/plugins/components/PluginSlot.vue'

const userListStore = useUserListStore()
const userStore = useUserStore()
const authStore = useAuthStore()
const pluginsStore = usePluginsStore()

const searchQuery = ref('')
const tableRef = ref(null)

const breadcrumbs = computed(() => [
  { route: '/', text: 'GameAP', icon: 'gameap' },
  { text: trans('sidebar.admin') },
  { text: trans('users.users') },
])

const userInfoContext = computed(() => ({
  userId: userStore.userId,
  user: userStore.user,
}))

const columns = computed(() => [
  {
    title: trans('users.name'),
    key: 'name',
    width: '38%',
    render: (row) =>
      h('div', { class: 'min-w-0' }, [
        h(
          RouterLink,
          {
            to: { name: 'admin.users.edit', params: { id: row.id } },
            class:
              'gi-focus-ring font-semibold text-[14.5px] leading-5 text-body hover:text-accent transition-colors no-underline block truncate',
          },
          { default: () => row.name || row.login },
        ),
        row.login
          ? h('div', { class: 'gi-mono mt-0.5 text-[12px] text-muted' }, `@${row.login}`)
          : null,
      ]),
  },
  {
    title: trans('users.email'),
    key: 'email',
    width: '36%',
    render: (row) => h('span', { class: 'text-secondary' }, row.email),
  },
  {
    title: trans('main.actions'),
    key: 'actions',
    width: '26%',
    render(row) {
      return h('div', { class: 'flex flex-wrap items-center gap-1.5' }, [
        h(
          GButton,
          {
            color: 'white',
            size: 'small',
            'data-testid': `user-row-view-${row.id}`,
            onClick: () => onClickShow(row.id),
          },
          {
            default: () => [
              h(GIcon, { name: 'view', class: 'text-[12px]' }),
              h('span', { class: 'hidden lg:inline' }, trans('main.view')),
            ],
          },
        ),
        h(
          GButton,
          {
            color: 'white',
            size: 'small',
            'data-testid': `user-row-edit-${row.id}`,
            route: { name: 'admin.users.edit', params: { id: row.id } },
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
            disabled: authStore.user?.id === row.id,
            title: trans('main.delete'),
            'data-testid': `user-row-delete-${row.id}`,
            onClick: () => onClickDelete(row.id),
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

const { users } = storeToRefs(userListStore)

const pagination = {
  pageSize: 20,
}

const loading = computed(() => userListStore.loading || userStore.loading)

onMounted(() => {
  fetchUsers()
})

const fetchUsers = () => {
  userListStore.fetchUsers().catch((error) => {
    errorNotification(error)
  })
}

const usersData = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return users.value
    .map((user) => ({
      id: user.id,
      login: user.login || '',
      name: user.name || '',
      email: user.email || '',
    }))
    .filter((u) => {
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) ||
        u.login.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      )
    })
})

const onClickDelete = (id) => {
  window.$dialog.warning({
    title: trans('users.delete_confirm_msg'),
    positiveText: trans('main.yes'),
    negativeText: trans('main.no'),
    closable: true,
    onPositiveClick: () => {
      deleteUserById(id)
    },
  })
}

const deleteUserById = (id) => {
  if (authStore.user?.id === id) {
    errorNotification(trans('users.delete_self_error_msg'))
    return
  }

  userListStore
    .deleteUserById(id)
    .then(() => {
      notification(
        {
          content: trans('users.delete_success_msg'),
          type: 'success',
        },
        () => {
          fetchUsers()
        },
      )
    })
    .catch((error) => {
      errorNotification(error)
    })
}

const showUserModalEnabled = ref(false)

const onClickShow = (id) => {
  userStore.setUserId(id)
  userStore
    .fetchUser()
    .then(() => {
      showUserModalEnabled.value = true
    })
    .catch((error) => {
      errorNotification(error)
    })
}

const createUserModalEnabled = ref(false)
const createUserModel = ref({
  name: '',
  email: '',
})
const onClickCreate = () => {
  createUserModel.value = {}
  createUserModalEnabled.value = true
}

const onCreate = () => {
  const fields = {
    login: createUserModel.value.login,
    email: createUserModel.value.email,
    password: createUserModel.value.password,
    name: createUserModel.value.name,
    roles: createUserModel.value.roles,
  }
  userListStore
    .createUser(fields)
    .then(() => {
      notification(
        {
          content: trans('users.create_success_msg'),
          type: 'success',
        },
        () => {
          createUserModalEnabled.value = false
          fetchUsers()
        },
      )
    })
    .catch((error) => {
      errorNotification(error)
    })
}
</script>

<template>
  <div>
    <GBreadcrumbs :items="breadcrumbs" />

    <GPageHeader
      :title="trans('client_certificates.client_certificates')"
      :description="trans('client_certificates.page_description')"
    >
      <template #actions>
        <GButton color="primary" size="middle" @click="onClickCreate">
          <GIcon name="plus" class="text-[13px]" />
          <span>{{ trans('client_certificates.upload') }}</span>
        </GButton>
      </template>
    </GPageHeader>

    <GDataTable
      ref="tableRef"
      :columns="columns"
      :data="clientCertificatesData"
      :loading="loading"
      :pagination="pagination"
      :scroll-x="640"
    >
      <template #empty>
        <GEmpty icon="certificate" :title="trans('main.empty_list')">
          <GButton color="primary" size="middle" @click="onClickCreate">
            <GIcon name="plus" class="text-[13px]" />
            <span>{{ trans('client_certificates.upload') }}</span>
          </GButton>
        </GEmpty>
      </template>
    </GDataTable>

    <GModal
      v-model:show="createCertificateModalEnabled"
      :title="trans('client_certificates.title_upload')"
      style="width: 600px"
    >
      <CreateCertificateForm
        v-model="createCertificateModel"
        v-model:certificateFile="createCertificateCertificateFile"
        v-model:privateKeyFile="createCertificatePrivateKeyFile"
        @create="onCreate"
      />
    </GModal>

    <GModal
      v-model:show="viewCertificateModalEnabled"
      :title="trans('client_certificates.title_view')"
      style="width: 800px"
    >
      <GTable v-if="selectedCertificate?.info">
        <tbody>
          <tr>
            <td><strong>{{ trans('client_certificates.fingerprint') }}:</strong></td>
            <td class="gi-mono text-[13px] break-all">{{ selectedCertificate.fingerprint }}</td>
          </tr>
          <tr>
            <td><strong>{{ trans('client_certificates.signature_type') }}:</strong></td>
            <td class="gi-mono">{{ selectedCertificate.info.signature_type }}</td>
          </tr>
          <tr>
            <td><strong>{{ trans('client_certificates.common_name') }}:</strong></td>
            <td>{{ selectedCertificate.info.common_name }}</td>
          </tr>
          <tr>
            <td><strong>{{ trans('client_certificates.country') }}:</strong></td>
            <td>{{ selectedCertificate.info.country }}</td>
          </tr>
          <tr>
            <td><strong>{{ trans('client_certificates.organization') }}:</strong></td>
            <td>{{ selectedCertificate.info.organization }}</td>
          </tr>
          <tr>
            <td><strong>{{ trans('client_certificates.organizational_unit') }}:</strong></td>
            <td>{{ selectedCertificate.info.organizational_unit }}</td>
          </tr>
          <tr>
            <td><strong>{{ trans('client_certificates.email') }}:</strong></td>
            <td>{{ selectedCertificate.info.email }}</td>
          </tr>
          <tr>
            <td><strong>{{ trans('client_certificates.expires') }}:</strong></td>
            <td class="gi-mono">{{ selectedCertificate.info.expires }}</td>
          </tr>
        </tbody>
      </GTable>
    </GModal>
  </div>
</template>

<script setup>
import { GBreadcrumbs, GPageHeader, GEmpty, GIcon, GDataTable, GModal, GTable } from '@gameap/ui'
import { computed, h, ref, onMounted } from 'vue'
import { camelCase } from 'lodash-es'
import { trans } from '@/i18n/i18n'
import GButton from '@/components/GButton.vue'
import { errorNotification, notification } from '@/parts/dialogs'
import { storeToRefs } from 'pinia'
import { useClientCertificatesStore } from '@/store/clientCertificates'
import CreateCertificateForm from './forms/CreateCertificateForm.vue'

const clientCertificatesStore = useClientCertificatesStore()
const tableRef = ref(null)

const breadcrumbs = computed(() => [
  { route: '/', text: 'GameAP', icon: 'gameap' },
  { route: { name: 'admin.nodes.index' }, text: trans('sidebar.dedicated_servers') },
  { text: trans('client_certificates.client_certificates') },
])

const columns = computed(() => [
  {
    title: trans('client_certificates.fingerprint'),
    key: 'fingerprint',
    ellipsis: { tooltip: true },
    render: (row) => h('span', { class: 'gi-mono text-[13px] text-body' }, row.fingerprint),
  },
  {
    title: trans('client_certificates.expires'),
    key: 'expires',
    render: (row) => h('span', { class: 'gi-mono text-[13px] text-secondary' }, row.expires),
  },
  {
    title: trans('main.actions'),
    key: 'actions',
    width: 200,
    render(row) {
      return h('div', { class: 'flex flex-wrap items-center gap-1.5' }, [
        h(
          GButton,
          {
            color: 'white',
            size: 'small',
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
        ),
      ])
    },
  },
])

const { loading, certificates } = storeToRefs(clientCertificatesStore)

const pagination = {
  pageSize: 20,
}

onMounted(() => {
  fetchClientCertificates()
})

const fetchClientCertificates = () => {
  clientCertificatesStore.fetchClientCertificates().catch((error) => {
    errorNotification(error)
  })
}

const clientCertificatesData = computed(() => {
  return certificates.value.map((certificate) => ({
    id: certificate.id,
    fingerprint: certificate.fingerprint,
    expires: certificate.expires,
    info: Object.fromEntries(
      Object.entries(certificate.info || {}).map(([k, v]) => [camelCase(k), v]),
    ),
  }))
})

const createCertificateModalEnabled = ref(false)
const createCertificateModel = ref({})
const createCertificateCertificateFile = ref()
const createCertificatePrivateKeyFile = ref()

const onClickCreate = () => {
  createCertificateModel.value = {}
  createCertificateCertificateFile.value = {}
  createCertificatePrivateKeyFile.value = {}
  createCertificateModalEnabled.value = true
}

const onCreate = () => {
  const fields = {
    certificate: createCertificateCertificateFile.value,
    private_key: createCertificatePrivateKeyFile.value,
    private_key_pass: createCertificateModel.value.privateKeyPass ?? '',
  }
  clientCertificatesStore
    .createClientCertificate(fields)
    .then(() => {
      notification(
        {
          content: trans('client_certificates.upload_success_msg'),
          type: 'success',
        },
        () => {
          createCertificateModalEnabled.value = false
          fetchClientCertificates()
        },
      )
    })
    .catch((error) => {
      errorNotification(error)
    })
}

const viewCertificateModalEnabled = ref(false)
const selectedCertificate = ref({})

const onClickShow = (certificateId) => {
  selectedCertificate.value =
    certificates.value.find((certificate) => certificate.id === certificateId) || {}
  viewCertificateModalEnabled.value = true
}

const onClickDelete = (certificateId) => {
  const deleteFunc = () => {
    clientCertificatesStore
      .deleteClientCertificate(certificateId)
      .then(() => {
        notification(
          {
            content: trans('client_certificates.delete_success_msg'),
            type: 'success',
          },
          () => {
            fetchClientCertificates()
          },
        )
      })
      .catch((error) => {
        errorNotification(error)
      })
  }

  window.$dialog.warning({
    title: trans('client_certificates.delete_confirm_msg'),
    positiveText: trans('main.yes'),
    negativeText: trans('main.no'),
    closable: true,
    onPositiveClick: () => {
      deleteFunc()
    },
  })
}
</script>

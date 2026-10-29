<template>
  <div>
    <GBreadcrumbs :items="breadcrumbs" />

    <GPageHeader
      :title="trans('profile.profile')"
      :description="trans('profile.page_description')"
    >
      <template #actions>
        <GButton
          color="primary"
          size="middle"
          data-testid="profile-edit-button"
          @click="onClickUpdate"
        >
          <GIcon name="edit" class="text-[13px]" />
          <span>{{ trans('profile.edit') }}</span>
        </GButton>
      </template>
    </GPageHeader>

    <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <!-- Account Information Card -->
      <GCard :title="trans('profile.profile')">
        <GTable>
          <tbody>
            <tr>
              <td class="w-40 text-secondary font-medium">{{ trans('users.login') }}</td>
              <td class="gi-mono text-body">{{ user.login }}</td>
            </tr>
            <tr>
              <td class="text-secondary font-medium">{{ trans('users.email') }}</td>
              <td class="text-body">{{ user.email }}</td>
            </tr>
            <tr>
              <td class="text-secondary font-medium">{{ trans('users.name') }}</td>
              <td data-testid="profile-name-value" class="font-medium text-body">{{ user.name }}</td>
            </tr>
            <tr>
              <td class="text-secondary font-medium">{{ trans('users.roles') }}</td>
              <td>
                <GStatusBadge color="blue" :text="user.roles?.join(', ')" />
              </td>
            </tr>
            <tr>
              <td class="text-secondary font-medium">{{ trans('profile.language') }}</td>
              <td class="text-body">{{ currentLanguageLabel }}</td>
            </tr>
            <PluginSlot
              v-if="pluginsStore.isInitialized"
              name="profile-info-rows"
              :context="profileContext"
            />
          </tbody>
        </GTable>
      </GCard>

      <!-- Two-Factor Authentication Card -->
      <GCard :title="trans('two_factor.title')">
        <p class="mb-4 text-[13.5px] leading-5 text-secondary">
          {{ trans('two_factor.description') }}
        </p>

        <div class="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-border bg-topbar p-4">
          <div class="flex items-center gap-2.5">
            <span class="text-[13.5px] font-medium text-secondary">{{ trans('two_factor.status') }}:</span>
            <GStatusBadge
              :status="is2FAEnabled ? 'success' : 'canceled'"
              :text="is2FAEnabled ? trans('two_factor.enabled') : trans('two_factor.disabled')"
              data-testid="twofactor-status"
            />
          </div>

          <div class="flex flex-wrap gap-2">
            <GButton
              v-if="!is2FAEnabled"
              color="primary"
              size="small"
              data-testid="twofactor-enable-button"
              @click="onEnable"
            >
              <GIcon name="lock" class="text-[12px]" />
              <span>{{ trans('two_factor.enable') }}</span>
            </GButton>

            <template v-else>
              <GButton
                color="white"
                size="small"
                data-testid="twofactor-regen-button"
                @click="onOpenRegen"
              >
                <GIcon name="refresh" class="text-[12px]" />
                <span>{{ trans('two_factor.regenerate_recovery_codes') }}</span>
              </GButton>
              <GButton
                color="red"
                size="small"
                data-testid="twofactor-disable-button"
                @click="disableModalEnabled = true"
              >
                <GIcon name="delete" class="text-[12px]" />
                <span>{{ trans('two_factor.disable') }}</span>
              </GButton>
            </template>
          </div>
        </div>
      </GCard>
    </div>

    <div class="mt-5">
      <PluginSlot
        v-if="pluginsStore.isInitialized"
        name="profile-blocks"
        :context="profileContext"
      />
    </div>

    <GModal
      v-model:show="updateProfileModalEnabled"
      :title="trans('profile.edit')"
      style="width: 600px"
    >
      <UpdateProfileForm v-model="updateProfileModel" @update="onUpdate" />
    </GModal>

    <GModal
      v-model:show="setupModalEnabled"
      :title="trans('two_factor.setup_title')"
      style="width: 520px"
    >
      <TwoFactorSetupForm
        :secret="twoFASetup.secret"
        :otpauth-uri="twoFASetup.otpauth_uri"
        :recovery-codes="twoFARecoveryCodes"
        @confirm="onConfirm"
        @done="onSetupDone"
      />
    </GModal>

    <GModal
      v-model:show="disableModalEnabled"
      :title="trans('two_factor.disable_title')"
      style="width: 520px"
    >
      <TwoFactorDisableForm @disable="onDisable" />
    </GModal>

    <GModal
      v-model:show="regenModalEnabled"
      :title="trans('two_factor.regenerate_recovery_codes')"
      style="width: 520px"
    >
      <TwoFactorSetupForm
        v-if="twoFARecoveryCodes"
        :recovery-codes="twoFARecoveryCodes"
        @done="onRegenDone"
      />
      <div v-else>
        <p class="mb-4 text-sm text-secondary">
          {{ trans('two_factor.regenerate_desc') }}
        </p>
        <n-form ref="regenFormRef" label-placement="top" :model="regenForm" :rules="regenRules">
          <n-form-item :label="trans('two_factor.password')" path="password">
            <n-input
              v-model:value="regenForm.password"
              type="password"
              show-password-on="click"
              :input-props="{ autocomplete: 'current-password' }"
              data-testid="twofactor-regen-password"
            />
          </n-form-item>
        </n-form>
        <div class="mt-4 flex justify-end">
          <GButton color="primary" data-testid="twofactor-regen-submit" @click="onRegen">
            <GIcon name="refresh" class="text-[12px]" />
            <span>{{ trans('two_factor.regenerate_recovery_codes') }}</span>
          </GButton>
        </div>
      </div>
    </GModal>
  </div>
</template>

<script setup>
import { GBreadcrumbs, GPageHeader, GIcon, GModal, GCard, GTable, GStatusBadge } from '@gameap/ui'
import { computed, ref } from 'vue'
import { NForm, NFormItem, NInput } from 'naive-ui'
import { trans, getCurrentLanguage, changeLanguage, getAvailableLanguages } from '@/i18n/i18n'
import UpdateProfileForm from './forms/UpdateProfileForm.vue'
import TwoFactorSetupForm from './forms/TwoFactorSetupForm.vue'
import TwoFactorDisableForm from './forms/TwoFactorDisableForm.vue'
import { useAuthStore } from '@/store/auth'
import { useUISettingsStore } from '@/store/uiSettings'
import { usePluginsStore } from '@/store/plugins'
import PluginSlot from '@/plugins/components/PluginSlot.vue'
import GButton from '../components/GButton.vue'
import { errorNotification, notification } from '@/parts/dialogs'
import { requiredValidator } from '@/parts/validators'

const authStore = useAuthStore()
const uiSettingsStore = useUISettingsStore()
const pluginsStore = usePluginsStore()

const currentLanguageLabel = computed(() => {
  const lang = getCurrentLanguage()
  const language = getAvailableLanguages().find((l) => l.code === lang)
  return language?.native_name || language?.name || lang
})

const breadcrumbs = computed(() => [
  { route: '/', text: 'GameAP', icon: 'gameap' },
  { text: trans('profile.profile') },
])

const user = computed(() => authStore.user)

const profileContext = computed(() => ({
  userId: authStore.user?.id,
  user: authStore.user,
}))

const onClickUpdate = () => {
  updateProfileModel.value = {
    name: user.value.name,
    language: getCurrentLanguage(),
  }
  updateProfileModalEnabled.value = true
}

const updateProfileModalEnabled = ref(false)
const updateProfileModel = ref({
  name: user.value?.name || '',
  language: getCurrentLanguage(),
})

const onUpdate = () => {
  const currentLang = getCurrentLanguage()
  const newLang = updateProfileModel.value.language

  const profile = {
    name: updateProfileModel.value.name,
  }

  if (updateProfileModel.value.password) {
    profile.current_password = updateProfileModel.value.currentPassword
    profile.password = updateProfileModel.value.password
  }

  authStore
    .saveProfile(profile)
    .then(() => {
      if (newLang && newLang !== currentLang) {
        uiSettingsStore.setLanguage(newLang)
        changeLanguage(newLang)

        notification(
          {
            content: trans('profile.update_with_lang_success_msg'),
            type: 'success',
          },
          () => {
            window.location.reload()
          },
        )
      } else {
        notification({
          content: trans('profile.update_success_msg'),
          type: 'success',
        })
      }

      authStore.fetchProfile()
      updateProfileModalEnabled.value = false
    })
    .catch((error) => {
      errorNotification(error)
      updateProfileModalEnabled.value = false
    })
}

const is2FAEnabled = computed(() => authStore.is2FAEnabled)

const setupModalEnabled = ref(false)
const disableModalEnabled = ref(false)
const regenModalEnabled = ref(false)
const twoFASetup = ref({ secret: '', otpauth_uri: '' })
const twoFARecoveryCodes = ref(null)

const regenFormRef = ref({})
const regenForm = ref({ password: '' })
const regenRules = {
  password: {
    required: true,
    validator: requiredValidator(trans('two_factor.password')),
    trigger: ['blur', 'input'],
  },
}

const onEnable = () => {
  authStore
    .setupTwoFactor()
    .then((data) => {
      twoFASetup.value = data
      twoFARecoveryCodes.value = null
      setupModalEnabled.value = true
    })
    .catch(errorNotification)
}

const onConfirm = (code) => {
  authStore
    .confirmTwoFactor(code)
    .then((data) => {
      twoFARecoveryCodes.value = data.recovery_codes
    })
    .catch(errorNotification)
}

const onSetupDone = () => {
  setupModalEnabled.value = false
  twoFARecoveryCodes.value = null
  authStore.fetchProfile()
  notification({
    content: trans('two_factor.enable_success'),
    type: 'success',
  })
}

const onDisable = ({ password, code }) => {
  authStore
    .disableTwoFactor(password, code)
    .then(() => {
      disableModalEnabled.value = false
      authStore.fetchProfile()
      notification({
        content: trans('two_factor.disable_success'),
        type: 'success',
      })
    })
    .catch(errorNotification)
}

const onOpenRegen = () => {
  twoFARecoveryCodes.value = null
  regenForm.value.password = ''
  regenModalEnabled.value = true
}

const onRegen = () => {
  regenFormRef.value
    .validate()
    .then(() => {
      authStore
        .regenerateRecoveryCodes(regenForm.value.password)
        .then((data) => {
          twoFARecoveryCodes.value = data.recovery_codes
        })
        .catch(errorNotification)
    })
    .catch(() => {})
}

const onRegenDone = () => {
  regenModalEnabled.value = false
  twoFARecoveryCodes.value = null
  notification({
    content: trans('two_factor.recovery_regenerated'),
    type: 'success',
  })
}
</script>

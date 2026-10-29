<template>
  <section class="mx-auto w-full max-w-[420px]">
    <div class="rounded-[10px] border border-border bg-surface shadow-xl overflow-hidden">
      <div class="border-b border-border bg-surface-raised px-6 py-5 sm:px-7">
        <h1 class="m-0 text-[20px] font-semibold leading-7 text-body">
          {{ twoFactorRequired ? trans('two_factor.verify_title') : trans('auth.sign_in') }}
        </h1>
        <p v-if="!twoFactorRequired" class="mt-1 mb-0 text-[13.5px] leading-5 text-secondary">
          {{ trans('auth.sign_in_subtitle') }}
        </p>
      </div>

      <template v-if="!twoFactorRequired">
        <form class="p-6 sm:p-7 space-y-4" action="#" @submit.prevent="login">
          <div>
            <label for="email" class="mb-1.5 block text-[13px] font-medium text-secondary">
              {{ trans('auth.username_email') }}
            </label>
            <input
              id="email"
              v-model="email"
              type="text"
              name="email"
              autocomplete="username"
              class="gi-toolbar-search block w-full px-3.5"
              required
            />
          </div>

          <div>
            <label for="password" class="mb-1.5 block text-[13px] font-medium text-secondary">
              {{ trans('auth.password') }}
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              name="password"
              autocomplete="current-password"
              class="gi-toolbar-search block w-full px-3.5"
              required
              @keyup.enter="login"
            />
          </div>

          <div class="flex items-center pt-0.5">
            <label for="remember" class="inline-flex cursor-pointer items-center gap-2.5 text-[13.5px] text-secondary select-none">
              <input
                id="remember"
                v-model="remember"
                type="checkbox"
                class="h-4 w-4 rounded border-border bg-sidebar accent-accent"
              />
              <span>{{ trans('auth.remember') }}</span>
            </label>
          </div>

          <CaptchaWidget
            v-if="captcha.provider"
            ref="captchaRef"
            :provider="captcha.provider"
            :site-key="captcha.site_key"
          />

          <div class="pt-2">
            <GButton
              type="submit"
              color="primary"
              size="middle"
              class="w-full"
              :loading="submitting"
            >
              <GIcon v-if="!submitting" name="sign-in" class="text-[14px]" />
              <span>{{ submitting ? trans('main.wait') : trans('auth.sign_in') }}</span>
            </GButton>
          </div>
        </form>
      </template>

      <TwoFactorVerifyForm v-else class="p-6 sm:p-7" :loading="submitting" @verify="onVerify" />
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { GIcon } from '@gameap/ui'
import { trans } from '../i18n/i18n'
import axios from '../config/axios'
import { useAuthStore } from '../store/auth'
import { errorNotification } from '../parts/dialogs'
import GButton from '../components/GButton.vue'
import TwoFactorVerifyForm from './forms/TwoFactorVerifyForm.vue'
import CaptchaWidget from './forms/CaptchaWidget.vue'

const authStore = useAuthStore()
const router = useRouter()

const email = ref(null)
const password = ref(null)
const remember = ref(false)
const twoFactorRequired = ref(false)
const captcha = ref({ provider: null, site_key: null })
const captchaRef = ref(null)

onMounted(async () => {
  try {
    const { data } = await axios.get('/api/config/public')
    if (data && data.captcha) {
      captcha.value = data.captcha
    }
  } catch (e) {
    console.error('Failed to load public config:', e)
  }
})

const showError = (error) => {
  if (error.response) {
    if ('data' in error.response && 'message' in error.response.data) {
      errorNotification(error.response.data.message)
    } else {
      errorNotification(error)
    }
  } else {
    errorNotification(error)
  }
}

const completeLogin = async () => {
  try {
    await authStore.fetchProfile()
  } catch (error) {
    console.error('Post-login profile fetch failed:', error)
  }

  try {
    await router.push({ name: 'home' })
  } catch (error) {
    console.error('Post-login navigation failed:', error)
  }

  try {
    const { loadPlugins } = await import('../plugins/loader')
    await loadPlugins(router)
  } catch (error) {
    console.error('Failed to load plugins after login:', error)
  }
}

const submitting = ref(false)

const login = async () => {
  if (submitting.value) {
    return
  }

  submitting.value = true

  try {
    let captchaToken = ''

    if (captcha.value.provider) {
      captchaToken = await captchaRef.value.getToken()
      if (!captchaToken) {
        errorNotification(trans('auth.captcha_required'))
        return
      }
    }

    const result = await authStore.login({
      login: email.value,
      password: password.value,
      remember: remember.value ? 'on' : null,
      captcha: captchaToken,
    })

    if (result && result.twoFactorRequired) {
      twoFactorRequired.value = true
      return
    }

    await completeLogin()
  } catch (error) {
    if (captchaRef.value) {
      captchaRef.value.reset()
    }
    showError(error)
  } finally {
    submitting.value = false
  }
}

const onVerify = async (code) => {
  if (submitting.value) {
    return
  }

  submitting.value = true

  try {
    await authStore.verifyTwoFactor(code)
    await completeLogin()
  } catch (error) {
    showError(error)
  } finally {
    submitting.value = false
  }
}
</script>

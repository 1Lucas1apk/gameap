<script setup>
import { ref, h, computed } from 'vue'
import { NModal, NProgress } from 'naive-ui'
import { confirm, errorNotification, notification } from '@/parts/dialogs'
import { trans } from '@/i18n/i18n'
import { useAuthStore } from '@/store/auth'
import axios from '@/config/axios'
import { GIcon } from '@gameap/ui'
import GButton from '@/components/GButton.vue'
import { useTaskWebSocket } from '@/composables/useTaskWebSocket'

const authStore = useAuthStore()

const bodyStyle = {
  width: '560px',
}

const CLEAR_STATE_TIMEOUT = 2000
const LONG_WAITING_TIME = 20000

const PROGRESS_PERCENT_NULL = 0
const PROGRESS_PERCENT_WAITING = 10
const PROGRESS_PERCENT_WORKING = 40
const PROGRESS_PERCENT_TASK_SUCCESS = 80
const PROGRESS_PERCENT_COMPLETE = 100

const CHECK_SERVER_STATUS_TRIES = 10
const CHECK_SERVER_STATUS_TIMEOUT = 2000

const commandConfiguration = computed(() => ({
  start: {
    title: trans('servers.starting'),
    checkServerStatusAfterTask: true,
    expectedStatus: true,
    successMessage: trans('servers.start_success_msg'),
    failMessage: trans('servers.start_fail_msg'),
  },
  stop: {
    title: trans('servers.stopping'),
    checkServerStatusAfterTask: true,
    expectedStatus: false,
    successMessage: trans('servers.stop_success_msg'),
    failMessage: trans('servers.stop_fail_msg'),
  },
  restart: {
    title: trans('servers.restarting'),
    checkServerStatusAfterTask: true,
    expectedStatus: true,
    successMessage: trans('servers.restart_success_msg'),
    failMessage: trans('servers.restart_fail_msg'),
  },
  update: {
    title: trans('servers.updating'),
    checkServerStatusAfterTask: false,
  },
  install: {
    title: trans('servers.installing'),
    checkServerStatusAfterTask: false,
  },
  reinstall: {
    title: trans('servers.reinstalling'),
    checkServerStatusAfterTask: false,
  },
}))

const showProgressbar = ref(false)
const progress = ref(PROGRESS_PERCENT_NULL)
const progressModalTitle = ref('')
const progressDetails = ref('')
const additionalInfoHtml = ref('')
const currentTaskId = ref(null)
const currentCommand = ref(null)

const props = defineProps([
  'button',
  'buttonColor',
  'buttonSize',
  'icon',
  'text',
  'command',
  'serverId',
])

let watchTaskStartedTime = 0
let detailedError = false
let statusTries = CHECK_SERVER_STATUS_TRIES
let clearStateTimer = null

useTaskWebSocket(currentTaskId, {
  onStatusChange(status) {
    handleTaskStatus(currentCommand.value, status)
  },
  onComplete(status) {
    handleTaskComplete(currentCommand.value, status)
  },
})

function handleTaskStatus(command, status) {
  if (status === 'waiting') {
    progressDetails.value = trans('servers.command_progress_waiting')
    progress.value = PROGRESS_PERCENT_WAITING
    checkLongWaiting()
  } else if (status === 'working') {
    progressDetails.value = trans('servers.command_progress_executed')
    progress.value = PROGRESS_PERCENT_WORKING
    additionalInfoHtml.value = ''
  }
}

function handleTaskComplete(command, status) {
  const cfg = commandConfiguration.value[command]
  if (status === 'success') {
    progress.value = PROGRESS_PERCENT_TASK_SUCCESS

    if (cfg?.checkServerStatusAfterTask) {
      progressDetails.value = trans('servers.command_progress_waiting_status')
      setTimeout(watchServerStatus, CHECK_SERVER_STATUS_TIMEOUT, command)
    } else {
      progressDetails.value = ''
      taskSuccess(cfg?.successMessage)
      setTimeout(clearState, CLEAR_STATE_TIMEOUT)
    }
  } else if (status === 'canceled') {
    progressDetails.value = ''
    progress.value = PROGRESS_PERCENT_NULL
    taskError(trans('gdaemon_tasks.common_canceled_msg'))
  } else {
    progressDetails.value = ''
    progress.value = PROGRESS_PERCENT_COMPLETE
    taskError(trans('gdaemon_tasks.common_error_msg'))
  }
}

function run(command) {
  confirm(trans('main.confirm_message'), () => runCommand(command))
}

function runCommand(command) {
  progress.value = PROGRESS_PERCENT_NULL
  additionalInfoHtml.value = ''

  if (authStore.isAdmin) {
    detailedError = true
  }

  axios
    .post('/api/servers/' + props.serverId + '/' + command)
    .then(function (response) {
      const taskId = response.data.gdaemonTaskId

      showProgressbar.value = true
      progressModalTitle.value = commandConfiguration.value[command]?.title || command

      watchTaskStartedTime = new Date().getTime()

      clearTimeout(clearStateTimer)
      currentCommand.value = command
      currentTaskId.value = taskId
    })
    .catch(function (error) {
      errorNotification(error?.response?.data?.message || error, function () {
        location.reload()
      })
    })
}

function checkLongWaiting() {
  if (new Date().getTime() - watchTaskStartedTime > LONG_WAITING_TIME) {
    additionalInfoHtml.value = trans('gdaemon_tasks.long_waiting_doc')
  }
}

function taskError(errorMsg) {
  if (errorMsg === undefined || errorMsg === '') {
    errorMsg = trans('gdaemon_tasks.common_error_msg')
  }

  let content = ''
  if (detailedError && currentTaskId.value) {
    const taskId = currentTaskId.value
    content = () => [
      h('div', { class: 'my-4 flex items-center gap-2' }, [
        h('span', { class: 'text-secondary' }, trans('servers.task_see_log')),
        h(
          GButton,
          {
            color: 'white',
            size: 'small',
            onClick: () => {
              window.location.href = '/admin/gdaemon_tasks/' + taskId
            },
          },
          () => [
            h('span', {}, trans('main.details')),
            h(GIcon, { name: 'chevron-right', class: 'text-[11px]' }),
          ],
        ),
      ]),
    ]
  }

  notification(
    {
      title: errorMsg,
      content: content,
      type: 'error',
    },
    () => {
      location.reload()
    },
  )

  watchTaskStartedTime = 0
  additionalInfoHtml.value = ''
  showProgressbar.value = false

  taskComplete()
}

function taskSuccess(msg) {
  additionalInfoHtml.value = ''
  watchTaskStartedTime = 0

  if (msg === undefined || msg === '') {
    msg = trans('servers.task_success_msg')
  }

  notification(
    {
      title: trans('main.success'),
      content: msg,
      type: 'success',
    },
    () => {
      location.reload()
    },
  )

  taskComplete()
}

function taskComplete() {
  showProgressbar.value = false
  clearStateTimer = setTimeout(clearState, CLEAR_STATE_TIMEOUT)
}

function watchServerStatus(command) {
  const cfg = commandConfiguration.value[command]
  getServerStatus((serverStatus) => {
    if (serverStatus === cfg?.expectedStatus) {
      taskSuccess(cfg?.successMessage)
      return
    }

    if (statusTries <= 0) {
      taskError(cfg?.failMessage)
      return
    }

    statusTries--
    if (progress.value <= 90) {
      progress.value++
    }
    setTimeout(watchServerStatus, CHECK_SERVER_STATUS_TIMEOUT, command)
  })
}

function getServerStatus(fn) {
  axios.get('/api/servers/' + props.serverId + '/status').then(function (response) {
    fn(response.data.processActive)
  })
}

function clearState() {
  clearStateTimer = null
  progress.value = 0
  statusTries = CHECK_SERVER_STATUS_TRIES
  currentTaskId.value = null
  currentCommand.value = null
  additionalInfoHtml.value = ''
}

function progressModalChanged(show) {
  if (!show) {
    showProgressbar.value = false
    clearTimeout(clearStateTimer)
    currentTaskId.value = null
    currentCommand.value = null
  }
}
</script>

<template>
  <n-modal
    v-model:show="showProgressbar"
    class="custom-card"
    preset="card"
    :style="bodyStyle"
    :title="progressModalTitle"
    :bordered="true"
    size="medium"
    :on-update:show="progressModalChanged"
  >
    <div v-if="progressDetails" class="mb-2.5 text-[13.5px] text-secondary">
      {{ progressDetails }}
    </div>
    <n-progress
      type="line"
      :height="20"
      :border-radius="6"
      :percentage="progress"
      indicator-placement="inside"
      processing
    />
    <div
      v-if="additionalInfoHtml"
      id="additional-info"
      class="mt-3 rounded-[7px] border border-border bg-surface p-3 text-[13px] text-secondary"
      v-html="additionalInfoHtml"
    />
    <div v-if="authStore.isAdmin && currentTaskId" class="mt-5 flex justify-end">
      <GButton color="white" size="small" :route="'/admin/gdaemon_tasks/' + currentTaskId">
        <span>{{ trans('main.details') }}</span>
        <GIcon name="chevron-right" class="text-[11px]" />
      </GButton>
    </div>
  </n-modal>

  <GButton
    :class="button"
    :color="buttonColor"
    :size="buttonSize"
    :title="text"
    @click="run(command)"
  >
    <GIcon :name="icon" class="text-[12px]" />
    <span class="hidden sm:inline">{{ text }}</span>
  </GButton>
</template>

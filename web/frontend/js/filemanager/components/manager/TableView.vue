<template>
    <div
        ref="tableArea"
        class="fm-table-area"
        tabindex="0"
        v-on:click.self="clearOnEmpty"
        v-on:keydown="onKeyDown"
    >
        <!-- Floating/Sticky Batch Selection Toolbar -->
        <transition name="fm-slide-fade">
            <div v-if="totalSelectedCount > 0" class="fm-selection-bar">
                <div class="fm-selection-bar__left">
                    <span class="fm-selection-badge">{{ totalSelectedCount }}</span>
                    <span class="fm-selection-label">
                        {{ totalSelectedCount === 1 ? '1 item selecionado' : `${totalSelectedCount} itens selecionados` }}
                        <span v-if="selectedSizeFormatted" class="fm-selection-size">({{ selectedSizeFormatted }})</span>
                    </span>
                </div>
                <div class="fm-selection-bar__actions">
                    <button
                        type="button"
                        class="fm-btn-action fm-btn-action--zip"
                        title="Compactar selecionados em um arquivo ZIP"
                        @click="openZipModal"
                    >
                        <GIcon name="file-zipper" />
                        <span>Criar ZIP</span>
                    </button>
                    <button
                        type="button"
                        class="fm-btn-action fm-btn-action--delete"
                        title="Excluir selecionados de uma vez"
                        @click="openDeleteModal"
                    >
                        <GIcon name="trash" />
                        <span>Excluir</span>
                    </button>
                    <button
                        type="button"
                        class="fm-btn-action fm-btn-action--clear"
                        title="Desmarcar tudo"
                        @click="clearSelection"
                    >
                        <GIcon name="close" />
                        <span>Desmarcar tudo</span>
                    </button>
                </div>
            </div>
        </transition>

        <table class="fm-table">
            <thead>
                <tr>
                    <th class="fm-th fm-th--check">
                        <input
                            type="checkbox"
                            class="fm-checkbox fm-checkbox--all"
                            :checked="isAllSelected"
                            :indeterminate.prop="isIndeterminate"
                            title="Selecionar todos / Desmarcar todos"
                            @click.stop="toggleSelectAll"
                        />
                    </th>
                    <th
                        class="fm-th fm-th--name"
                        v-bind:class="{ 'fm-th--active': sortSettings.field === 'name' }"
                        v-on:click="handleSortBy('name')"
                    >
                        <span class="fm-th-label">{{ lang.manager.table.name }}</span>
                        <GIcon
                            class="fm-th-sort"
                            v-bind:class="{ 'fm-th-sort--inactive': sortSettings.field !== 'name' }"
                            v-bind:name="sortIcon('name')"
                        />
                    </th>
                    <th
                        class="fm-th fm-th--size"
                        v-bind:class="{ 'fm-th--active': sortSettings.field === 'size' }"
                        v-on:click="handleSortBy('size')"
                    >
                        <span class="fm-th-label">{{ lang.manager.table.size }}</span>
                        <GIcon
                            class="fm-th-sort"
                            v-bind:class="{ 'fm-th-sort--inactive': sortSettings.field !== 'size' }"
                            v-bind:name="sortIcon('size')"
                        />
                    </th>
                    <th
                        class="fm-th fm-th--type"
                        v-bind:class="{ 'fm-th--active': sortSettings.field === 'type' }"
                        v-on:click="handleSortBy('type')"
                    >
                        <span class="fm-th-label">{{ lang.manager.table.type }}</span>
                        <GIcon
                            class="fm-th-sort"
                            v-bind:class="{ 'fm-th-sort--inactive': sortSettings.field !== 'type' }"
                            v-bind:name="sortIcon('type')"
                        />
                    </th>
                    <th
                        class="fm-th fm-th--date"
                        v-bind:class="{ 'fm-th--active': sortSettings.field === 'date' }"
                        v-on:click="handleSortBy('date')"
                    >
                        <span class="fm-th-label">{{ lang.manager.table.date }}</span>
                        <GIcon
                            class="fm-th-sort"
                            v-bind:class="{ 'fm-th-sort--inactive': sortSettings.field !== 'date' }"
                            v-bind:name="sortIcon('date')"
                        />
                    </th>
                    <th class="fm-th fm-th--perm">
                        {{ lang.manager.table.permissions }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="!isRootPath" class="fm-row fm-row--up" v-on:click="levelUp">
                    <td colspan="6" class="fm-content-item">
                        <GIcon name="arrow-turn-up" />
                        <span class="ml-2 text-muted">..</span>
                    </td>
                </tr>
                <tr
                    v-for="(directory, index) in directories"
                    v-bind:key="`d-${directory.path}`"
                    v-bind:ref="(el) => registerRow(el, directoryRowIndex(index))"
                    class="fm-row fm-row--directory"
                    v-bind:class="{
                        'fm-row--zebra': directoryRowIndex(index) % 2 === 1,
                        'fm-row--selected': checkSelect('directories', directory.path),
                        'fm-row--focused': focusedIndex === directoryRowIndex(index),
                        'fm-row--locked': acl && directory.acl === 0,
                        'fm-row--hidden': directory.basename.startsWith('.'),
                    }"
                    tabindex="-1"
                    v-on:click="selectItem('directories', directory.path, $event, directoryRowIndex(index))"
                    v-on:dblclick="handleSelectDirectory(directory.path)"
                    v-on:contextmenu.prevent="contextMenu(directory, $event)"
                >
                    <td class="fm-cell--check" @click.stop="onCheckboxClick('directories', directory.path, $event)">
                        <input
                            type="checkbox"
                            class="fm-checkbox"
                            :checked="checkSelect('directories', directory.path)"
                            @change.stop="onCheckboxClick('directories', directory.path, $event)"
                        />
                    </td>
                    <td class="fm-content-item unselectable">
                        <span class="fm-row-icon">
                            <GIcon name="folder-solid" class="fm-row-glyph fm-row-glyph--dir" />
                        </span>
                        <span class="fm-row-name"><HighlightedName v-bind:text="directory.basename" v-bind:query="highlightQuery" /></span>
                    </td>
                    <td class="fm-cell-muted">—</td>
                    <td>{{ lang.manager.table.folder }}</td>
                    <td>{{ timestampToDate(directory.timestamp) }}</td>
                    <td class="fm-permissions">{{ formatMode(directory.mode) }}</td>
                </tr>
                <tr
                    v-for="(file, index) in files"
                    v-bind:key="`f-${file.path}`"
                    v-bind:ref="(el) => registerRow(el, fileRowIndex(index))"
                    class="fm-row fm-row--file"
                    v-bind:class="{
                        'fm-row--zebra': fileRowIndex(index) % 2 === 1,
                        'fm-row--selected': checkSelect('files', file.path),
                        'fm-row--focused': focusedIndex === fileRowIndex(index),
                        'fm-row--locked': acl && file.acl === 0,
                        'fm-row--hidden': file.basename.startsWith('.'),
                    }"
                    tabindex="-1"
                    v-on:click="selectItem('files', file.path, $event, fileRowIndex(index))"
                    v-on:dblclick="selectAction(file)"
                    v-on:contextmenu.prevent="contextMenu(file, $event)"
                >
                    <td class="fm-cell--check" @click.stop="onCheckboxClick('files', file.path, $event)">
                        <input
                            type="checkbox"
                            class="fm-checkbox"
                            :checked="checkSelect('files', file.path)"
                            @change.stop="onCheckboxClick('files', file.path, $event)"
                        />
                    </td>
                    <td class="fm-content-item unselectable">
                        <span class="fm-row-icon">
                            <GIcon
                                v-bind:name="extensionToIcon(file.extension)"
                                class="fm-row-glyph fm-row-glyph--file"
                            />
                        </span>
                        <span class="fm-row-name"><HighlightedName v-bind:text="file.basename" v-bind:query="highlightQuery" /></span>
                    </td>
                    <td>{{ bytesToHuman(file.size) }}</td>
                    <td class="fm-cell-extension">{{ file.extension || '—' }}</td>
                    <td>{{ timestampToDate(file.timestamp) }}</td>
                    <td class="fm-permissions">{{ formatMode(file.mode) }}</td>
                </tr>
                <template v-if="showSkeleton">
                    <tr
                        v-for="n in 8"
                        v-bind:key="`skel-${n}`"
                        class="fm-row fm-row--skeleton"
                        aria-hidden="true"
                    >
                        <td class="fm-cell--check">
                            <span class="fm-skel fm-skel--check" />
                        </td>
                        <td class="fm-content-item">
                            <span class="fm-row-icon">
                                <span class="fm-skel fm-skel--icon" />
                            </span>
                            <span
                                class="fm-skel fm-skel--name"
                                v-bind:style="{ width: `${30 + (n * 11) % 50}%` }"
                            />
                        </td>
                        <td><span class="fm-skel fm-skel--cell fm-skel--narrow" /></td>
                        <td><span class="fm-skel fm-skel--cell fm-skel--narrow" /></td>
                        <td><span class="fm-skel fm-skel--cell" /></td>
                        <td><span class="fm-skel fm-skel--cell fm-skel--narrow" /></td>
                    </tr>
                </template>
                <tr v-else-if="showError" class="fm-row fm-row--error">
                    <td colspan="6">
                        <div class="fm-empty fm-empty--error">
                            <GIcon name="warning" class="fm-empty-icon fm-empty-icon--error" />
                            <p class="fm-empty-title">{{ lang.manager.errorTitle }}</p>
                            <p class="fm-empty-hint">{{ errorMessage }}</p>
                            <button
                                type="button"
                                class="fm-empty-retry"
                                v-on:click="onRetry"
                            >
                                <GIcon name="refresh" />
                                <span>{{ lang.manager.errorRetry }}</span>
                            </button>
                        </div>
                    </td>
                </tr>
                <tr v-else-if="isEmpty" class="fm-row fm-row--empty">
                    <td colspan="6">
                        <div class="fm-empty">
                            <GIcon name="folder-open" class="fm-empty-icon" />
                            <p class="fm-empty-title">{{ lang.manager.empty }}</p>
                            <p class="fm-empty-hint">{{ lang.manager.emptyHint }}</p>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup>
/* eslint-disable no-bitwise */
import { computed, ref, nextTick, watch } from 'vue'
import { GIcon } from '@gameap/ui'
import HighlightedName from './HighlightedName.vue'
import EventBus from '../../emitter.js'
import { useFileManagerStore } from '../../stores/useFileManagerStore.js'
import { useSettingsStore } from '../../stores/useSettingsStore.js'
import { useModalStore } from '../../stores/useModalStore.js'
import { useManager } from '../../composables/useManager.js'
import { useTranslate } from '../../composables/useTranslate.js'
import { useHelper } from '../../composables/useHelper.js'
import { useFileOpener } from '../../composables/useFileOpener.js'

const props = defineProps({
    manager: { type: String, required: true },
})

const fm = useFileManagerStore()
const settings = useSettingsStore()
const modal = useModalStore()
const { lang } = useTranslate()
const { bytesToHuman, timestampToDate, extensionToIcon } = useHelper()
const { openFile } = useFileOpener(props.manager)

const {
    selectedDisk,
    selectedDirectory,
    files,
    directories,
    flatVisible,
    selected,
    sort,
    loading,
    error,
    selectDirectory,
    refreshDirectory,
    clearError,
    sortBy,
    selectRangeTo,
    toggleSelect,
    selectAllVisible,
    clearSelection: storeClearSelection,
    selectedFilesSize,
    openModal,
} = useManager(props.manager)

const sortSettings = computed(() => sort.value)
const acl = computed(() => settings.acl)
const isRootPath = computed(() => selectedDirectory.value === null)
const hasContent = computed(() => directories.value.length > 0 || files.value.length > 0)
const showSkeleton = computed(() => loading.value && !hasContent.value)
const showError = computed(() => !loading.value && !!error.value && !hasContent.value)
const isEmpty = computed(() => !loading.value && !error.value && !hasContent.value)
const errorMessage = computed(() => error.value?.message || lang.value.manager.errorGeneric)

const totalVisibleCount = computed(() => directories.value.length + files.value.length)
const totalSelectedCount = computed(() => (selected.value?.directories?.length || 0) + (selected.value?.files?.length || 0))
const isAllSelected = computed(() => totalVisibleCount.value > 0 && totalSelectedCount.value === totalVisibleCount.value)
const isIndeterminate = computed(() => totalSelectedCount.value > 0 && totalSelectedCount.value < totalVisibleCount.value)
const selectedSizeFormatted = computed(() => {
    const size = selectedFilesSize.value
    return size > 0 ? bytesToHuman(size) : null
})

function toggleSelectAll() {
    if (isAllSelected.value) {
        storeClearSelection()
    } else {
        selectAllVisible()
    }
}

function onCheckboxClick(type, path, event) {
    if (event) {
        event.stopPropagation()
    }
    toggleSelect(type, path)
}

function openZipModal() {
    openModal('ZipModal')
}

function openDeleteModal() {
    openModal('DeleteModal')
}

function clearSelection() {
    storeClearSelection()
}

async function onRetry() {
    clearError()
    await refreshDirectory()
}

const tableArea = ref(null)
const focusedIndex = ref(-1)
const rowEls = new Map()

function directoryRowIndex(index) {
    return index
}

function fileRowIndex(index) {
    return directories.value.length + index
}

function registerRow(el, index) {
    if (el) {
        rowEls.set(index, el)
    } else {
        rowEls.delete(index)
    }
}

const isActiveManager = computed(() => fm.activeManager === props.manager)
const highlightQuery = computed(() => (isActiveManager.value ? fm.effectiveSearchQuery : ''))
const currentMatchIndex = computed(() => (isActiveManager.value ? fm.currentSearchMatch : -1))

// The current match is marked with the regular row selection, as if it had been
// clicked. flush: 'post' so the rows of a fresh listing/query are already
// rendered and registered in rowEls.
watch(
    () => [currentMatchIndex.value, fm.searchScrollTick],
    () => {
        const index = currentMatchIndex.value
        if (index < 0) return

        const item = flatVisible.value[index]
        if (!item) return

        focusedIndex.value = index
        fm.changeSelected(props.manager, { type: item.type, path: item.path })
        rowEls.get(index)?.scrollIntoView({ block: 'nearest' })
    },
    { flush: 'post' }
)

// On close, hand keyboard navigation back to the table, continuing from the match.
watch(
    () => fm.searchOpen,
    (open, wasOpen) => {
        if (open || !wasOpen || !isActiveManager.value) return

        nextTick(() => tableArea.value?.focus())
    }
)

function levelUp() {
    if (selectedDirectory.value) {
        const pathUp = selectedDirectory.value.split('/').slice(0, -1).join('/')
        selectDirectory(pathUp || null, true)
    }
}

function checkSelect(type, path) {
    return selected.value[type].includes(path)
}

function selectItem(type, path, event, rowIndex) {
    focusedIndex.value = rowIndex

    if (event.shiftKey) {
        event.preventDefault()
        selectRangeTo(type, path)

        return
    }

    if (event.ctrlKey || event.metaKey) {
        const alreadySelected = selected.value[type].includes(path)
        if (!alreadySelected) {
            fm.addToSelection(props.manager, { type, path })
        } else {
            fm.removeFromSelection(props.manager, { type, path })
        }

        return
    }

    fm.changeSelected(props.manager, { type, path })
}

function clearOnEmpty() {
    fm.clearSelection(props.manager)
}

function contextMenu(item, event) {
    const type = item.type === 'dir' ? 'directories' : 'files'
    const alreadySelected = selected.value[type].includes(item.path)

    if (!alreadySelected) {
        fm.changeSelected(props.manager, { type, path: item.path })
    }

    EventBus.emit('contextMenu', event)
}

function handleSelectDirectory(path) {
    selectDirectory(path, true)
}

function handleSortBy(field) {
    sortBy(field, null)
}

function sortIcon(field) {
    if (sortSettings.value.field !== field) return 'sort-desc'

    return sortSettings.value.direction === 'down' ? 'sort-desc' : 'sort-asc'
}

function formatMode(mode) {
    if (typeof mode !== 'number') return '---------'

    const triplet = (bits) => [bits & 0o4 ? 'r' : '-', bits & 0o2 ? 'w' : '-', bits & 0o1 ? 'x' : '-'].join('')

    return triplet((mode >> 6) & 0o7) + triplet((mode >> 3) & 0o7) + triplet(mode & 0o7)
}

function selectAction(file) {
    openFile(file)
}

function moveFocus(delta, withShift) {
    const total = flatVisible.value.length
    if (total === 0) return

    let next = focusedIndex.value + delta
    if (next < 0) next = 0
    if (next > total - 1) next = total - 1
    focusedIndex.value = next

    const item = flatVisible.value[next]
    if (item) {
        if (withShift) {
            selectRangeTo(item.type, item.path)
        }
        nextTick(() => {
            const el = rowEls.get(next)
            if (el) {
                el.scrollIntoView({ block: 'nearest' })
                el.focus({ preventScroll: true })
            }
        })
    }
}

function activateFocused() {
    const item = flatVisible.value[focusedIndex.value]
    if (!item) return

    if (item.type === 'directories') {
        selectDirectory(item.path, true)
    } else {
        const file = files.value.find((f) => f.path === item.path)
        if (file) selectAction(file)
    }
}

function toggleFocused() {
    const item = flatVisible.value[focusedIndex.value]
    if (!item) return

    const alreadySelected = selected.value[item.type].includes(item.path)
    if (alreadySelected) {
        fm.removeFromSelection(props.manager, { type: item.type, path: item.path })
    } else {
        fm.addToSelection(props.manager, { type: item.type, path: item.path })
    }
}

function onKeyDown(event) {
    if (modal.showModal) return

    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault()
            moveFocus(1, event.shiftKey)
            break
        case 'ArrowUp':
            event.preventDefault()
            moveFocus(-1, event.shiftKey)
            break
        case 'Home':
            event.preventDefault()
            moveFocus(-flatVisible.value.length, event.shiftKey)
            break
        case 'End':
            event.preventDefault()
            moveFocus(flatVisible.value.length, event.shiftKey)
            break
        case 'Enter':
            event.preventDefault()
            activateFocused()
            break
        case ' ':
            event.preventDefault()
            toggleFocused()
            break
        default:
            break
    }
}
</script>

<style lang="scss">
.fm-table-area {
    position: relative;
    height: 100%;
    outline: none;

    &:focus-visible {
        box-shadow: inset 0 0 0 2px var(--gameap-selection-outline-weak);
    }
}

.fm-selection-bar {
    position: sticky;
    top: 0;
    z-index: 25;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    background: #1c1917;
    color: #f5f5f4;
    border-bottom: 1px solid #292524;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

    .fm-selection-bar__left {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        min-width: 0;
    }

    .fm-selection-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.5rem;
        height: 1.5rem;
        padding: 0 0.4rem;
        border-radius: 9999px;
        background: #ea580c;
        color: #ffffff;
        font-size: 0.75rem;
        font-weight: 700;
    }

    .fm-selection-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #fafaf9;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .fm-selection-size {
        color: #a8a29e;
        font-size: 0.8rem;
        font-weight: normal;
        margin-left: 0.25rem;
    }

    .fm-selection-bar__actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-shrink: 0;
    }

    .fm-btn-action {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.35rem 0.75rem;
        border-radius: 6px;
        font-size: 0.8125rem;
        font-weight: 500;
        cursor: pointer;
        border: 1px solid transparent;
        transition: all 120ms ease;

        &--zip {
            background: #292524;
            color: #f5f5f4;
            border-color: #44403c;

            &:hover {
                background: #44403c;
                border-color: #78716c;
            }
        }

        &--delete {
            background: rgba(239, 68, 68, 0.15);
            color: #f87171;
            border-color: rgba(239, 68, 68, 0.3);

            &:hover {
                background: #ef4444;
                color: #ffffff;
                border-color: #ef4444;
            }
        }

        &--clear {
            background: transparent;
            color: #a8a29e;

            &:hover {
                background: #292524;
                color: #f5f5f4;
            }
        }
    }
}

.dark .fm-selection-bar {
    background: #0c0a09;
    border-bottom-color: #292524;
}

.fm-slide-fade-enter-active,
.fm-slide-fade-leave-active {
    transition: all 180ms ease;
}

.fm-slide-fade-enter-from,
.fm-slide-fade-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}

.fm-table {
    @apply w-full text-left text-sm;
    border-collapse: separate;
    border-spacing: 0;
    --fm-accent: var(--gameap-stone-800);
    --fm-match-bg: var(--gameap-orange-200);
    --fm-match-text: var(--gameap-orange-900);

    thead th {
        @apply text-left bg-surface text-secondary font-medium;
        position: sticky;
        top: 0;
        z-index: 10;
        cursor: pointer;
        padding: 0.625rem 0.75rem;
        user-select: none;
        border-bottom: 1px solid var(--gameap-border);
        box-shadow: 0 1px 0 0 rgba(0, 0, 0, 0.04);
        transition: color 120ms ease, background-color 120ms ease;

        &:hover {
            @apply bg-stone-100 dark:bg-[color:color-mix(in_srgb,var(--gameap-stone-700)_60%,transparent)];
        }
    }

    .fm-th--check,
    .fm-cell--check {
        width: 44px;
        min-width: 44px;
        max-width: 44px;
        text-align: center;
        padding: 0.5rem 0.5rem;
        vertical-align: middle;
        cursor: pointer;
    }

    .fm-checkbox {
        appearance: none;
        -webkit-appearance: none;
        width: 1.15rem;
        height: 1.15rem;
        border: 1.5px solid var(--gameap-border, #d6d3d1);
        border-radius: 4px;
        background-color: transparent;
        outline: none;
        cursor: pointer;
        vertical-align: middle;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: all 120ms ease;

        &:hover {
            border-color: var(--gameap-stone-500, #78716c);
        }

        &:checked {
            background-color: var(--gameap-stone-900, #1c1917);
            border-color: var(--gameap-stone-900, #1c1917);
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E");
            background-position: center;
            background-repeat: no-repeat;
        }

        &:indeterminate {
            background-color: var(--gameap-stone-900, #1c1917);
            border-color: var(--gameap-stone-900, #1c1917);
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 8h8' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
            background-position: center;
            background-repeat: no-repeat;
        }
    }

    .dark .fm-checkbox {
        border-color: var(--gameap-stone-600, #57534e);

        &:hover {
            border-color: var(--gameap-stone-400, #a8a29e);
        }

        &:checked,
        &:indeterminate {
            background-color: var(--gameap-stone-100, #f5f5f4);
            border-color: var(--gameap-stone-100, #f5f5f4);
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='%231c1917' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E");
        }

        &:indeterminate {
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='%231c1917' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4 8h8' stroke='%231c1917' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
        }
    }

    .fm-skel--check {
        width: 1.15rem;
        height: 1.15rem;
    }

    .fm-th--active {
        @apply text-body font-semibold;
    }

    .fm-th-sort {
        margin-left: 0.4rem;
        font-size: 0.85em;
        transition: opacity 120ms ease;
    }

    .fm-th-sort--inactive {
        opacity: 0;
    }

    thead th:hover .fm-th-sort--inactive {
        opacity: 0.4;
    }

    .fm-th--name { width: 55%; }
    .fm-th--size { width: 10%; }
    .fm-th--type { width: 10%; }
    .fm-th--date { width: 15%; }
    .fm-th--perm { width: 10ch; }

    // Phones: keep check + name + size, the rest returns at >=768px.
    @media (max-width: 767px) {
        th:nth-child(4),
        td:nth-child(4),
        th:nth-child(5),
        td:nth-child(5),
        th:nth-child(6),
        td:nth-child(6) {
            display: none;
        }

        .fm-th--check,
        .fm-cell--check { width: 36px; min-width: 36px; padding: 0.5rem 0.25rem; }
        .fm-th--name { width: 65%; }
        .fm-th--size { width: 35%; }
    }

    td {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding: 0.5rem 0.75rem;
    }

    tr.fm-row {
        cursor: pointer;
        transition: background-color 120ms ease;
        @apply bg-white dark:bg-stone-900;
        // keep scrolled-to rows clear of the sticky thead
        scroll-margin-top: 2.75rem;
        scroll-margin-bottom: 0.25rem;

        &.fm-row--zebra {
            @apply bg-stone-50 dark:bg-stone-800;
        }

        &:hover {
            @apply bg-stone-100 dark:bg-[color:color-mix(in_srgb,var(--gameap-stone-800)_60%,transparent)];
        }

        &.fm-row--zebra:hover {
            @apply bg-stone-100 dark:bg-[color:color-mix(in_srgb,var(--gameap-stone-700)_60%,transparent)];
        }

        &.fm-row--selected,
        &.fm-row--selected.fm-row--zebra {
            @apply bg-stone-200 dark:bg-stone-600;
            box-shadow: inset 3px 0 0 0 var(--fm-accent);
        }

        &.fm-row--selected:hover,
        &.fm-row--selected.fm-row--zebra:hover {
            @apply bg-stone-300 dark:bg-stone-500;
        }

        &.fm-row--focused {
            outline: 2px solid var(--gameap-selection-outline);
            outline-offset: -2px;
        }

    }

    tr.fm-row--up {
        @apply text-muted italic;
    }

    tr.fm-row--hidden {
        @apply text-secondary;
    }

    tr.fm-row--locked {
        @apply text-faint;
    }

    tr.fm-row--empty {
        background: transparent !important;
        cursor: default;
    }

    tr.fm-row--empty:hover {
        background: transparent !important;
    }

    .fm-row-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.5rem;
        height: 1.5rem;
        margin-right: 0.5rem;
        vertical-align: middle;
    }

    .fm-row-glyph--dir {
        @apply text-secondary;
    }

    .fm-row-glyph--file {
        @apply text-faint;
    }

    .fm-row-check {
        @apply text-body;
    }

    .fm-row-name {
        vertical-align: middle;
    }

    .fm-name-match {
        background-color: var(--fm-match-bg);
        color: var(--fm-match-text);
        border-radius: 2px;
        padding: 0 1px;
    }

    .fm-cell-muted {
        @apply text-faint;
    }

    .fm-cell-extension {
        @apply text-muted uppercase tracking-wide;
        font-size: 0.78em;
    }

    .fm-permissions {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.8em;
        @apply text-muted;
    }

    .fm-content-item {
        cursor: pointer;
    }

    .fm-empty {
        @apply flex flex-col items-center justify-center text-center py-12 px-4 text-muted;
    }

    .fm-empty-icon {
        @apply text-5xl text-faint mb-4;
    }

    .fm-empty-icon--error {
        @apply text-danger;
    }

    .fm-empty-title {
        @apply text-base font-medium text-secondary mb-1;
    }

    .fm-empty-hint {
        @apply text-xs text-faint;
    }

    .fm-empty-retry {
        @apply mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-md
               bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900
               text-sm font-medium transition-colors;
    }

    .fm-empty-retry:hover {
        @apply bg-stone-900 dark:bg-stone-100;
    }

    .fm-empty-retry:focus-visible {
        outline: 2px solid var(--gameap-selection-outline);
        outline-offset: 2px;
    }

    tr.fm-row--skeleton,
    tr.fm-row--skeleton:hover,
    tr.fm-row--error,
    tr.fm-row--error:hover {
        background: transparent !important;
        cursor: default;
    }

    .fm-skel {
        display: inline-block;
        background: var(--gameap-stone-200);
        border-radius: 4px;
        vertical-align: middle;
        animation: fm-skel-pulse 1.4s ease-in-out infinite;
    }

    .fm-skel--icon {
        width: 1.1rem;
        height: 1.1rem;
    }

    .fm-skel--name {
        height: 0.85rem;
    }

    .fm-skel--cell {
        height: 0.7rem;
        width: 60%;
    }

    .fm-skel--narrow {
        width: 35%;
    }
}

.dark .fm-table .fm-skel {
    background: var(--gameap-stone-700);
}

.dark .fm-table {
    --fm-accent: var(--gameap-stone-200);
    --fm-match-bg: color-mix(in srgb, var(--gameap-orange-500) 40%, transparent);
    --fm-match-text: var(--gameap-orange-50);
}

@keyframes fm-skel-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.45; }
}
</style>

import { defineStore } from 'pinia'

export const useServerFiltersStore = defineStore('serverFilters', {
    state: () => ({
        searchQuery: '',
        selectedStatus: 'all',
        selectedGame: null,
        selectedIP: null,
    }),
    getters: {
        hasGameFilter: (state) => Array.isArray(state.selectedGame) && state.selectedGame.length > 0,
        hasIPFilter: (state) => Array.isArray(state.selectedIP) && state.selectedIP.length > 0,
        advancedFilterCount() {
            let count = 0
            if (this.hasGameFilter) count += 1
            if (this.hasIPFilter) count += 1
            return count
        },
        hasFilters(state) {
            return (
                Boolean(state.searchQuery && state.searchQuery.trim() !== '') ||
                state.selectedStatus !== 'all' ||
                (Array.isArray(state.selectedGame) && state.selectedGame.length > 0) ||
                (Array.isArray(state.selectedIP) && state.selectedIP.length > 0)
            )
        },
    },
    actions: {
        setSearchQuery(query) {
            this.searchQuery = query ?? ''
        },
        setStatusFilter(status) {
            this.selectedStatus = status || 'all'
        },
        setGameFilter(gameNames) {
            this.selectedGame = gameNames && gameNames.length > 0 ? gameNames : null
        },
        setIPFilter(ips) {
            this.selectedIP = ips && ips.length > 0 ? ips : null
        },
        clearAdvancedFilters() {
            this.selectedGame = null
            this.selectedIP = null
        },
        clearFilters() {
            this.searchQuery = ''
            this.selectedStatus = 'all'
            this.selectedGame = null
            this.selectedIP = null
        },
    },
})

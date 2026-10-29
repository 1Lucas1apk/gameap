import { trans } from '../i18n/i18n'

const serversLinks = [
    {
        icon: 'dashboard',
        get text() {
            return trans('home.main')
        },
        route: { name: 'home' },
    },
    {
        icon: 'server',
        get text() {
            return trans('sidebar.servers')
        },
        route: { name: 'servers' },
    },
]

const adminLinks = [
    {
        icon: 'node',
        get text() {
            return trans('sidebar.dedicated_servers')
        },
        route: { name: 'admin.nodes.index' },
    },
    {
        icon: 'servers',
        get text() {
            return trans('sidebar.game_servers')
        },
        route: { name: 'admin.servers.index' },
    },
    {
        icon: 'gamepad',
        get text() {
            return trans('sidebar.games')
        },
        route: { name: 'admin.games.index' },
    },
    {
        icon: 'users',
        get text() {
            return trans('sidebar.users')
        },
        route: { name: 'admin.users.index' },
    },
    {
        icon: 'plug',
        get text() {
            return trans('plugins.plugins')
        },
        route: { name: 'admin.plugins.index' },
    },
]

export { serversLinks, adminLinks }

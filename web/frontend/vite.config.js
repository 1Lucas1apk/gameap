import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue'
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import { join, resolve } from 'path'
import { closeSync, copyFileSync, mkdirSync, openSync, readFileSync } from 'fs'
import { createHash } from 'crypto'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

const keepGitkeep = () => ({
    name: 'keep-gitkeep',
    closeBundle() {
        closeSync(openSync(resolve(__dirname, '../static/dist/.gitkeep'), 'w'))
    },
})

// Ships packages/gameap-ui/theme.css verbatim as /theme.css (bypassing
// PostCSS/minification) and links it before the app styles. The stable,
// unhashed name is the public theming contract for plugins and operators.
const themeCss = () => {
    const themePath = resolve(__dirname, 'packages/gameap-ui/theme.css')
    const version = () =>
        createHash('sha256').update(readFileSync(themePath)).digest('hex').slice(0, 8)

    return {
        name: 'gameap-theme-css',
        configureServer(server) {
            server.watcher.add(themePath)
            server.watcher.on('change', (file) => {
                if (file === themePath) {
                    server.ws.send({ type: 'full-reload' })
                }
            })
            server.middlewares.use('/theme.css', (req, res) => {
                res.setHeader('Content-Type', 'text/css; charset=utf-8')
                res.setHeader('Cache-Control', 'no-store')
                res.end(readFileSync(themePath))
            })
        },
        generateBundle() {
            this.emitFile({
                type: 'asset',
                fileName: 'theme.css',
                source: readFileSync(themePath, 'utf-8'),
            })
        },
        transformIndexHtml() {
            return [{
                tag: 'link',
                attrs: { rel: 'stylesheet', href: `/theme.css?v=${version()}` },
                injectTo: 'head-prepend',
            }]
        },
    }
}

// With SBOM_PACKAGES_DIR set, copies package.json of every npm package shipped
// in the bundle into that directory, keeping the node_modules layout, for the
// release SBOM. Chunk modules leave out tree-shaken code; CSS and fonts pulled
// in through Sass @import are not modules and show up only as watch files.
const sbomPackages = (dir) => ({
    name: 'gameap-sbom-packages',
    apply: 'build',
    generateBundle(_, bundle) {
        if (!dir) {
            return
        }

        const moduleIds = new Set(this.getModuleIds())
        const files = this.getWatchFiles().filter((file) => !moduleIds.has(file))
        for (const output of Object.values(bundle)) {
            if (output.type === 'chunk') {
                files.push(...Object.keys(output.modules))
            }
        }

        const roots = new Set()
        for (const file of files) {
            const match = /^([^\0]*\/node_modules\/(?:@[^/]+\/)?[^/]+)\//.exec(file)
            if (match) {
                roots.add(match[1])
            }
        }

        for (const root of roots) {
            const target = join(dir, root.slice(root.indexOf('/node_modules/') + 1))
            mkdirSync(target, { recursive: true })
            copyFileSync(join(root, 'package.json'), join(target, 'package.json'))
        }
    },
})

export default defineConfig({
    plugins: [
        viteCommonjs(),
        vue(),
        Components({
            resolvers: [NaiveUiResolver()],
            dts: false,
        }),
        themeCss(),
        keepGitkeep(),
        sbomPackages(process.env.SBOM_PACKAGES_DIR),
    ],
    base: '/',
    publicDir: 'public',
    resolve: {
        alias: {
            '@': resolve(__dirname, 'js'),
            '@gameap/ui': resolve(__dirname, 'packages/gameap-ui'),
        },
    },
    build: {
        outDir: '../static/dist',
        emptyOutDir: true,
        chunkSizeWarningLimit: 500,
        modulePreload: {
            // Disable modulePreload for large chunks that should be truly lazy-loaded
            resolveDependencies: (filename, deps, { hostId, hostType }) => {
                // Don't preload filemanager chunk - it should load only when Files tab is clicked
                return deps.filter(dep => !dep.includes('filemanager'))
            }
        },
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html')
            },
            output: {
                // Merge small chunks to reduce HTTP requests
                experimentalMinChunkSize: 20000, // 20KB minimum chunk size
            }
        },
        cssCodeSplit: true
    },
    server: {
        proxy: {
            '/lang': {
                target: 'http://127.0.0.1:8025',
                changeOrigin: true,
            },
            '/api': {
                target: 'http://127.0.0.1:8025',
                changeOrigin: true,
                ws: true,
            },
            '/plugins.css': {
                target: 'http://127.0.0.1:8025',
                changeOrigin: true,
            },
            '/plugins.js': {
                target: 'http://127.0.0.1:8025',
                changeOrigin: true,
            },
        },
    },
});
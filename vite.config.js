import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

const TEST_BACKUP = '/Tasks-backups/tasks-backup.json'

function serveTestBackup() {
  return {
    name: 'serve-test-backup',
    apply: (config, env) => env.command === 'serve' && config.mode === 'test',
    configureServer(server) {
      server.middlewares.use(TEST_BACKUP, (req, res) => {
        try {
          const text = readFileSync(resolve(TEST_BACKUP.slice(1)), 'utf8')
          res.setHeader('Content-Type', 'application/json')
          res.end(text)
        } catch {
          res.statusCode = 404
          res.end('no test backup found')
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [svelte(), serveTestBackup()],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})

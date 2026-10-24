import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'

if (!existsSync('dist/index.html')) {
  console.error('dist/index.html fehlt - bitte zuerst "pnpm build" ausfuehren.')
  process.exit(1)
}

const prozess = spawn('tsx', ['server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    EL_EASY_CAD_STATISCH: process.env.EL_EASY_CAD_STATISCH ?? 'dist',
    PATH: `node_modules/.bin:${process.env.PATH ?? ''}`,
  },
})

prozess.on('exit', (code) => {
  process.exitCode = code ?? 0
})

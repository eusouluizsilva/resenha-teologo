#!/usr/bin/env node
// Verifica orçamento de tamanho dos bundles JS gerados pelo Vite. Roda no CI
// depois do `npm run build`. Falha se algum chunk crítico ultrapassar o limite
// gzipado, evitando regressões silenciosas de tamanho. Limites foram calibrados
// a partir do baseline de 2026-05-04 com folga de ~15%.
//
// Limites são gzip (representa o que o navegador realmente baixa).
// Para ver os tamanhos atuais: `node scripts/check-bundle-size.mjs --report`.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'

const ASSETS_DIR = 'dist/assets'

// Cada entrada: prefixo do nome do arquivo + limite gzip em bytes.
// O Vite gera nomes como `react-vendor-CVi8Wqs9.js`, batemos pelo prefixo.
const BUDGETS = [
  { prefix: 'index-', label: 'entry (index)', maxGzip: 57_000 },
  { prefix: 'react-vendor-', label: 'react-vendor', maxGzip: 70_000 },
  { prefix: 'convex-', label: 'convex', maxGzip: 60_000 },
  { prefix: 'clerk-', label: 'clerk', maxGzip: 90_000 },
  { prefix: 'framer-motion-', label: 'framer-motion', maxGzip: 50_000 },
  { prefix: 'jspdf.es.min-', label: 'jspdf', maxGzip: 150_000 },
  { prefix: 'html2canvas-', label: 'html2canvas', maxGzip: 60_000 },
]

// Limite total dos JS no carregamento inicial (entry + react-vendor + convex
// + clerk). Heurístico, garante que não inflemos a rota /.
const INITIAL_LOAD_PREFIXES = ['index-', 'react-vendor-', 'convex-', 'clerk-']
const INITIAL_LOAD_MAX_GZIP = 240_000

const reportOnly = process.argv.includes('--report')

function fmt(bytes) {
  if (bytes < 1024) return `${bytes}B`
  return `${(bytes / 1024).toFixed(1)}KB`
}

function gzipSize(file) {
  const buf = readFileSync(file)
  return gzipSync(buf, { level: 9 }).length
}

let dirEntries
try {
  dirEntries = readdirSync(ASSETS_DIR)
} catch (err) {
  console.error(`[bundle-size] não encontrei ${ASSETS_DIR}. Rode \`npm run build\` antes.`)
  process.exit(1)
}

const jsFiles = dirEntries
  .filter((f) => f.endsWith('.js'))
  .map((f) => ({ name: f, full: join(ASSETS_DIR, f), size: statSync(join(ASSETS_DIR, f)).size }))

let failed = false
const matched = []

for (const budget of BUDGETS) {
  const file = jsFiles.find((f) => f.name.startsWith(budget.prefix))
  if (!file) {
    if (reportOnly) console.log(`  ${budget.label}: NOT FOUND`)
    continue
  }
  const gz = gzipSize(file.full)
  matched.push({ ...budget, file: file.name, raw: file.size, gz })
  if (gz > budget.maxGzip) {
    failed = true
    console.error(
      `[bundle-size] EXCEDIDO ${budget.label}: ${fmt(gz)} gzip > ${fmt(budget.maxGzip)} (${file.name})`,
    )
  } else if (reportOnly) {
    console.log(
      `  ${budget.label.padEnd(22)} ${fmt(gz).padStart(8)} gzip / ${fmt(file.size).padStart(8)} raw  (limite ${fmt(budget.maxGzip)})`,
    )
  }
}

const initialFiles = jsFiles.filter((f) => INITIAL_LOAD_PREFIXES.some((p) => f.name.startsWith(p)))
const initialGzipTotal = initialFiles.reduce((acc, f) => acc + gzipSize(f.full), 0)
if (initialGzipTotal > INITIAL_LOAD_MAX_GZIP) {
  failed = true
  console.error(
    `[bundle-size] EXCEDIDO carga inicial total: ${fmt(initialGzipTotal)} gzip > ${fmt(INITIAL_LOAD_MAX_GZIP)}`,
  )
} else if (reportOnly) {
  console.log(
    `  carga inicial total   ${fmt(initialGzipTotal).padStart(8)} gzip                      (limite ${fmt(INITIAL_LOAD_MAX_GZIP)})`,
  )
}

if (failed) {
  console.error('\n[bundle-size] FALHOU. Investigue regressões de tamanho ou ajuste o orçamento se a mudança for proposital.')
  process.exit(1)
}

if (!reportOnly) {
  console.log(`[bundle-size] OK. ${matched.length} chunks dentro do orçamento. Carga inicial: ${fmt(initialGzipTotal)} gzip.`)
}

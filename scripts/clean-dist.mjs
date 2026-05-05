#!/usr/bin/env node
import { rmSync } from 'node:fs'

rmSync('dist', { recursive: true, force: true })
console.log('[clean-dist] dist/ removido antes do build')

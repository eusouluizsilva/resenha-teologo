// Fontes bíblicas disponíveis na plataforma. Esta não é uma lista plana de
// "traduções": grego e hebraico são textos originais, restritas ao testamento
// correspondente. O seletor do aluno e o painel do criador devem filtrar pela
// compatibilidade de testamento antes de oferecer a opção.

import type { BibleTestament } from './books'

export type BibleSourceKind = 'original' | 'translation'

export type BibleSource = {
  id: string
  label: string
  name: string
  kind: BibleSourceKind
  language: 'grc' | 'hbo' | 'pt-BR'
  testaments: BibleTestament[]
  // Código que o BibleGateway aceita no parâmetro `version` da URL. Para
  // originais, usamos SBLGNT (grego) e WLC (hebraico). Para traduções
  // portuguesas, o próprio label funciona (NVI, NAA, NVT, ARA).
  bibleGatewayVersion: string
}

export const BIBLE_SOURCES: BibleSource[] = [
  {
    id: 'grego',
    label: 'Grego',
    name: 'Grego original (SBL Greek New Testament)',
    kind: 'original',
    language: 'grc',
    testaments: ['new'],
    bibleGatewayVersion: 'SBLGNT',
  },
  {
    id: 'hebraico',
    label: 'Hebraico',
    name: 'Hebraico original (Westminster Leningrad Codex)',
    kind: 'original',
    language: 'hbo',
    testaments: ['old'],
    bibleGatewayVersion: 'WLC',
  },
  {
    id: 'nvi',
    label: 'NVI',
    name: 'Nova Versão Internacional',
    kind: 'translation',
    language: 'pt-BR',
    testaments: ['old', 'new'],
    bibleGatewayVersion: 'NVI-PT',
  },
  {
    id: 'naa',
    label: 'NAA',
    name: 'Nova Almeida Atualizada',
    kind: 'translation',
    language: 'pt-BR',
    testaments: ['old', 'new'],
    bibleGatewayVersion: 'NAA',
  },
  {
    id: 'nvt',
    label: 'NVT',
    name: 'Nova Versão Transformadora',
    kind: 'translation',
    language: 'pt-BR',
    testaments: ['old', 'new'],
    bibleGatewayVersion: 'NVT',
  },
  {
    id: 'ara',
    label: 'ARA',
    name: 'Almeida Revista e Atualizada',
    kind: 'translation',
    language: 'pt-BR',
    testaments: ['old', 'new'],
    bibleGatewayVersion: 'ARA',
  },
]

export const DEFAULT_BIBLE_SOURCE_ID = 'ara'

export function getBibleSource(id: string): BibleSource | null {
  return BIBLE_SOURCES.find((s) => s.id === id) ?? null
}

export function sourcesForTestament(testament: BibleTestament): BibleSource[] {
  return BIBLE_SOURCES.filter((s) => s.testaments.includes(testament))
}

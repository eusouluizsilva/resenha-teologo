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
  // Código que a API do Bolls.life aceita. Quando ausente, o painel lateral
  // bíblico cai pra link externo. Bolls cobre PT, EN, originais, e mais.
  bollsCode?: string
}

export const BIBLE_SOURCES: BibleSource[] = [
  {
    id: 'grego',
    label: 'Grego',
    name: 'Grego original (Tischendorf 8ª ed., texto crítico do NT)',
    kind: 'original',
    language: 'grc',
    testaments: ['new'],
    bibleGatewayVersion: 'SBLGNT',
    bollsCode: 'TISCH',
  },
  {
    id: 'hebraico',
    label: 'Hebraico',
    name: 'Hebraico original (Westminster Leningrad Codex)',
    kind: 'original',
    language: 'hbo',
    testaments: ['old'],
    bibleGatewayVersion: 'WLC',
    bollsCode: 'WLC',
  },
  {
    id: 'ara',
    label: 'ARA',
    name: 'Almeida Revista e Atualizada',
    kind: 'translation',
    language: 'pt-BR',
    testaments: ['old', 'new'],
    bibleGatewayVersion: 'ARA',
    bollsCode: 'ARA',
  },
  {
    id: 'naa',
    label: 'NAA',
    name: 'Nova Almeida Atualizada',
    kind: 'translation',
    language: 'pt-BR',
    testaments: ['old', 'new'],
    bibleGatewayVersion: 'NAA',
    bollsCode: 'NAA',
  },
  {
    id: 'arc',
    label: 'ARC',
    name: 'Almeida Revista e Corrigida',
    kind: 'translation',
    language: 'pt-BR',
    testaments: ['old', 'new'],
    bibleGatewayVersion: 'ARC',
    bollsCode: 'ARC09',
  },
  {
    id: 'acf',
    label: 'ACF',
    name: 'Almeida Corrigida e Fiel',
    kind: 'translation',
    language: 'pt-BR',
    testaments: ['old', 'new'],
    bibleGatewayVersion: 'ACF',
    bollsCode: 'ACF11',
  },
  {
    id: 'a21',
    label: 'A21',
    name: 'Almeida Século 21',
    kind: 'translation',
    language: 'pt-BR',
    testaments: ['old', 'new'],
    bibleGatewayVersion: 'A21',
    bollsCode: 'ALM21',
  },
  {
    id: 'nvi',
    label: 'NVI',
    name: 'Nova Versão Internacional',
    kind: 'translation',
    language: 'pt-BR',
    testaments: ['old', 'new'],
    bibleGatewayVersion: 'NVI-PT',
    bollsCode: 'NVIPT',
  },
  {
    id: 'nvt',
    label: 'NVT',
    name: 'Nova Versão Transformadora',
    kind: 'translation',
    language: 'pt-BR',
    testaments: ['old', 'new'],
    bibleGatewayVersion: 'NVT',
    bollsCode: 'NVT',
  },
  {
    id: 'ntlh',
    label: 'NTLH',
    name: 'Nova Tradução na Linguagem de Hoje',
    kind: 'translation',
    language: 'pt-BR',
    testaments: ['old', 'new'],
    bibleGatewayVersion: 'NTLH',
    bollsCode: 'NTLH',
  },
  {
    id: 'kja',
    label: 'KJA',
    name: 'King James Atualizada',
    kind: 'translation',
    language: 'pt-BR',
    testaments: ['old', 'new'],
    bibleGatewayVersion: 'KJA',
    bollsCode: 'KJA',
  },
]

export const DEFAULT_BIBLE_SOURCE_ID = 'ara'

export function getBibleSource(id: string): BibleSource | null {
  return BIBLE_SOURCES.find((s) => s.id === id) ?? null
}

export function sourcesForTestament(testament: BibleTestament): BibleSource[] {
  return BIBLE_SOURCES.filter((s) => s.testaments.includes(testament))
}

// Referência canônica dos 66 livros da Bíblia.
// Usado pelo seletor de versículos do criador e pela renderização de versículos
// para o aluno. Slug é ascii, lowercase, estável: serve como chave no banco e
// como identificador em futura integração com APIs de tradução.

export type BibleTestament = 'old' | 'new'

export type BibleBook = {
  slug: string
  name: string
  abbrev: string
  testament: BibleTestament
  chapters: number
}

export const BIBLE_BOOKS: BibleBook[] = [
  { slug: 'genesis', name: 'Gênesis', abbrev: 'Gn', testament: 'old', chapters: 50 },
  { slug: 'exodo', name: 'Êxodo', abbrev: 'Ex', testament: 'old', chapters: 40 },
  { slug: 'levitico', name: 'Levítico', abbrev: 'Lv', testament: 'old', chapters: 27 },
  { slug: 'numeros', name: 'Números', abbrev: 'Nm', testament: 'old', chapters: 36 },
  { slug: 'deuteronomio', name: 'Deuteronômio', abbrev: 'Dt', testament: 'old', chapters: 34 },
  { slug: 'josue', name: 'Josué', abbrev: 'Js', testament: 'old', chapters: 24 },
  { slug: 'juizes', name: 'Juízes', abbrev: 'Jz', testament: 'old', chapters: 21 },
  { slug: 'rute', name: 'Rute', abbrev: 'Rt', testament: 'old', chapters: 4 },
  { slug: '1-samuel', name: '1 Samuel', abbrev: '1Sm', testament: 'old', chapters: 31 },
  { slug: '2-samuel', name: '2 Samuel', abbrev: '2Sm', testament: 'old', chapters: 24 },
  { slug: '1-reis', name: '1 Reis', abbrev: '1Rs', testament: 'old', chapters: 22 },
  { slug: '2-reis', name: '2 Reis', abbrev: '2Rs', testament: 'old', chapters: 25 },
  { slug: '1-cronicas', name: '1 Crônicas', abbrev: '1Cr', testament: 'old', chapters: 29 },
  { slug: '2-cronicas', name: '2 Crônicas', abbrev: '2Cr', testament: 'old', chapters: 36 },
  { slug: 'esdras', name: 'Esdras', abbrev: 'Ed', testament: 'old', chapters: 10 },
  { slug: 'neemias', name: 'Neemias', abbrev: 'Ne', testament: 'old', chapters: 13 },
  { slug: 'ester', name: 'Ester', abbrev: 'Et', testament: 'old', chapters: 10 },
  { slug: 'jo', name: 'Jó', abbrev: 'Jó', testament: 'old', chapters: 42 },
  { slug: 'salmos', name: 'Salmos', abbrev: 'Sl', testament: 'old', chapters: 150 },
  { slug: 'proverbios', name: 'Provérbios', abbrev: 'Pv', testament: 'old', chapters: 31 },
  { slug: 'eclesiastes', name: 'Eclesiastes', abbrev: 'Ec', testament: 'old', chapters: 12 },
  { slug: 'cantares', name: 'Cantares de Salomão', abbrev: 'Ct', testament: 'old', chapters: 8 },
  { slug: 'isaias', name: 'Isaías', abbrev: 'Is', testament: 'old', chapters: 66 },
  { slug: 'jeremias', name: 'Jeremias', abbrev: 'Jr', testament: 'old', chapters: 52 },
  { slug: 'lamentacoes', name: 'Lamentações', abbrev: 'Lm', testament: 'old', chapters: 5 },
  { slug: 'ezequiel', name: 'Ezequiel', abbrev: 'Ez', testament: 'old', chapters: 48 },
  { slug: 'daniel', name: 'Daniel', abbrev: 'Dn', testament: 'old', chapters: 12 },
  { slug: 'oseias', name: 'Oséias', abbrev: 'Os', testament: 'old', chapters: 14 },
  { slug: 'joel', name: 'Joel', abbrev: 'Jl', testament: 'old', chapters: 3 },
  { slug: 'amos', name: 'Amós', abbrev: 'Am', testament: 'old', chapters: 9 },
  { slug: 'obadias', name: 'Obadias', abbrev: 'Ob', testament: 'old', chapters: 1 },
  { slug: 'jonas', name: 'Jonas', abbrev: 'Jn', testament: 'old', chapters: 4 },
  { slug: 'miqueias', name: 'Miquéias', abbrev: 'Mq', testament: 'old', chapters: 7 },
  { slug: 'naum', name: 'Naum', abbrev: 'Na', testament: 'old', chapters: 3 },
  { slug: 'habacuque', name: 'Habacuque', abbrev: 'Hc', testament: 'old', chapters: 3 },
  { slug: 'sofonias', name: 'Sofonias', abbrev: 'Sf', testament: 'old', chapters: 3 },
  { slug: 'ageu', name: 'Ageu', abbrev: 'Ag', testament: 'old', chapters: 2 },
  { slug: 'zacarias', name: 'Zacarias', abbrev: 'Zc', testament: 'old', chapters: 14 },
  { slug: 'malaquias', name: 'Malaquias', abbrev: 'Ml', testament: 'old', chapters: 4 },

  { slug: 'mateus', name: 'Mateus', abbrev: 'Mt', testament: 'new', chapters: 28 },
  { slug: 'marcos', name: 'Marcos', abbrev: 'Mc', testament: 'new', chapters: 16 },
  { slug: 'lucas', name: 'Lucas', abbrev: 'Lc', testament: 'new', chapters: 24 },
  { slug: 'joao', name: 'João', abbrev: 'Jo', testament: 'new', chapters: 21 },
  { slug: 'atos', name: 'Atos', abbrev: 'At', testament: 'new', chapters: 28 },
  { slug: 'romanos', name: 'Romanos', abbrev: 'Rm', testament: 'new', chapters: 16 },
  { slug: '1-corintios', name: '1 Coríntios', abbrev: '1Co', testament: 'new', chapters: 16 },
  { slug: '2-corintios', name: '2 Coríntios', abbrev: '2Co', testament: 'new', chapters: 13 },
  { slug: 'galatas', name: 'Gálatas', abbrev: 'Gl', testament: 'new', chapters: 6 },
  { slug: 'efesios', name: 'Efésios', abbrev: 'Ef', testament: 'new', chapters: 6 },
  { slug: 'filipenses', name: 'Filipenses', abbrev: 'Fp', testament: 'new', chapters: 4 },
  { slug: 'colossenses', name: 'Colossenses', abbrev: 'Cl', testament: 'new', chapters: 4 },
  { slug: '1-tessalonicenses', name: '1 Tessalonicenses', abbrev: '1Ts', testament: 'new', chapters: 5 },
  { slug: '2-tessalonicenses', name: '2 Tessalonicenses', abbrev: '2Ts', testament: 'new', chapters: 3 },
  { slug: '1-timoteo', name: '1 Timóteo', abbrev: '1Tm', testament: 'new', chapters: 6 },
  { slug: '2-timoteo', name: '2 Timóteo', abbrev: '2Tm', testament: 'new', chapters: 4 },
  { slug: 'tito', name: 'Tito', abbrev: 'Tt', testament: 'new', chapters: 3 },
  { slug: 'filemom', name: 'Filemom', abbrev: 'Fm', testament: 'new', chapters: 1 },
  { slug: 'hebreus', name: 'Hebreus', abbrev: 'Hb', testament: 'new', chapters: 13 },
  { slug: 'tiago', name: 'Tiago', abbrev: 'Tg', testament: 'new', chapters: 5 },
  { slug: '1-pedro', name: '1 Pedro', abbrev: '1Pe', testament: 'new', chapters: 5 },
  { slug: '2-pedro', name: '2 Pedro', abbrev: '2Pe', testament: 'new', chapters: 3 },
  { slug: '1-joao', name: '1 João', abbrev: '1Jo', testament: 'new', chapters: 5 },
  { slug: '2-joao', name: '2 João', abbrev: '2Jo', testament: 'new', chapters: 1 },
  { slug: '3-joao', name: '3 João', abbrev: '3Jo', testament: 'new', chapters: 1 },
  { slug: 'judas', name: 'Judas', abbrev: 'Jd', testament: 'new', chapters: 1 },
  { slug: 'apocalipse', name: 'Apocalipse', abbrev: 'Ap', testament: 'new', chapters: 22 },
]

const BY_SLUG = new Map(BIBLE_BOOKS.map((b) => [b.slug, b]))

export function getBibleBook(slug: string): BibleBook | null {
  return BY_SLUG.get(slug) ?? null
}

export function isValidBibleBookSlug(slug: string): boolean {
  return BY_SLUG.has(slug)
}

// Número canônico do livro (1=Gênesis, 40=Mateus, 66=Apocalipse). Compatível com
// a numeração que a API Bolls.life e a maioria dos serviços bíblicos usam.
export function getCanonicalBookNumber(slug: string): number | null {
  const idx = BIBLE_BOOKS.findIndex((b) => b.slug === slug)
  return idx >= 0 ? idx + 1 : null
}

export function formatVerseReference(ref: {
  bookSlug: string
  chapter: number
  verseStart: number
  verseEnd: number
}): string {
  const book = getBibleBook(ref.bookSlug)
  const name = book?.name ?? ref.bookSlug
  if (ref.verseStart === ref.verseEnd) {
    return `${name} ${ref.chapter}:${ref.verseStart}`
  }
  return `${name} ${ref.chapter}:${ref.verseStart}-${ref.verseEnd}`
}

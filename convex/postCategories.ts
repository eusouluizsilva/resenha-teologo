// Categorias do blog. Slug é a chave estável usada em URLs e em
// posts.categorySlug. Lista é pública (sem auth). seedDefaults é chamado uma
// única vez via Convex Dashboard (`npx convex run postCategories:seedDefaults`)
// para popular a base inicial; idempotente: pula categorias já existentes.

import { query, internalMutation } from './_generated/server'

const DEFAULT_CATEGORIES = [
  { slug: 'biblia', name: 'Bíblia', description: 'Estudos exegéticos e leitura bíblica.', order: 1 },
  { slug: 'teologia-sistematica', name: 'Teologia Sistemática', description: 'Doutrina cristã organizada por temas.', order: 2 },
  { slug: 'historia-da-igreja', name: 'História da Igreja', description: 'Da igreja primitiva aos dias atuais.', order: 3 },
  { slug: 'vida-crista', name: 'Vida Cristã', description: 'Discipulado, espiritualidade e prática.', order: 4 },
  { slug: 'apologetica', name: 'Apologética', description: 'Defesa razoável da fé cristã.', order: 5 },
] as const

export const list = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('postCategories').collect()
    return all
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((c) => ({
        slug: c.slug,
        name: c.name,
        description: c.description,
        order: c.order,
      }))
  },
})

export const seedDefaults = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const cat of DEFAULT_CATEGORIES) {
      const existing = await ctx.db
        .query('postCategories')
        .withIndex('by_slug', (q) => q.eq('slug', cat.slug))
        .unique()
      if (existing) continue
      await ctx.db.insert('postCategories', { ...cat })
    }
  },
})

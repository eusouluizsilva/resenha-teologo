// Categorias do blog. Slug é a chave estável usada em URLs e em
// posts.categorySlug. Lista é pública (sem auth). seedDefaults é chamado uma
// única vez via Convex Dashboard (`npx convex run postCategories:seedDefaults`)
// para popular a base inicial; idempotente: pula categorias já existentes.

import { query, internalMutation } from './_generated/server'

const DEFAULT_CATEGORIES = [
  { slug: 'biblia', name: 'Bíblia', description: 'Estudos exegéticos e leitura bíblica.', order: 1 },
  { slug: 'hermeneutica', name: 'Hermenêutica', description: 'Princípios e métodos de interpretação bíblica.', order: 2 },
  { slug: 'arqueologia-biblica', name: 'Arqueologia Bíblica', description: 'Achados, lugares e cultura material do mundo bíblico.', order: 3 },
  { slug: 'teologia-biblica', name: 'Teologia Bíblica', description: 'Linha teológica de cada livro e da história da redenção.', order: 4 },
  { slug: 'teologia-sistematica', name: 'Teologia Sistemática', description: 'Doutrina cristã organizada por temas.', order: 5 },
  { slug: 'cristologia', name: 'Cristologia', description: 'Pessoa e obra de Jesus Cristo.', order: 6 },
  { slug: 'pneumatologia', name: 'Pneumatologia', description: 'Pessoa e obra do Espírito Santo.', order: 7 },
  { slug: 'soteriologia', name: 'Soteriologia', description: 'A doutrina da salvação.', order: 8 },
  { slug: 'eclesiologia', name: 'Eclesiologia', description: 'A natureza, missão e governo da Igreja.', order: 9 },
  { slug: 'escatologia', name: 'Escatologia', description: 'As últimas coisas e a esperança cristã.', order: 10 },
  { slug: 'apologetica', name: 'Apologética', description: 'Defesa razoável da fé cristã.', order: 11 },
  { slug: 'historia-da-igreja', name: 'História da Igreja', description: 'Da igreja primitiva aos dias atuais.', order: 12 },
  { slug: 'patristica', name: 'Patrística', description: 'Pais da Igreja, concílios e teologia dos primeiros séculos.', order: 13 },
  { slug: 'reforma', name: 'Reforma Protestante', description: 'Século XVI: doutrina, contexto e legado.', order: 14 },
  { slug: 'linguas-originais', name: 'Línguas Originais', description: 'Hebraico, aramaico e grego bíblico aplicados ao texto.', order: 15 },
  { slug: 'etica-crista', name: 'Ética Cristã', description: 'Decisão moral à luz das Escrituras.', order: 16 },
  { slug: 'cosmovisao-crista', name: 'Cosmovisão Cristã', description: 'Fé cristã em diálogo com cultura, ciência e sociedade.', order: 17 },
  { slug: 'missoes', name: 'Missões', description: 'Missiologia, evangelismo e plantação de igrejas.', order: 18 },
  { slug: 'pastoral', name: 'Teologia Pastoral', description: 'Pregação, aconselhamento e vida ministerial.', order: 19 },
  { slug: 'educacao-crista', name: 'Educação Cristã', description: 'Discipulado, formação e ensino na igreja.', order: 20 },
  { slug: 'familia-crista', name: 'Família Cristã', description: 'Casamento, paternidade e lar à luz da Escritura.', order: 21 },
  { slug: 'vida-crista', name: 'Vida Cristã', description: 'Espiritualidade, devoção e prática diária.', order: 22 },
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

// Seed idempotente: insere categorias novas e atualiza nome/descricao/order
// das ja existentes para refletir mudancas de DEFAULT_CATEGORIES sem precisar
// apagar a tabela.
export const seedDefaults = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const cat of DEFAULT_CATEGORIES) {
      const existing = await ctx.db
        .query('postCategories')
        .withIndex('by_slug', (q) => q.eq('slug', cat.slug))
        .unique()
      if (existing) {
        await ctx.db.patch(existing._id, {
          name: cat.name,
          description: cat.description,
          order: cat.order,
        })
        continue
      }
      await ctx.db.insert('postCategories', { ...cat })
    }
  },
})

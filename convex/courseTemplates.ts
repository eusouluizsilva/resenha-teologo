import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { requireUserFunction } from './lib/auth'

// Templates de descricao para curso e aula. Existem dois tipos:
// - Templates do sistema (creatorId undefined): visiveis para todos os
//   criadores. Definidos em SYSTEM_TEMPLATES abaixo, retornados como
//   sintetico (id null) sem persistir no DB.
// - Templates pessoais do criador: gravados em courseTemplates com seu
//   creatorId. So o proprio criador ve.

const KIND_VALIDATOR = v.union(
  v.literal('course_description'),
  v.literal('lesson_description'),
)

const MAX_TITLE = 80
const MAX_BODY = 4000

const SYSTEM_TEMPLATES = [
  {
    kind: 'course_description' as const,
    title: 'Curso de fundamentos teológicos',
    body: `Neste curso você vai descobrir os pilares fundamentais que sustentam a fé cristã, com base na Escritura e na tradição reformada.

O que você vai aprender:
- Como ler e interpretar a Bíblia em seu contexto histórico-gramatical.
- As principais doutrinas: Deus, Cristo, Espírito Santo, Salvação, Igreja.
- Como aplicar a teologia no dia a dia, na família e no ministério.

Para quem é:
Cristãos que querem aprofundar seu conhecimento bíblico, líderes em formação e qualquer pessoa que deseje pensar a fé com seriedade e reverência.

Pré-requisitos:
Nenhum. Apenas vontade de estudar e Bíblia em mãos.`,
  },
  {
    kind: 'course_description' as const,
    title: 'Curso de exposição bíblica (livro)',
    body: `Estudo expositivo do livro de [NOME DO LIVRO], capítulo por capítulo.

O que você vai aprender:
- Contexto histórico, autoria e propósito do livro.
- Estrutura literária e principais temas teológicos.
- Aplicação prática para a vida do cristão hoje.

Metodologia:
Cada aula trata de uma porção específica do texto, partindo da observação do texto, passando pela interpretação e chegando na aplicação.

Para quem é:
Cristãos que desejam estudar a Bíblia com profundidade, preparar pregações ou conduzir grupos de estudo.`,
  },
  {
    kind: 'course_description' as const,
    title: 'Curso devocional / formação cristã',
    body: `Um percurso de formação cristã para fortalecer sua caminhada com Deus no cotidiano.

O que você vai aprender:
- Disciplinas espirituais clássicas: oração, meditação, jejum, leitura bíblica.
- Como cultivar uma vida devocional sólida sem cair no legalismo.
- Princípios bíblicos para enfrentar provas, ansiedade e conflitos.

Para quem é:
Cristãos em qualquer estágio que querem caminhar com mais consistência e profundidade.`,
  },
  {
    kind: 'lesson_description' as const,
    title: 'Aula expositiva (introdução + tópicos + aplicação)',
    body: `Nesta aula vamos estudar [TEMA DA AULA].

Pontos abordados:
1. Contexto e introdução ao tema.
2. Análise do texto bíblico de referência.
3. Implicações teológicas.
4. Aplicação prática para a vida do cristão.

Texto base: [Referência bíblica]
Tempo estimado: [X minutos]`,
  },
  {
    kind: 'lesson_description' as const,
    title: 'Aula doutrinária (definição + base + objeções)',
    body: `Nesta aula você vai compreender a doutrina de [DOUTRINA].

Estrutura da aula:
- Definição: o que a Escritura ensina sobre o tema.
- Base bíblica: principais textos.
- Confissões históricas: como a Igreja entendeu ao longo dos séculos.
- Objeções comuns e como responder.
- Aplicação para a vida cristã.`,
  },
  {
    kind: 'lesson_description' as const,
    title: 'Aula prática / devocional curta',
    body: `Aula curta com foco em aplicação imediata para sua vida espiritual.

O que você vai levar desta aula:
- Um princípio bíblico claro.
- Um exemplo concreto.
- Um desafio para a próxima semana.

Texto base: [Referência bíblica]`,
  },
]

export const list = query({
  args: { kind: KIND_VALIDATOR },
  handler: async (ctx, { kind }) => {
    const identity = await ctx.auth.getUserIdentity()
    const personal = identity
      ? await ctx.db
          .query('courseTemplates')
          .withIndex('by_creatorId', (q) => q.eq('creatorId', identity.subject))
          .collect()
      : []

    const personalForKind = personal
      .filter((t) => t.kind === kind)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((t) => ({
        _id: t._id as string,
        kind: t.kind,
        title: t.title,
        body: t.body,
        isSystem: false as const,
      }))

    const system = SYSTEM_TEMPLATES.filter((t) => t.kind === kind).map(
      (t, i) => ({
        _id: `system:${kind}:${i}`,
        kind: t.kind,
        title: t.title,
        body: t.body,
        isSystem: true as const,
      }),
    )

    return [...personalForKind, ...system]
  },
})

export const create = mutation({
  args: {
    kind: KIND_VALIDATOR,
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, { kind, title, body }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    const safeTitle = title.trim().slice(0, MAX_TITLE)
    const safeBody = body.trim().slice(0, MAX_BODY)
    if (!safeTitle) throw new Error('Título obrigatório')
    if (!safeBody) throw new Error('Conteúdo obrigatório')
    return await ctx.db.insert('courseTemplates', {
      creatorId: identity.subject,
      kind,
      title: safeTitle,
      body: safeBody,
      createdAt: Date.now(),
    })
  },
})

export const remove = mutation({
  args: { id: v.id('courseTemplates') },
  handler: async (ctx, { id }) => {
    const { identity } = await requireUserFunction(ctx, ['criador'])
    const tpl = await ctx.db.get(id)
    if (!tpl) throw new Error('Template não encontrado')
    if (tpl.creatorId !== identity.subject) throw new Error('Não autorizado')
    await ctx.db.delete(id)
  },
})

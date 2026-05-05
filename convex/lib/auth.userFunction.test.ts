import { describe, it, expect } from 'vitest'
import { requireUserFunction } from './auth'

// Cobre o gating de requireUserFunction sem depender de convex-test:
// montamos um ctx minimo que devolve identity, user (perfil legado) e
// userFunctions (sistema atual), exercitando todos os caminhos de autorizacao.

type FakeRecord = { function: string }

function makeCtx(opts: {
  subject: string
  user: { _id: string; perfil: string } | null
  functions: FakeRecord[]
}) {
  const userRow = opts.user
    ? { _id: opts.user._id, clerkId: opts.subject, perfil: opts.user.perfil }
    : null

  return {
    auth: {
      getUserIdentity: async () => ({ subject: opts.subject }),
    },
    db: {
      query(tableName: string) {
        if (tableName === 'users') {
          return {
            withIndex: () => ({
              unique: async () => userRow,
            }),
          }
        }
        if (tableName === 'userFunctions') {
          return {
            withIndex: () => ({
              collect: async () => opts.functions,
            }),
          }
        }
        throw new Error(`unexpected table ${tableName}`)
      },
    },
  } as unknown as Parameters<typeof requireUserFunction>[0]
}

describe('requireUserFunction', () => {
  it('autoriza via tabela userFunctions', async () => {
    const ctx = makeCtx({
      subject: 'user_1',
      user: { _id: 'u1', perfil: 'aluno' },
      functions: [{ function: 'criador' }],
    })
    const out = await requireUserFunction(ctx, ['criador'])
    expect(out.identity.subject).toBe('user_1')
  })

  it('autoriza via fallback users.perfil quando userFunctions vazio', async () => {
    const ctx = makeCtx({
      subject: 'user_2',
      user: { _id: 'u2', perfil: 'instituicao' },
      functions: [],
    })
    const out = await requireUserFunction(ctx, ['instituicao'])
    expect(out.user.perfil).toBe('instituicao')
  })

  it('rejeita quando a funcao pedida nao bate em nenhum sistema', async () => {
    const ctx = makeCtx({
      subject: 'user_3',
      user: { _id: 'u3', perfil: 'aluno' },
      functions: [{ function: 'aluno' }],
    })
    await expect(requireUserFunction(ctx, ['criador'])).rejects.toThrow('Função não ativa')
  })

  it('aceita qualquer uma das funcoes pedidas (OR logico)', async () => {
    const ctx = makeCtx({
      subject: 'user_4',
      user: { _id: 'u4', perfil: 'aluno' },
      functions: [{ function: 'criador' }],
    })
    await expect(requireUserFunction(ctx, ['admin', 'criador'])).resolves.toBeDefined()
  })

  it('lanca quando o usuario nao existe no banco', async () => {
    const ctx = makeCtx({
      subject: 'user_orphan',
      user: null,
      functions: [],
    })
    await expect(requireUserFunction(ctx, ['aluno'])).rejects.toThrow('Usuário não encontrado')
  })
})

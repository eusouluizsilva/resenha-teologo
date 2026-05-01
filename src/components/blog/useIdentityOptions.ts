// Hook que enumera as identidades disponíveis para o usuário publicar como
// (aluno, criador, instituição-dono/admin). Lê userFunctions e
// institutions.listByUser. Extraído de IdentitySelector para satisfazer
// react-refresh/only-export-components.

import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'

export type AuthorIdentity = 'aluno' | 'criador' | 'instituicao'

export type IdentityValue = {
  identity: AuthorIdentity
  institutionId?: Id<'institutions'>
}

export type IdentityOption = {
  key: string
  identity: AuthorIdentity
  institutionId?: Id<'institutions'>
  label: string
  hint: string
}

function functionLabel(fn: 'aluno' | 'criador'): { label: string; hint: string } {
  if (fn === 'criador') {
    return {
      label: 'Como Professor',
      hint: 'Publica em seu nome com identidade de docente.',
    }
  }
  return {
    label: 'Como Aluno',
    hint: 'Publica em seu nome com identidade de leitor da plataforma.',
  }
}

export function useIdentityOptions(): {
  options: IdentityOption[]
  isLoading: boolean
} {
  const userFunctions = useQuery(api.userFunctions.listByUser, {})
  const institutions = useQuery(api.institutions.listByUser, {})

  const isLoading = userFunctions === undefined || institutions === undefined
  if (isLoading) return { options: [], isLoading }

  const options: IdentityOption[] = []

  for (const fn of userFunctions ?? []) {
    if (fn.function !== 'aluno' && fn.function !== 'criador') continue
    const meta = functionLabel(fn.function)
    options.push({
      key: fn.function,
      identity: fn.function,
      label: meta.label,
      hint: meta.hint,
    })
  }

  for (const inst of institutions ?? []) {
    if (inst.memberRole !== 'dono' && inst.memberRole !== 'admin') continue
    options.push({
      key: `instituicao:${inst._id}`,
      identity: 'instituicao',
      institutionId: inst._id as Id<'institutions'>,
      label: `Como ${inst.name}`,
      hint: 'Publica em nome desta instituição.',
    })
  }

  return { options, isLoading: false }
}

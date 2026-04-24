type ClerkLikeError = { errors?: Array<{ code?: string; message?: string }> }

export function clerkErrorMessage(err: unknown): string {
  const errors = (err as ClerkLikeError | null | undefined)?.errors
  if (!errors?.length) return 'Ocorreu um erro. Tente novamente.'
  const code = errors[0]?.code ?? ''
  const map: Record<string, string> = {
    form_password_pwned: 'Esta senha foi comprometida em vazamentos. Use outra senha.',
    form_identifier_exists: 'Este email já está cadastrado.',
    form_code_incorrect: 'Código incorreto. Tente novamente.',
    form_code_expired: 'Código expirado. Solicite um novo.',
    form_password_length_too_short: 'A senha deve ter pelo menos 8 caracteres.',
    form_password_incorrect: 'Senha incorreta.',
    form_identifier_not_found: 'Email não encontrado.',
    session_exists: 'Você já está logado.',
  }
  return map[code] ?? errors[0]?.message ?? 'Ocorreu um erro. Tente novamente.'
}

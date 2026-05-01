import { useParams, Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'

// Página pública para qualquer pessoa validar um certificado. O código vem do
// PDF baixado pelo aluno. Não exige autenticação. Nenhum dado sensível é
// exposto — apenas nome, curso, criador, data, nota.

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(ts))
}

export function VerifyCertificatePage() {
  const { code } = useParams<{ code: string }>()
  const result = useQuery(api.certificates.verify, { code: code ?? '' })

  const isLoading = result === undefined

  return (
    <div className="min-h-screen bg-[#0F141A] text-white">
      <header className="border-b border-white/6">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/">
            <img src="/logos/LOGO RETANGULO LETRA BRANCA.png" alt="Resenha do Teólogo" className="h-9 w-auto" />
          </Link>
          <Link
            to="/cursos"
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white/70 transition-all hover:border-white/20 hover:text-white"
          >
            Ver catálogo
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F2BD8A]">Verificação de certificado</p>
        <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">Autenticidade do certificado</h1>
        <p className="mt-3 text-sm leading-7 text-white/54">
          Esta página confirma a emissão e a autenticidade de um certificado emitido pela Resenha do Teólogo.
        </p>

        <div className="mt-10 rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(13,18,24,0.92)_0%,rgba(10,14,20,0.96)_100%)] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.25)]">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F37E20]/30 border-t-[#F37E20]" />
              <p className="text-sm text-white/54">Verificando código...</p>
            </div>
          ) : !result ? (
            <div className="py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mt-5 font-display text-xl font-semibold">Código não encontrado</h2>
              <p className="mt-3 text-sm leading-7 text-white/54">
                O código informado não corresponde a nenhum certificado emitido pela plataforma.
                Verifique se digitou corretamente as 16 posições impressas no rodapé do PDF.
              </p>
              <p className="mt-5 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 font-mono text-xs tracking-wider text-white/72">
                {code}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Certificado autêntico</p>
                  <h2 className="mt-1 font-display text-2xl font-bold">Emissão confirmada</h2>
                </div>
              </div>

              <dl className="mt-8 space-y-5 text-sm">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">Aluno</dt>
                  <dd className="mt-1 text-base font-semibold text-white">{result.studentName}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">Curso</dt>
                  <dd className="mt-1 text-base font-semibold text-white">{result.courseTitle}</dd>
                </div>
                {result.creatorName ? (
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">Professor</dt>
                    <dd className="mt-1 text-white/80">{result.creatorName}</dd>
                  </div>
                ) : null}
                {result.completedAt ? (
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">Data de conclusão</dt>
                    <dd className="mt-1 text-white/80">{formatDate(result.completedAt)}</dd>
                  </div>
                ) : null}
                {result.finalScore !== null ? (
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">Nota final</dt>
                    <dd className="mt-1 text-white/80">{Math.round(result.finalScore)}%</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">Código de verificação</dt>
                  <dd className="mt-1 font-mono text-sm tracking-wider text-white/80">{result.verificationCode}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs leading-6 text-white/32">
          Todos os certificados emitidos pela Resenha do Teólogo possuem um código único
          impresso no rodapé do PDF e podem ser verificados publicamente nesta página.
        </p>
      </main>
    </div>
  )
}

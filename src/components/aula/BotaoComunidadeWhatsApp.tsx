// CTA de entrada na comunidade do WhatsApp do Pr Luiz Silva.
// Renderizado em todas as aulas para alunos receberem avisos de novas aulas.

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/Lh3VXu8E1p82F98XSk3Rmt'

export function BotaoComunidadeWhatsApp() {
  return (
    <section className="mt-6">
      <a
        href={WHATSAPP_GROUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md sm:flex-row sm:items-center sm:gap-5"
      >
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-sm">
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M20.52 3.48A11.93 11.93 0 0 0 12.05 0C5.5 0 .15 5.34.15 11.9c0 2.1.55 4.15 1.6 5.95L0 24l6.32-1.66a11.9 11.9 0 0 0 5.7 1.45h.01c6.55 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.41-8.41ZM12.04 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.75.98 1-3.66-.23-.38a9.86 9.86 0 0 1-1.51-5.25c0-5.45 4.45-9.9 9.91-9.9 2.65 0 5.13 1.03 7 2.91a9.83 9.83 0 0 1 2.9 7c0 5.46-4.45 9.9-9.9 9.9Zm5.43-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.09 3.2 5.07 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35Z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base font-bold text-gray-900 sm:text-lg">
            Comunidade no WhatsApp do Pr Luiz Silva
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Receba avisos de novas aulas e troque ideias com outros alunos.
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2 self-start rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all group-hover:bg-[#1FB257] sm:self-center">
          <span>Entrar no grupo</span>
          <svg
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </div>
      </a>
    </section>
  )
}

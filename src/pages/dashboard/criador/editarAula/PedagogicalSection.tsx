import { cn } from '@/lib/brand'
import { SectionCard } from './SectionCard'

export function PedagogicalSection({
  allowQuizRetry,
  setAllowQuizRetry,
  hasQuiz,
}: {
  allowQuizRetry: boolean
  setAllowQuizRetry: (v: boolean) => void
  hasQuiz: boolean
}) {
  return (
    <SectionCard
      badge="E"
      title="Configuração pedagógica"
      subtitle="Decisões que mudam como o aluno interage com a aula."
    >
      <div className="space-y-4">
        <label
          className={cn(
            'flex items-start justify-between gap-4 p-4 rounded-xl border transition-colors',
            hasQuiz
              ? 'border-[#2A313B] bg-[#0F141A] cursor-pointer hover:border-[#F37E20]/40'
              : 'border-[#2A313B]/50 bg-[#0F141A]/50 cursor-not-allowed opacity-60'
          )}
        >
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              Permitir refazer quiz mediante nova visualização
            </p>
            <p className="mt-1 text-xs leading-5 text-white/50">
              Quando ativo, o aluno pode zerar a nota e refazer o quiz, mas precisa reassistir a aula
              inteira antes de enviar novas respostas.
              {!hasQuiz && ' Adicione pelo menos 5 perguntas para habilitar esta opção.'}
            </p>
          </div>
          <button
            type="button"
            disabled={!hasQuiz}
            onClick={() => hasQuiz && setAllowQuizRetry(!allowQuizRetry)}
            className={cn(
              'relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors',
              allowQuizRetry ? 'bg-[#F37E20]' : 'bg-[#2A313B]'
            )}
            role="switch"
            aria-checked={allowQuizRetry}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                allowQuizRetry ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </label>
      </div>
    </SectionCard>
  )
}

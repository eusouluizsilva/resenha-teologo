import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { brandInputClass } from '@/lib/brand'
import { BancoQuestoesImportarDialog } from '@/components/criador/BancoQuestoesImportarDialog'
import { SectionCard } from './SectionCard'
import { LETTERS, MAX_QUIZ, MIN_QUIZ, emptyQuestion } from './helpers'
import type { QuizQuestion } from './types'

function QuestionCard({
  q,
  index,
  onChange,
  onDelete,
}: {
  q: QuizQuestion
  index: number
  onChange: (updated: QuizQuestion) => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="bg-[#0F141A] border border-[#2A313B] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setOpen((p) => !p)}>
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-[#F37E20]/10 text-[#F37E20] text-xs font-bold flex items-center justify-center flex-shrink-0">
            {index + 1}
          </span>
          <p className="text-sm text-white truncate max-w-sm">
            {q.text || <span className="text-white/30 italic">Pergunta sem texto</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {q.correctId && (
            <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
              Resposta definida
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1.5 rounded text-white/20 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <svg
            className={`w-4 h-4 text-white/30 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-[#2A313B] pt-4">
              <textarea
                value={q.text}
                onChange={(e) => onChange({ ...q, text: e.target.value })}
                rows={2}
                placeholder="Digite a pergunta..."
                className={`${brandInputClass} resize-none`}
              />
              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <div key={opt.id} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onChange({ ...q, correctId: opt.id })}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        q.correctId === opt.id
                          ? 'border-emerald-400 bg-emerald-400/20'
                          : 'border-[#2A313B] hover:border-white/30'
                      }`}
                    >
                      {q.correctId === opt.id ? (
                        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : (
                        <span className="text-xs text-white/30 font-medium">{LETTERS[i]}</span>
                      )}
                    </button>
                    <input
                      value={opt.text}
                      onChange={(e) =>
                        onChange({
                          ...q,
                          options: q.options.map((o) => (o.id === opt.id ? { ...o, text: e.target.value } : o)),
                        })
                      }
                      placeholder={`Alternativa ${LETTERS[i]}`}
                      className={`${brandInputClass} flex-1`}
                    />
                  </div>
                ))}
              </div>
              <textarea
                value={q.explanation}
                onChange={(e) => onChange({ ...q, explanation: e.target.value })}
                rows={2}
                placeholder="Explicação da resposta correta (opcional)..."
                className={`${brandInputClass} resize-none`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function QuizSection({
  questions,
  setQuestions,
}: {
  questions: QuizQuestion[]
  setQuestions: React.Dispatch<React.SetStateAction<QuizQuestion[]>>
}) {
  const canAdd = questions.length < MAX_QUIZ
  const belowMin = questions.length > 0 && questions.length < MIN_QUIZ
  const remainingSlots = MAX_QUIZ - questions.length
  const [importOpen, setImportOpen] = useState(false)

  const alreadyAddedTexts = useMemo(
    () => new Set(questions.map((q) => q.text.trim())),
    [questions],
  )

  return (
    <SectionCard
      badge="D"
      title="Quiz"
      subtitle={`Mínimo ${MIN_QUIZ}, máximo ${MAX_QUIZ}. Contador: ${questions.length}/${MAX_QUIZ}. Só cria quiz obrigatório quando houver ao menos ${MIN_QUIZ} perguntas.`}
    >
      <div className="space-y-3">
        {belowMin && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-sm text-amber-400/80">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {`Faltam ${MIN_QUIZ - questions.length} pergunta${MIN_QUIZ - questions.length > 1 ? 's' : ''} para atingir o mínimo.`}
          </div>
        )}

        {questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            q={q}
            index={i}
            onChange={(updated) => setQuestions((p) => p.map((x) => (x.id === q.id ? updated : x)))}
            onDelete={() => setQuestions((p) => p.filter((x) => x.id !== q.id))}
          />
        ))}

        {canAdd && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setQuestions((p) => [...p, emptyQuestion()])}
              className="flex flex-1 items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[#2A313B] text-white/40 hover:border-[#F37E20]/40 hover:text-[#F37E20] text-sm font-medium transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Adicionar pergunta {questions.length > 0 && `(${questions.length}/${MAX_QUIZ})`}
            </button>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[#F37E20]/22 bg-[#F37E20]/8 text-[#F2BD8A] hover:bg-[#F37E20]/14 text-sm font-medium transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Importar do banco
            </button>
          </div>
        )}
      </div>

      <BancoQuestoesImportarDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={(picked) => {
          const slots = MAX_QUIZ - questions.length
          const limited = picked.slice(0, Math.max(0, slots))
          if (limited.length === 0) return
          setQuestions((p) => [...p, ...limited])
        }}
        alreadyAddedTexts={alreadyAddedTexts}
        remainingSlots={remainingSlots}
      />
    </SectionCard>
  )
}

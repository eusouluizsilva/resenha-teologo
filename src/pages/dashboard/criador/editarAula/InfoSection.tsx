import { useId, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { brandInputClass } from '@/lib/brand'
import { TemplatePicker } from '@/components/criador/TemplatePicker'
import { SectionCard } from './SectionCard'
import { detectVideo, PLATFORMS } from './helpers'

export function InfoSection({
  title,
  setTitle,
  url,
  setUrl,
  description,
  setDescription,
  order,
}: {
  title: string
  setTitle: (v: string) => void
  url: string
  setUrl: (v: string) => void
  description: string
  setDescription: (v: string) => void
  order: number
}) {
  const [showPlatforms, setShowPlatforms] = useState(false)
  const sectionId = useId()
  const info = detectVideo(url)
  const hasEmbed = !!info.embedUrl

  return (
    <SectionCard
      badge="A"
      title="Informações da aula"
      subtitle="Título, ordem no módulo, vídeo e descrição que aparecem para o aluno."
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
          <div>
            <label htmlFor={`${sectionId}-title`} className="block text-sm font-medium text-white/80 mb-1.5">Título</label>
            <input
              id={`${sectionId}-title`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da aula"
              className={brandInputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5">Ordem</label>
            <div className="flex h-11 min-w-20 items-center justify-center rounded-xl border border-white/8 bg-[#0F141A] px-4 font-display text-lg font-bold text-white/85">
              {order}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor={`${sectionId}-url`} className="text-sm font-medium text-white/80">URL do vídeo</label>
            <button
              type="button"
              onClick={() => setShowPlatforms((p) => !p)}
              className="text-xs text-[#F37E20] hover:text-white transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
              Plataformas suportadas
            </button>
          </div>

          <AnimatePresence>
            {showPlatforms && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden mb-3"
              >
                <div className="grid grid-cols-2 gap-2 p-3 bg-[#0F141A] rounded-lg border border-[#2A313B]">
                  {PLATFORMS.map((p) => (
                    <div key={p.name} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F37E20] flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-white/70">{p.name}</p>
                        <p className="text-xs text-white/25">{p.example}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <input
              id={`${sectionId}-url`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className={`${brandInputClass} ${info.platform !== 'unknown' && url ? 'pr-28' : ''}`}
            />
            {info.platform !== 'unknown' && url && (
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: `${info.color}25`, border: `1px solid ${info.color}40`, color: info.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: info.color }} />
                {info.label}
              </div>
            )}
          </div>

          {url && !hasEmbed && info.platform === 'unknown' && (
            <p className="text-xs text-amber-400/80 mt-1.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              Plataforma não reconhecida. Verifique se a URL está correta.
            </p>
          )}
        </div>

        {hasEmbed && (
          <div className="aspect-video rounded-xl overflow-hidden bg-black border border-[#2A313B]">
            <iframe
              src={info.embedUrl!}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title="Preview do vídeo"
            />
          </div>
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor={`${sectionId}-description`} className="block text-sm font-medium text-white/80">
              Descrição da aula
              <span className="ml-2 text-white/30 font-normal text-xs">Visível abaixo do player</span>
            </label>
            <TemplatePicker
              kind="lesson_description"
              currentValue={description}
              onApply={setDescription}
            />
          </div>
          <textarea
            id={`${sectionId}-description`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Descreva o que o aluno vai aprender nesta aula..."
            className={`${brandInputClass} resize-none`}
          />
        </div>
      </div>
    </SectionCard>
  )
}

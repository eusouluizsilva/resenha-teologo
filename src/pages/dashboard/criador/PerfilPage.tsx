import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer } from '@/lib/motion'

type ProfileForm = {
  name: string
  email: string
  bio: string
  phone: string
  city: string
  state: string
  country: string
  youtubeChannel: string
  instagram: string
  facebook: string
  twitter: string
  website: string
  ministry: string
  denomination: string
  seminary: string
}

const states = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

function AvatarUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    onChange(URL.createObjectURL(file))
  }, [onChange])

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-shrink-0">
        <div
          className={`w-24 h-24 rounded-full overflow-hidden border-2 transition-colors duration-200 cursor-pointer ${
            dragging ? 'border-[#F37E20]' : 'border-[#2A313B] hover:border-[#F37E20]/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onClick={() => inputRef.current?.click()}
        >
          {value ? (
            <img src={value} alt="Foto de perfil" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#1B2430] flex items-center justify-center">
              <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#F37E20] flex items-center justify-center shadow-lg hover:bg-[#e06e10] transition-colors"
        >
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-white mb-1">Foto de perfil</p>
        <p className="text-xs text-white/40 mb-3">PNG, JPG ou WEBP. Máximo 5 MB.</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs font-medium text-[#F37E20] hover:text-white border border-[#F37E20]/30 hover:bg-[#F37E20] px-3 py-1.5 rounded-lg transition-all duration-200"
          >
            Enviar foto
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-xs font-medium text-white/40 hover:text-red-400 px-3 py-1.5 rounded-lg transition-colors"
            >
              Remover
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">{title}</h2>
  )
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/80 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-white/30 mt-1">{hint}</p>}
    </div>
  )
}

const inputCls = 'w-full bg-[#0F141A] border border-[#2A313B] rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#F37E20]/50 transition-colors duration-200'

export function PerfilPage() {
  const [avatar, setAvatar] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ProfileForm>({
    name: '',
    email: '',
    bio: '',
    phone: '',
    city: '',
    state: '',
    country: 'Brasil',
    youtubeChannel: '',
    instagram: '',
    facebook: '',
    twitter: '',
    website: '',
    ministry: '',
    denomination: '',
    seminary: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await new Promise((r) => setTimeout(r, 700))
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="p-8">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-2xl mx-auto"
      >
        <motion.div variants={fadeUp} className="mb-8">
          <h1 className="text-2xl font-bold text-white font-display">Meu perfil</h1>
          <p className="text-white/50 mt-1 text-sm">Suas informações visíveis para os alunos da plataforma</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Foto */}
          <motion.div variants={fadeUp} className="bg-[#151B23] border border-[#2A313B] rounded-xl p-6">
            <SectionTitle title="Foto de perfil" />
            <AvatarUpload value={avatar} onChange={setAvatar} />
          </motion.div>

          {/* Dados pessoais */}
          <motion.div variants={fadeUp} className="bg-[#151B23] border border-[#2A313B] rounded-xl p-6 space-y-4">
            <SectionTitle title="Dados pessoais" />

            <div className="grid grid-cols-2 gap-4">
              <Field label="Nome completo">
                <input name="name" value={form.name} onChange={handleChange} placeholder="Seu nome" className={inputCls} />
              </Field>
              <Field label="E-mail">
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="seu@email.com" className={inputCls} />
              </Field>
            </div>

            <Field label="Bio" hint="Visível no seu perfil público. Máximo 300 caracteres.">
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={3}
                maxLength={300}
                placeholder="Fale um pouco sobre você, sua formação e ministério..."
                className={`${inputCls} resize-none`}
              />
              <p className="text-xs text-white/25 mt-1 text-right">{form.bio.length}/300</p>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Telefone / WhatsApp">
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+55 (11) 99999-9999" className={inputCls} />
              </Field>
              <Field label="País">
                <input name="country" value={form.country} onChange={handleChange} className={inputCls} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Cidade">
                <input name="city" value={form.city} onChange={handleChange} placeholder="São Paulo" className={inputCls} />
              </Field>
              <Field label="Estado">
                <select name="state" value={form.state} onChange={handleChange} className={inputCls}>
                  <option value="">Selecione...</option>
                  {states.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
          </motion.div>

          {/* Ministério */}
          <motion.div variants={fadeUp} className="bg-[#151B23] border border-[#2A313B] rounded-xl p-6 space-y-4">
            <SectionTitle title="Ministério e formação" />

            <Field label="Nome do ministério / igreja">
              <input name="ministry" value={form.ministry} onChange={handleChange} placeholder="Ex: Igreja Batista Central" className={inputCls} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Denominação">
                <input name="denomination" value={form.denomination} onChange={handleChange} placeholder="Ex: Batista, Presbiteriana..." className={inputCls} />
              </Field>
              <Field label="Seminário / faculdade">
                <input name="seminary" value={form.seminary} onChange={handleChange} placeholder="Ex: Seminário Teológico..." className={inputCls} />
              </Field>
            </div>
          </motion.div>

          {/* Redes sociais */}
          <motion.div variants={fadeUp} className="bg-[#151B23] border border-[#2A313B] rounded-xl p-6 space-y-4">
            <SectionTitle title="Redes sociais" />

            <Field label="Canal no YouTube">
              <div className="flex">
                <span className="flex items-center px-3 bg-[#0F141A] border border-r-0 border-[#2A313B] rounded-l-lg text-white/30 text-sm">
                  youtube.com/
                </span>
                <input name="youtubeChannel" value={form.youtubeChannel} onChange={handleChange} placeholder="@seucanal" className={`${inputCls} rounded-l-none`} />
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Instagram">
                <div className="flex">
                  <span className="flex items-center px-3 bg-[#0F141A] border border-r-0 border-[#2A313B] rounded-l-lg text-white/30 text-sm">@</span>
                  <input name="instagram" value={form.instagram} onChange={handleChange} placeholder="usuario" className={`${inputCls} rounded-l-none`} />
                </div>
              </Field>
              <Field label="Facebook">
                <div className="flex">
                  <span className="flex items-center px-3 bg-[#0F141A] border border-r-0 border-[#2A313B] rounded-l-lg text-white/30 text-sm">fb/</span>
                  <input name="facebook" value={form.facebook} onChange={handleChange} placeholder="perfil" className={`${inputCls} rounded-l-none`} />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Twitter / X">
                <div className="flex">
                  <span className="flex items-center px-3 bg-[#0F141A] border border-r-0 border-[#2A313B] rounded-l-lg text-white/30 text-sm">@</span>
                  <input name="twitter" value={form.twitter} onChange={handleChange} placeholder="usuario" className={`${inputCls} rounded-l-none`} />
                </div>
              </Field>
              <Field label="Site pessoal">
                <input name="website" value={form.website} onChange={handleChange} placeholder="https://seusite.com" className={inputCls} />
              </Field>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="flex items-center justify-end gap-3 pb-4">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Salvo com sucesso
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-[#F37E20] hover:bg-[#e06e10] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors duration-200"
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Salvando...
                </>
              ) : 'Salvar perfil'}
            </button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  )
}

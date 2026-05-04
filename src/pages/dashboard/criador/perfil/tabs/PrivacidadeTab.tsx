import { useState } from 'react'
import { useMutation } from 'convex/react'
import { useClerk } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { api } from '@convex/_generated/api'
import type { FunctionReturnType } from 'convex/server'
import { brandEyebrowClass, brandInputClass, brandPanelClass, brandPanelSoftClass, brandPrimaryButtonClass, cn } from '@/lib/brand'

type ExportData = FunctionReturnType<typeof api.account.exportMyData>

export function PrivacidadeTab({
  exportData,
  formId,
  isCriador,
}: {
  exportData: ExportData | undefined
  formId: string
  isCriador: boolean
}) {
  const deleteAccount = useMutation(api.account.deleteAccount)
  const { signOut } = useClerk()
  const navigate = useNavigate()

  const [exporting, setExporting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function handleExportData() {
    if (!exportData) return
    setExporting(true)
    try {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meus-dados-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm.trim().toUpperCase() !== 'EXCLUIR') {
      setDeleteError('Digite EXCLUIR para confirmar.')
      return
    }
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteAccount({})
      await signOut()
      navigate('/', { replace: true })
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Falha ao excluir conta.')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className={cn('p-6', brandPanelClass)}>
        <p className={cn('mb-2', brandEyebrowClass)}>Exportar meus dados</p>
        <h3 className="font-display text-lg font-bold text-white">Baixe uma cópia completa</h3>
        <p className="mt-2 text-sm leading-6 text-white/52">
          Gera um arquivo JSON com todos os seus dados pessoais: perfil, funções, consentimentos,
          matrículas, progresso, cadernos, comentários, avaliações e cursos criados. É seu direito
          pela LGPD e você pode usar esse arquivo para consulta ou portabilidade.
        </p>
        <button
          type="button"
          onClick={handleExportData}
          disabled={exporting || exportData === undefined}
          className={cn(brandPrimaryButtonClass, 'mt-5 px-5 py-2.5 text-sm')}
        >
          {exportData === undefined
            ? 'Preparando dados...'
            : exporting
              ? 'Gerando arquivo...'
              : 'Baixar meus dados (JSON)'}
        </button>
      </div>

      <div className={cn('p-6', brandPanelSoftClass, 'border-red-500/20')}>
        <p className={cn('mb-2', brandEyebrowClass)} style={{ color: '#fca5a5' }}>
          Excluir minha conta
        </p>
        <h3 className="font-display text-lg font-bold text-white">Remover conta permanentemente</h3>
        <p className="mt-2 text-sm leading-6 text-white/52">
          Esta ação remove seu perfil, matrículas, progresso, cadernos, avaliações e depoimentos.
          Comentários em aulas ficam anônimos. Doações já concluídas são preservadas de forma
          anônima por obrigação fiscal. <strong className="text-white/72">A ação é irreversível.</strong>
        </p>
        {isCriador && (
          <p className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">
            Se você é criador, despublique todos os seus cursos antes de excluir a conta.
            Alunos matriculados perderiam acesso.
          </p>
        )}
        <div className="mt-5">
          <label htmlFor={`${formId}-deleteConfirm`} className="mb-1.5 block text-xs font-medium text-white/52">
            Digite <span className="font-bold text-red-300">EXCLUIR</span> para confirmar
          </label>
          <input
            id={`${formId}-deleteConfirm`}
            type="text"
            value={deleteConfirm}
            onChange={(e) => {
              setDeleteConfirm(e.target.value)
              setDeleteError('')
            }}
            placeholder="EXCLUIR"
            className={brandInputClass}
            disabled={deleting}
          />
        </div>
        {deleteError && (
          <p role="alert" className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
            {deleteError}
          </p>
        )}
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleting || deleteConfirm.trim().toUpperCase() !== 'EXCLUIR'}
          className="mt-5 rounded-[1.1rem] border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 transition-all duration-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {deleting ? 'Excluindo conta...' : 'Excluir minha conta'}
        </button>
      </div>
    </div>
  )
}

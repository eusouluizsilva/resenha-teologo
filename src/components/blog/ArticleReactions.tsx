// Like + Share-click do artigo. Like exige login (anônimo é redirecionado
// para /entrar com return). Share funciona anônimo (registrado por sessionId).

import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { useEffect, useRef, useState } from 'react'
import { uuid } from '@/lib/uuid'

const SHARE_SESSION_KEY = 'rdt_share_session'

function getOrCreateSessionId(): string {
  let id = sessionStorage.getItem(SHARE_SESSION_KEY)
  if (!id) {
    id = uuid()
    sessionStorage.setItem(SHARE_SESSION_KEY, id)
  }
  return id
}

interface ArticleReactionsProps {
  postId: Id<'posts'>
  url: string
  title: string
  initialLikeCount: number
  initialShareCount: number
}

export function ArticleReactions({
  postId,
  url,
  title,
  initialLikeCount,
  initialShareCount,
}: ArticleReactionsProps) {
  const navigate = useNavigate()
  const { isSignedIn } = useUser()
  const reaction = useQuery(api.postReactions.myReactionState, { postId })
  const like = useMutation(api.postReactions.like)
  const unlike = useMutation(api.postReactions.unlike)
  const share = useMutation(api.postReactions.share)

  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [shareCount, setShareCount] = useState(initialShareCount)
  const [shareToast, setShareToast] = useState<string | null>(null)
  const liked = reaction?.liked ?? false
  const initializedLikeFromServer = useRef(false)

  // Quando a query do servidor responde, sincronizamos o número exibido se
  // diferir (em caso de like/unlike de outras abas).
  useEffect(() => {
    if (initializedLikeFromServer.current) return
    if (reaction === undefined) return
    initializedLikeFromServer.current = true
  }, [reaction])

  async function handleLike() {
    if (!isSignedIn) {
      const next = encodeURIComponent(window.location.pathname + window.location.search)
      navigate(`/entrar?return=${next}`)
      return
    }
    if (liked) {
      setLikeCount((c) => Math.max(0, c - 1))
      try {
        await unlike({ postId })
      } catch {
        setLikeCount((c) => c + 1)
      }
    } else {
      setLikeCount((c) => c + 1)
      try {
        await like({ postId })
      } catch {
        setLikeCount((c) => Math.max(0, c - 1))
      }
    }
  }

  async function handleShare() {
    const sessionId = getOrCreateSessionId()
    const data = { title, url, text: title }
    let channel = 'native'
    let used = false

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share(data)
        used = true
      } catch {
        used = false
      }
    }

    if (!used) {
      channel = 'copy'
      try {
        await navigator.clipboard.writeText(url)
        setShareToast('Link copiado para a área de transferência.')
        setTimeout(() => setShareToast(null), 2400)
      } catch {
        setShareToast('Não foi possível copiar o link.')
        setTimeout(() => setShareToast(null), 2400)
        return
      }
    }

    setShareCount((c) => c + 1)
    try {
      await share({ postId, sessionId, channel })
    } catch {
      // contagem volta ao valor real na próxima query do reader
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleLike}
        aria-pressed={liked}
        className={
          liked
            ? 'inline-flex items-center gap-2 rounded-2xl border border-[#F37E20] bg-[#F37E20]/12 px-4 py-2.5 text-sm font-semibold text-[#F37E20] transition-all duration-200'
            : 'inline-flex items-center gap-2 rounded-2xl border border-[#E6DBCF] bg-white px-4 py-2.5 text-sm font-semibold text-[#111827] transition-all duration-200 hover:border-[#F37E20]/40 hover:text-[#F37E20]'
        }
      >
        <svg
          className="h-4 w-4"
          fill={liked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={1.6}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
        <span>Curtir</span>
        <span className="text-xs text-current/70">· {likeCount.toLocaleString('pt-BR')}</span>
      </button>

      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-2 rounded-2xl border border-[#E6DBCF] bg-white px-4 py-2.5 text-sm font-semibold text-[#111827] transition-all duration-200 hover:border-[#F37E20]/40 hover:text-[#F37E20]"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.181.324.283.696.283 1.093s-.102.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
        <span>Compartilhar</span>
        <span className="text-xs text-current/70">· {shareCount.toLocaleString('pt-BR')}</span>
      </button>

      {shareToast && (
        <span className="text-xs font-medium text-[#4B5563]">{shareToast}</span>
      )}
    </div>
  )
}

// Renderiza texto de comentário como Markdown limitado. Whitelist explícita
// via rehype-sanitize: nada de scripts, imagens ou tags arbitrárias. Suporta
// negrito, itálico, listas, código inline, blockquote e links externos com
// target/rel hardening.

import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import { cn } from '@/lib/brand'

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    'p',
    'br',
    'strong',
    'em',
    'del',
    'a',
    'ul',
    'ol',
    'li',
    'code',
    'blockquote',
  ],
  attributes: {
    a: [['href'], ['title'], ['target'], ['rel']],
  },
}

type Variant = 'light' | 'dark'

function makeComponents(variant: Variant): Components {
  const isDark = variant === 'dark'
  const linkClass = isDark
    ? 'font-medium text-[#F2BD8A] underline underline-offset-2 hover:text-[#F37E20]'
    : 'font-medium text-[#F37E20] underline underline-offset-2 hover:text-[#e06e10]'
  const codeClass = isDark
    ? 'rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-white/86'
    : 'rounded bg-[#F0EBE2] px-1.5 py-0.5 font-mono text-[0.85em] text-[#7C2D12]'
  const quoteClass = isDark
    ? 'my-2 border-l-2 border-[#F37E20]/60 pl-3 italic text-white/68'
    : 'my-2 border-l-2 border-[#F37E20]/60 pl-3 italic text-gray-600'

  return {
    a: ({ children, href, ...props }) => {
      const isExternal = !!href && /^https?:/.test(href)
      return (
        <a
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className={linkClass}
          {...props}
        >
          {children}
        </a>
      )
    },
    code: ({ children, ...props }) => (
      <code className={codeClass} {...props}>
        {children}
      </code>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote className={quoteClass} {...props}>
        {children}
      </blockquote>
    ),
    ul: ({ children, ...props }) => (
      <ul className="my-1 ml-5 list-disc space-y-1" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="my-1 ml-5 list-decimal space-y-1" {...props}>
        {children}
      </ol>
    ),
    p: ({ children, ...props }) => (
      <p className="whitespace-pre-wrap" {...props}>
        {children}
      </p>
    ),
  }
}

export function CommentMarkdown({
  text,
  variant = 'light',
  className,
}: {
  text: string
  variant?: Variant
  className?: string
}) {
  const isDark = variant === 'dark'
  const baseClass = isDark
    ? 'text-sm leading-6 text-white/86 [&_p]:my-0 [&_p+p]:mt-2'
    : 'text-sm leading-6 text-gray-700 [&_p]:my-0 [&_p+p]:mt-2'

  return (
    <div className={cn(baseClass, className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        components={makeComponents(variant)}
        skipHtml
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}

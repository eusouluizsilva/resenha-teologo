// Renderer Markdown para artigos do blog. Whitelist explícita de tags via
// rehype-sanitize. Externos abrem em aba nova com noopener.

import type { Components } from 'react-markdown'
import { defaultSchema } from 'rehype-sanitize'

export const articleSanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    'figure',
    'figcaption',
  ],
  attributes: {
    ...(defaultSchema.attributes ?? {}),
    a: [
      ...((defaultSchema.attributes?.a as unknown as string[]) ?? []),
      ['target'],
      ['rel'],
    ],
  },
}

// Componentes custom do react-markdown — aplicam tipografia editorial e
// hardening de links externos.
export const articleComponents: Components = {
  h1: ({ children, ...props }) => (
    <h1 className="font-display text-3xl font-bold text-[#111827] mt-10 mb-4 leading-tight" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="font-display text-2xl font-semibold text-[#111827] mt-8 mb-3 leading-tight" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="font-display text-xl font-semibold text-[#111827] mt-6 mb-2" {...props}>{children}</h3>
  ),
  p: ({ children, ...props }) => (
    <p className="font-serif text-[1.05rem] leading-8 text-[#1F2937] mb-5" {...props}>{children}</p>
  ),
  a: ({ children, href, ...props }) => {
    const isExternal = !!href && /^https?:/.test(href)
    return (
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className="text-[#F37E20] underline decoration-[#F37E20]/40 underline-offset-4 hover:decoration-[#F37E20]"
        {...props}
      >
        {children}
      </a>
    )
  },
  blockquote: ({ children, ...props }) => (
    <blockquote className="my-6 border-l-4 border-[#F37E20]/60 bg-[#FBF7F1] py-4 pl-6 pr-4 font-serif text-[1.05rem] italic text-[#374151]" {...props}>
      {children}
    </blockquote>
  ),
  ul: ({ children, ...props }) => (
    <ul className="font-serif text-[1.05rem] leading-8 text-[#1F2937] mb-5 ml-6 list-disc space-y-2" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="font-serif text-[1.05rem] leading-8 text-[#1F2937] mb-5 ml-6 list-decimal space-y-2" {...props}>{children}</ol>
  ),
  code: ({ children, ...props }) => (
    <code className="rounded-md bg-[#F0EBE2] px-1.5 py-0.5 font-mono text-[0.9em] text-[#7C2D12]" {...props}>{children}</code>
  ),
  hr: () => (
    <hr className="my-10 border-0 mx-auto h-1 w-12 rounded-full bg-[#F37E20]/30" />
  ),
  img: ({ src, alt, ...props }) => (
    <figure className="my-8">
      <img src={src} alt={alt ?? ''} loading="lazy" className="w-full rounded-2xl" {...props} />
      {alt ? <figcaption className="mt-2 text-center text-sm text-[#6B7280]">{alt}</figcaption> : null}
    </figure>
  ),
}

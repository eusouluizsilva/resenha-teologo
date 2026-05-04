// Conjunto de ilustrações SVG inline para estados vazios. Stroke editorial,
// acento laranja #F37E20 reservado para 1 elemento focal por ilustração.
// Tamanho padrão 200x140; herda `text-white/40` por padrão para dashboards
// dark e pode ser sobrescrito via `className`.

import type { SVGProps } from 'react'
import { cn } from '@/lib/brand'

type Props = SVGProps<SVGSVGElement> & {
  className?: string
}

function Frame({
  children,
  className,
  ...rest
}: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 200 140"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn('h-32 w-auto text-white/36', className)}
      {...rest}
    >
      {children}
    </svg>
  )
}

// Pilha de livros aberta com marca-página laranja. Estados: "sem cursos",
// "sem cadernos", "sem cursos criados".
export function EmptyBooksIllustration(props: Props) {
  return (
    <Frame {...props}>
      <path d="M30 100 L30 50 Q30 44 36 44 L96 44 Q102 44 102 50 L102 100" />
      <path d="M102 100 L102 50 Q102 44 108 44 L168 44 Q174 44 174 50 L174 100" />
      <path d="M30 100 L174 100" />
      <path d="M30 100 L25 110 L179 110 L174 100" />
      <path d="M44 56 L88 56 M44 64 L80 64 M44 72 L84 72" />
      <path d="M116 56 L160 56 M116 64 L152 64 M116 72 L156 72" />
      <path d="M134 44 L134 78 L142 72 L150 78 L150 44" stroke="#F37E20" strokeWidth={1.6} fill="#F37E20" fillOpacity={0.15} />
    </Frame>
  )
}

// Diploma enrolado com fita laranja. Estado: "sem certificados".
export function EmptyCertificateIllustration(props: Props) {
  return (
    <Frame {...props}>
      <rect x="36" y="32" width="128" height="76" rx="6" />
      <path d="M48 50 L152 50 M48 60 L132 60 M48 70 L142 70 M48 80 L120 80" />
      <circle cx="148" cy="92" r="10" stroke="#F37E20" strokeWidth={1.8} />
      <path d="M144 100 L142 116 L148 110 L154 116 L152 100" stroke="#F37E20" strokeWidth={1.8} fill="#F37E20" fillOpacity={0.15} />
      <path d="M30 32 L36 26 L36 38 Z" fill="currentColor" fillOpacity={0.2} />
      <path d="M170 32 L164 26 L164 38 Z" fill="currentColor" fillOpacity={0.2} />
    </Frame>
  )
}

// Balão de fala com três pontos e ponto laranja. Estado: "sem perguntas",
// "sem comentários", "sem mensagens".
export function EmptyChatIllustration(props: Props) {
  return (
    <Frame {...props}>
      <path d="M40 40 L160 40 Q170 40 170 50 L170 90 Q170 100 160 100 L80 100 L60 116 L60 100 L40 100 Q30 100 30 90 L30 50 Q30 40 40 40 Z" />
      <circle cx="78" cy="70" r="3.5" fill="currentColor" fillOpacity={0.4} />
      <circle cx="100" cy="70" r="3.5" fill="currentColor" fillOpacity={0.4} />
      <circle cx="122" cy="70" r="3.5" fill="#F37E20" stroke="#F37E20" strokeWidth={1.6} />
    </Frame>
  )
}

// Sacola/etiquetas com cifrão laranja. Estado: "sem produtos na loja",
// "sem pedidos".
export function EmptyShopIllustration(props: Props) {
  return (
    <Frame {...props}>
      <path d="M58 56 L58 50 Q58 36 72 36 L128 36 Q142 36 142 50 L142 56" />
      <path d="M48 56 L152 56 L148 116 Q148 122 142 122 L58 122 Q52 122 52 116 Z" />
      <path d="M82 70 L82 80 M118 70 L118 80" />
      <circle cx="100" cy="86" r="14" stroke="#F37E20" strokeWidth={1.8} />
      <path d="M96 80 Q96 78 100 78 L102 78 Q106 78 106 82 Q106 86 100 86 Q94 86 94 90 Q94 94 100 94 L102 94 Q106 94 106 92 M100 76 L100 96" stroke="#F37E20" strokeWidth={1.6} />
    </Frame>
  )
}

// Sino com badge laranja. Estado: "sem notificações", "sem perguntas para
// criadores", "sem alertas".
export function EmptyBellIllustration(props: Props) {
  return (
    <Frame {...props}>
      <path d="M70 92 L130 92 Q138 92 134 84 Q126 68 126 56 Q126 40 110 36 L110 30 Q110 26 100 26 Q90 26 90 30 L90 36 Q74 40 74 56 Q74 68 66 84 Q62 92 70 92 Z" />
      <path d="M88 100 Q92 110 100 110 Q108 110 112 100" />
      <circle cx="128" cy="42" r="9" fill="#F37E20" stroke="#F37E20" strokeWidth={1.6} />
      <path d="M128 38 L128 42 L131 44" stroke="#0F141A" strokeWidth={1.4} />
    </Frame>
  )
}

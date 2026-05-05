import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { articleComponents, articleSanitizeSchema } from '@/lib/articleMarkdown'
import { READING_FONT_SIZES, type ReadingFontSize } from '@/lib/useReadingFontSize'

// fontSize controla o tamanho base via CSS var --rdt-reading-font-size
// (consumida no CSS de .article-body). Default 'md' mantém comportamento
// anterior; outras opções vêm do controle A-/A+ no header do post.
export function CorpoArtigo({
  markdown,
  fontSize = 'md',
}: {
  markdown: string
  fontSize?: ReadingFontSize
}) {
  const style = READING_FONT_SIZES[fontSize]
  return (
    <div
      className="article-body"
      style={{
        ['--rdt-article-text-size' as string]: style.fontSize,
        ['--rdt-article-line-height' as string]: style.lineHeight,
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, articleSanitizeSchema]]}
        components={articleComponents}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { articleComponents, articleSanitizeSchema } from '@/lib/articleMarkdown'

export function CorpoArtigo({ markdown }: { markdown: string }) {
  return (
    <div className="article-body">
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

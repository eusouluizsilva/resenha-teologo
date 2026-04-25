// Tags livres do blog. postCount é denormalizado e atualizado via
// upsertTagsByName (chamado quando posts.publish efetiva uma publicação).
// Wave 18 vai integrar postCount com o publish; nesta wave fica como
// helper em standby.

import { query } from './_generated/server'

export const list = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('postTags').collect()
    return all
      .slice()
      .sort((a, b) => b.postCount - a.postCount)
      .map((t) => ({ slug: t.slug, name: t.name, postCount: t.postCount }))
  },
})

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Returns all forum posts ordered newest first (pinned ones bubble to top client-side)
export const getPosts = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("forumPosts")
      .order("desc")
      .collect();

    const withAuthors = await Promise.all(
      posts.map(async (p) => {
        const author = await ctx.db.get(p.authorId);
        // Count replies
        const replies = await ctx.db
          .query("forumReplies")
          .withIndex("by_postId", (q) => q.eq("postId", p._id))
          .collect();
        return {
          ...p,
          authorName: author?.name ?? "Usuário",
          authorRole: author?.role ?? "member",
          replyCount: replies.length,
        };
      })
    );

    return withAuthors;
  },
});

export const getPost = query({
  args: { postId: v.id("forumPosts") },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId);
    if (!post) return null;
    const author = await ctx.db.get(post.authorId);
    return { ...post, authorName: author?.name ?? "Usuário", authorRole: author?.role ?? "member" };
  },
});

export const getReplies = query({
  args: { postId: v.id("forumPosts") },
  handler: async (ctx, { postId }) => {
    const replies = await ctx.db
      .query("forumReplies")
      .withIndex("by_postId", (q) => q.eq("postId", postId))
      .order("asc")
      .collect();

    const withAuthors = await Promise.all(
      replies.map(async (r) => {
        const author = await ctx.db.get(r.authorId);
        return { ...r, authorName: author?.name ?? "Usuário", authorRole: author?.role ?? "member" };
      })
    );

    return withAuthors;
  },
});

export const createPost = mutation({
  args: {
    authorId: v.id("users"),
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, { authorId, title, body }) => {
    return await ctx.db.insert("forumPosts", {
      authorId,
      title: title.trim(),
      body: body.trim(),
      createdAt: Date.now(),
      pinned: false,
    });
  },
});

export const addReply = mutation({
  args: {
    postId: v.id("forumPosts"),
    authorId: v.id("users"),
    body: v.string(),
  },
  handler: async (ctx, { postId, authorId, body }) => {
    await ctx.db.insert("forumReplies", {
      postId,
      authorId,
      body: body.trim(),
      createdAt: Date.now(),
    });
  },
});

export const deletePost = mutation({
  args: { postId: v.id("forumPosts"), requesterId: v.id("users") },
  handler: async (ctx, { postId, requesterId }) => {
    const post = await ctx.db.get(postId);
    if (!post) return;
    const requester = await ctx.db.get(requesterId);
    if (post.authorId !== requesterId && requester?.role !== "admin") return;
    // Delete all replies first
    const replies = await ctx.db
      .query("forumReplies")
      .withIndex("by_postId", (q) => q.eq("postId", postId))
      .collect();
    await Promise.all(replies.map((r) => ctx.db.delete(r._id)));
    await ctx.db.delete(postId);
  },
});

export const deleteReply = mutation({
  args: { replyId: v.id("forumReplies"), requesterId: v.id("users") },
  handler: async (ctx, { replyId, requesterId }) => {
    const reply = await ctx.db.get(replyId);
    if (!reply) return;
    const requester = await ctx.db.get(requesterId);
    if (reply.authorId !== requesterId && requester?.role !== "admin") return;
    await ctx.db.delete(replyId);
  },
});

export const togglePin = mutation({
  args: { postId: v.id("forumPosts"), requesterId: v.id("users") },
  handler: async (ctx, { postId, requesterId }) => {
    const requester = await ctx.db.get(requesterId);
    if (requester?.role !== "admin") return;
    const post = await ctx.db.get(postId);
    if (!post) return;
    await ctx.db.patch(postId, { pinned: !post.pinned });
  },
});

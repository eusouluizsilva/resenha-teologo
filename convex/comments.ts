import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Returns top-level comments for a lesson, newest first
export const getCommentsByLesson = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, { lessonId }) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_lessonId", (q) => q.eq("lessonId", lessonId))
      .order("desc")
      .collect();

    // Attach author name to each comment
    const withAuthors = await Promise.all(
      comments.map(async (c) => {
        const author = await ctx.db.get(c.authorId);
        return { ...c, authorName: author?.name ?? "Usuário", authorRole: author?.role ?? "member" };
      })
    );

    return withAuthors;
  },
});

// Returns replies for a given parent comment
export const getReplies = query({
  args: { parentId: v.id("comments") },
  handler: async (ctx, { parentId }) => {
    const replies = await ctx.db
      .query("comments")
      .withIndex("by_parentId", (q) => q.eq("parentId", parentId))
      .order("asc")
      .collect();

    const withAuthors = await Promise.all(
      replies.map(async (c) => {
        const author = await ctx.db.get(c.authorId);
        return { ...c, authorName: author?.name ?? "Usuário", authorRole: author?.role ?? "member" };
      })
    );

    return withAuthors;
  },
});

export const addComment = mutation({
  args: {
    lessonId: v.id("lessons"),
    authorId: v.id("users"),
    body: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, { lessonId, authorId, body, parentId }) => {
    await ctx.db.insert("comments", {
      lessonId,
      authorId,
      body: body.trim(),
      parentId,
      createdAt: Date.now(),
    });
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("comments"), requesterId: v.id("users") },
  handler: async (ctx, { commentId, requesterId }) => {
    const comment = await ctx.db.get(commentId);
    if (!comment) return;
    const requester = await ctx.db.get(requesterId);
    // Only author or admin can delete
    if (comment.authorId !== requesterId && requester?.role !== "admin") return;
    await ctx.db.delete(commentId);
  },
});

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const getMyProgress = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("progress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getLessonProgress = query({
  args: { userId: v.id("users"), lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("progress")
      .withIndex("by_userId_lessonId", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId)
      )
      .unique();
  },
});

export const getProgressByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("progress")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const completeLesson = mutation({
  args: {
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    quizScore: v.number(), // number of correct answers
    totalQuestions: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("progress")
      .withIndex("by_userId_lessonId", (q) =>
        q.eq("userId", args.userId).eq("lessonId", args.lessonId)
      )
      .unique();

    if (existing?.completed) return; // already completed, no double XP

    const lessonXP = 10;
    const quizXP = args.quizScore * 5;
    const totalXP = lessonXP + quizXP;

    if (existing) {
      await ctx.db.patch(existing._id, {
        completed: true,
        quizScore: args.quizScore,
        completedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("progress", {
        userId: args.userId,
        lessonId: args.lessonId,
        completed: true,
        quizScore: args.quizScore,
        completedAt: Date.now(),
      });
    }

    await ctx.runMutation(api.users.updateXPAndLevel, {
      userId: args.userId,
      xpToAdd: totalXP,
    });

    return { xpEarned: totalXP };
  },
});

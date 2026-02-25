import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getQuizByLesson = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quizzes")
      .withIndex("by_lessonId", (q) => q.eq("lessonId", args.lessonId))
      .unique();
  },
});

export const createQuiz = mutation({
  args: {
    lessonId: v.id("lessons"),
    questions: v.array(
      v.object({
        question: v.string(),
        options: v.array(v.string()),
        correctIndex: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("quizzes", args);
  },
});

export const upsertQuiz = mutation({
  args: {
    lessonId: v.id("lessons"),
    questions: v.array(
      v.object({
        question: v.string(),
        options: v.array(v.string()),
        correctIndex: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("quizzes")
      .withIndex("by_lessonId", (q) => q.eq("lessonId", args.lessonId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { questions: args.questions });
    } else {
      await ctx.db.insert("quizzes", { lessonId: args.lessonId, questions: args.questions });
    }
  },
});

export const deleteQuiz = mutation({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.quizId);
  },
});

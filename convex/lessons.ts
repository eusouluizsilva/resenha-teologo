import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getLessonsByModule = query({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, args) => {
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_moduleId", (q) => q.eq("moduleId", args.moduleId))
      .collect();
    return lessons.sort((a, b) => a.order - b.order);
  },
});

export const getLesson = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.lessonId);
  },
});

export const createLesson = mutation({
  args: {
    moduleId: v.id("modules"),
    title: v.string(),
    videoUrl: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("lessons", args);
  },
});

export const updateLesson = mutation({
  args: {
    lessonId: v.id("lessons"),
    title: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { lessonId, ...fields } = args;
    await ctx.db.patch(lessonId, fields);
  },
});

export const deleteLesson = mutation({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.lessonId);
  },
});

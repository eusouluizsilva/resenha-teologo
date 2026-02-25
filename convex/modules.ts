import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getModulesByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const modules = await ctx.db
      .query("modules")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .collect();
    return modules.sort((a, b) => a.order - b.order);
  },
});

export const createModule = mutation({
  args: {
    courseId: v.id("courses"),
    title: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("modules", args);
  },
});

export const updateModule = mutation({
  args: { moduleId: v.id("modules"), title: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.moduleId, { title: args.title });
  },
});

export const deleteModule = mutation({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.moduleId);
  },
});

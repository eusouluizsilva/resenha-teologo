import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("courses").collect();
  },
});

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();
  },
});

export const getCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.courseId);
  },
});

export const listMyCourses = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("createdBy"), args.userId))
      .collect();
  },
});

export const createCourse = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    thumbnailUrl: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("courses", {
      title: args.title,
      description: args.description,
      thumbnailUrl: args.thumbnailUrl,
      status: "draft",
      createdAt: Date.now(),
      createdBy: args.createdBy,
    });
  },
});

export const updateCourse = mutation({
  args: {
    courseId: v.id("courses"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    welcomeVideoUrl: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    requesterId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { courseId, requesterId, ...fields } = args;
    if (requesterId) {
      const requester = await ctx.db.get(requesterId);
      if (!requester) return;
      const course = await ctx.db.get(courseId);
      if (!course) return;
      if (requester.role !== "admin" && course.createdBy !== requesterId) return;
    }
    await ctx.db.patch(courseId, fields);
  },
});

export const deleteCourse = mutation({
  args: {
    courseId: v.id("courses"),
    requesterId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (args.requesterId) {
      const requester = await ctx.db.get(args.requesterId);
      if (!requester) return;
      const course = await ctx.db.get(args.courseId);
      if (!course) return;
      if (requester.role !== "admin" && course.createdBy !== args.requesterId) return;
    }
    await ctx.db.delete(args.courseId);
  },
});

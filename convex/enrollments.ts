import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const enroll = mutation({
  args: { userId: v.id("users"), courseId: v.id("courses") },
  handler: async (ctx, { userId, courseId }) => {
    const existing = await ctx.db
      .query("enrollments")
      .withIndex("by_userId_courseId", (q) =>
        q.eq("userId", userId).eq("courseId", courseId)
      )
      .unique();
    if (existing) return;
    await ctx.db.insert("enrollments", { userId, courseId, enrolledAt: Date.now() });
  },
});

export const isEnrolled = query({
  args: { userId: v.id("users"), courseId: v.id("courses") },
  handler: async (ctx, { userId, courseId }) => {
    const result = await ctx.db
      .query("enrollments")
      .withIndex("by_userId_courseId", (q) =>
        q.eq("userId", userId).eq("courseId", courseId)
      )
      .unique();
    return result !== null;
  },
});

export const getMyEnrolledCourses = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    const courses = await Promise.all(enrollments.map((e) => ctx.db.get(e.courseId)));
    return courses.filter(
      (c): c is NonNullable<typeof c> => c !== null && c.status === "published"
    );
  },
});

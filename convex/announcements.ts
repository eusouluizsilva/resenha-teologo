import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("announcements")
      .withIndex("by_createdAt")
      .order("desc")
      .filter((q) => q.eq(q.field("active"), true))
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("announcements")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.string(),
    linkUrl: v.optional(v.string()),
    active: v.boolean(),
    requesterId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (args.requesterId) {
      const requester = await ctx.db.get(args.requesterId);
      if (!requester || requester.role !== "admin") return null;
    }
    const { requesterId, ...fields } = args;
    return await ctx.db.insert("announcements", {
      ...fields,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    announcementId: v.id("announcements"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    active: v.optional(v.boolean()),
    requesterId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (args.requesterId) {
      const requester = await ctx.db.get(args.requesterId);
      if (!requester || requester.role !== "admin") return;
    }
    const { announcementId, requesterId, ...fields } = args;
    await ctx.db.patch(announcementId, fields);
  },
});

export const remove = mutation({
  args: {
    announcementId: v.id("announcements"),
    requesterId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (args.requesterId) {
      const requester = await ctx.db.get(args.requesterId);
      if (!requester || requester.role !== "admin") return;
    }
    await ctx.db.delete(args.announcementId);
  },
});

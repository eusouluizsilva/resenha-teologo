import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Returns the verse assigned to today's date, falling back to the most recent active one
export const getToday = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    const exact = await ctx.db
      .query("dailyVerses")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();
    if (exact && exact.active) return exact;

    // Fallback: most recent active verse
    const all = await ctx.db.query("dailyVerses").collect();
    const active = all
      .filter((v) => v.active)
      .sort((a, b) => b.date.localeCompare(a.date));
    return active[0] ?? null;
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("dailyVerses").collect();
    return all.sort((a, b) => b.date.localeCompare(a.date));
  },
});

export const create = mutation({
  args: {
    reference: v.string(),
    text: v.string(),
    imageUrl: v.optional(v.string()),
    date: v.string(),
    active: v.boolean(),
    requesterId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (args.requesterId) {
      const requester = await ctx.db.get(args.requesterId);
      if (!requester || requester.role !== "admin") return null;
    }
    const { requesterId, ...fields } = args;
    return await ctx.db.insert("dailyVerses", fields);
  },
});

export const update = mutation({
  args: {
    verseId: v.id("dailyVerses"),
    reference: v.optional(v.string()),
    text: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    date: v.optional(v.string()),
    active: v.optional(v.boolean()),
    requesterId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (args.requesterId) {
      const requester = await ctx.db.get(args.requesterId);
      if (!requester || requester.role !== "admin") return;
    }
    const { verseId, requesterId, ...fields } = args;
    await ctx.db.patch(verseId, fields);
  },
});

export const remove = mutation({
  args: {
    verseId: v.id("dailyVerses"),
    requesterId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (args.requesterId) {
      const requester = await ctx.db.get(args.requesterId);
      if (!requester || requester.role !== "admin") return;
    }
    await ctx.db.delete(args.verseId);
  },
});

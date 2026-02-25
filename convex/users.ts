import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("pastor"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { role: args.role });
  },
});

function levelFromXP(xp: number): number {
  if (xp >= 4200) return 10;
  if (xp >= 3300) return 9;
  if (xp >= 2500) return 8;
  if (xp >= 1850) return 7;
  if (xp >= 1300) return 6;
  if (xp >= 850) return 5;
  if (xp >= 500) return 4;
  if (xp >= 250) return 3;
  if (xp >= 100) return 2;
  return 1;
}

export const getOrCreateUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { imageUrl: args.imageUrl });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      imageUrl: args.imageUrl,
      xp: 0,
      level: 1,
      streak: 0,
      lastActiveDate: undefined,
      role: "member",
    });
  },
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

export const updateBio = mutation({
  args: { userId: v.id("users"), bio: v.string() },
  handler: async (ctx, { userId, bio }) => {
    await ctx.db.patch(userId, { bio });
  },
});

export const updatePastorProfile = mutation({
  args: {
    userId: v.id("users"),
    bio: v.string(),
    socialLinks: v.object({
      instagram: v.optional(v.string()),
      youtube: v.optional(v.string()),
      facebook: v.optional(v.string()),
      twitter: v.optional(v.string()),
      website: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { userId, bio, socialLinks }) => {
    await ctx.db.patch(userId, { bio, socialLinks });
  },
});

export const listPastors = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "pastor"))
      .collect();
  },
});

export const getMe = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

export const listLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users
      .sort((a, b) => b.xp - a.xp)
      .map(({ _id, name, imageUrl, xp, level, streak, role }) => ({
        _id, name, imageUrl, xp, level, streak, role,
      }));
  },
});

export const updateXPAndLevel = mutation({
  args: { userId: v.id("users"), xpToAdd: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    const newXP = user.xp + args.xpToAdd;
    const newLevel = levelFromXP(newXP);

    const today = new Date().toISOString().split("T")[0];
    const lastActive = user.lastActiveDate;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    let newStreak = user.streak;
    if (lastActive === today) {
      // already active today, no change
    } else if (lastActive === yesterday) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    await ctx.db.patch(args.userId, {
      xp: newXP,
      level: newLevel,
      streak: newStreak,
      lastActiveDate: today,
    });
  },
});

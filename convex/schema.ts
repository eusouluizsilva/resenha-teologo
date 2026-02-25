import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    socialLinks: v.optional(v.object({
      instagram: v.optional(v.string()),
      youtube: v.optional(v.string()),
      facebook: v.optional(v.string()),
      twitter: v.optional(v.string()),
      website: v.optional(v.string()),
    })),
    xp: v.number(),
    level: v.number(),
    streak: v.number(),
    lastActiveDate: v.optional(v.string()), // ISO date string e.g. "2024-01-15"
    role: v.union(v.literal("admin"), v.literal("pastor"), v.literal("member")),
  }).index("by_clerkId", ["clerkId"]),

  courses: defineTable({
    title: v.string(),
    description: v.string(),
    thumbnailUrl: v.optional(v.string()),
    welcomeVideoUrl: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("published")),
    createdAt: v.number(), // Unix timestamp
    createdBy: v.optional(v.id("users")),
  }),

  modules: defineTable({
    courseId: v.id("courses"),
    title: v.string(),
    order: v.number(),
  }).index("by_courseId", ["courseId"]),

  lessons: defineTable({
    moduleId: v.id("modules"),
    title: v.string(),
    videoUrl: v.string(),
    order: v.number(),
  }).index("by_moduleId", ["moduleId"]),

  quizzes: defineTable({
    lessonId: v.id("lessons"),
    questions: v.array(
      v.object({
        question: v.string(),
        options: v.array(v.string()),
        correctIndex: v.number(),
      })
    ),
  }).index("by_lessonId", ["lessonId"]),

  progress: defineTable({
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    completed: v.boolean(),
    quizScore: v.optional(v.number()),
    completedAt: v.optional(v.number()), // Unix timestamp
  })
    .index("by_userId", ["userId"])
    .index("by_userId_lessonId", ["userId", "lessonId"]),

  badges: defineTable({
    name: v.string(),
    description: v.string(),
    xpRequired: v.number(),
  }),

  userBadges: defineTable({
    userId: v.id("users"),
    badgeId: v.id("badges"),
    earnedAt: v.number(), // Unix timestamp
  })
    .index("by_userId", ["userId"])
    .index("by_userId_badgeId", ["userId", "badgeId"]),

  // Comments per lesson (Q&A thread)
  comments: defineTable({
    lessonId: v.id("lessons"),
    authorId: v.id("users"),
    parentId: v.optional(v.id("comments")), // null = top-level, set = reply
    body: v.string(),
    createdAt: v.number(),
  })
    .index("by_lessonId", ["lessonId"])
    .index("by_parentId", ["parentId"]),

  // Forum posts on the main community feed
  forumPosts: defineTable({
    authorId: v.id("users"),
    title: v.string(),
    body: v.string(),
    createdAt: v.number(),
    pinned: v.optional(v.boolean()),
  }).index("by_createdAt", ["createdAt"]),

  // Forum replies
  forumReplies: defineTable({
    postId: v.id("forumPosts"),
    authorId: v.id("users"),
    body: v.string(),
    createdAt: v.number(),
  }).index("by_postId", ["postId"]),

  // Course enrollments
  enrollments: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    enrolledAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_courseId", ["userId", "courseId"]),

  dailyVerses: defineTable({
    reference: v.string(),
    text: v.string(),
    imageUrl: v.optional(v.string()),
    date: v.string(), // "YYYY-MM-DD" — which day this verse is shown
    active: v.boolean(),
  }).index("by_date", ["date"]),

  announcements: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.string(),
    linkUrl: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),
});

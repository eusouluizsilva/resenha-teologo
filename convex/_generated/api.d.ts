/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as account from "../account.js";
import type * as admin from "../admin.js";
import type * as analytics from "../analytics.js";
import type * as bible from "../bible.js";
import type * as catalog from "../catalog.js";
import type * as certificates from "../certificates.js";
import type * as consents from "../consents.js";
import type * as courseAnalytics from "../courseAnalytics.js";
import type * as courseCoauthors from "../courseCoauthors.js";
import type * as courseComments from "../courseComments.js";
import type * as courseQuestions from "../courseQuestions.js";
import type * as courseTemplates from "../courseTemplates.js";
import type * as courses from "../courses.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as enrollments from "../enrollments.js";
import type * as flashcards from "../flashcards.js";
import type * as gamification from "../gamification.js";
import type * as generateCovers from "../generateCovers.js";
import type * as handles from "../handles.js";
import type * as http from "../http.js";
import type * as indexnow from "../indexnow.js";
import type * as institutions from "../institutions.js";
import type * as landingHighlights from "../landingHighlights.js";
import type * as learningPaths from "../learningPaths.js";
import type * as lessonComments from "../lessonComments.js";
import type * as lessonLikes from "../lessonLikes.js";
import type * as lessonMaterials from "../lessonMaterials.js";
import type * as lessonTimestamps from "../lessonTimestamps.js";
import type * as lessons from "../lessons.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_autoEnroll from "../lib/autoEnroll.js";
import type * as lib_slug from "../lib/slug.js";
import type * as modules from "../modules.js";
import type * as notebooks from "../notebooks.js";
import type * as notifications from "../notifications.js";
import type * as orders from "../orders.js";
import type * as postCategories from "../postCategories.js";
import type * as postComments from "../postComments.js";
import type * as postRanking from "../postRanking.js";
import type * as postReactions from "../postReactions.js";
import type * as postTags from "../postTags.js";
import type * as posts from "../posts.js";
import type * as products from "../products.js";
import type * as profileFollows from "../profileFollows.js";
import type * as publicProfiles from "../publicProfiles.js";
import type * as questionBank from "../questionBank.js";
import type * as quizzes from "../quizzes.js";
import type * as r2 from "../r2.js";
import type * as ratings from "../ratings.js";
import type * as reengagement from "../reengagement.js";
import type * as referrals from "../referrals.js";
import type * as requiredAssignments from "../requiredAssignments.js";
import type * as search from "../search.js";
import type * as seedBlog from "../seedBlog.js";
import type * as seedCourses from "../seedCourses.js";
import type * as seedDoutrinasBasicas from "../seedDoutrinasBasicas.js";
import type * as seedDoutrinasQuizzes from "../seedDoutrinasQuizzes.js";
import type * as sitemapData from "../sitemapData.js";
import type * as stripe from "../stripe.js";
import type * as student from "../student.js";
import type * as subscriptions from "../subscriptions.js";
import type * as testimonials from "../testimonials.js";
import type * as userFunctions from "../userFunctions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  account: typeof account;
  admin: typeof admin;
  analytics: typeof analytics;
  bible: typeof bible;
  catalog: typeof catalog;
  certificates: typeof certificates;
  consents: typeof consents;
  courseAnalytics: typeof courseAnalytics;
  courseCoauthors: typeof courseCoauthors;
  courseComments: typeof courseComments;
  courseQuestions: typeof courseQuestions;
  courseTemplates: typeof courseTemplates;
  courses: typeof courses;
  crons: typeof crons;
  email: typeof email;
  enrollments: typeof enrollments;
  flashcards: typeof flashcards;
  gamification: typeof gamification;
  generateCovers: typeof generateCovers;
  handles: typeof handles;
  http: typeof http;
  indexnow: typeof indexnow;
  institutions: typeof institutions;
  landingHighlights: typeof landingHighlights;
  learningPaths: typeof learningPaths;
  lessonComments: typeof lessonComments;
  lessonLikes: typeof lessonLikes;
  lessonMaterials: typeof lessonMaterials;
  lessonTimestamps: typeof lessonTimestamps;
  lessons: typeof lessons;
  "lib/auth": typeof lib_auth;
  "lib/autoEnroll": typeof lib_autoEnroll;
  "lib/slug": typeof lib_slug;
  modules: typeof modules;
  notebooks: typeof notebooks;
  notifications: typeof notifications;
  orders: typeof orders;
  postCategories: typeof postCategories;
  postComments: typeof postComments;
  postRanking: typeof postRanking;
  postReactions: typeof postReactions;
  postTags: typeof postTags;
  posts: typeof posts;
  products: typeof products;
  profileFollows: typeof profileFollows;
  publicProfiles: typeof publicProfiles;
  questionBank: typeof questionBank;
  quizzes: typeof quizzes;
  r2: typeof r2;
  ratings: typeof ratings;
  reengagement: typeof reengagement;
  referrals: typeof referrals;
  requiredAssignments: typeof requiredAssignments;
  search: typeof search;
  seedBlog: typeof seedBlog;
  seedCourses: typeof seedCourses;
  seedDoutrinasBasicas: typeof seedDoutrinasBasicas;
  seedDoutrinasQuizzes: typeof seedDoutrinasQuizzes;
  sitemapData: typeof sitemapData;
  stripe: typeof stripe;
  student: typeof student;
  subscriptions: typeof subscriptions;
  testimonials: typeof testimonials;
  userFunctions: typeof userFunctions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as announcements from "../announcements.js";
import type * as comments from "../comments.js";
import type * as courses from "../courses.js";
import type * as dailyVerses from "../dailyVerses.js";
import type * as enrollments from "../enrollments.js";
import type * as forum from "../forum.js";
import type * as lessons from "../lessons.js";
import type * as modules from "../modules.js";
import type * as progress from "../progress.js";
import type * as quizzes from "../quizzes.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  announcements: typeof announcements;
  comments: typeof comments;
  courses: typeof courses;
  dailyVerses: typeof dailyVerses;
  enrollments: typeof enrollments;
  forum: typeof forum;
  lessons: typeof lessons;
  modules: typeof modules;
  progress: typeof progress;
  quizzes: typeof quizzes;
  seed: typeof seed;
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

/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as catalog from "../catalog.js";
import type * as consents from "../consents.js";
import type * as courses from "../courses.js";
import type * as enrollments from "../enrollments.js";
import type * as handles from "../handles.js";
import type * as http from "../http.js";
import type * as institutions from "../institutions.js";
import type * as lessonComments from "../lessonComments.js";
import type * as lessonMaterials from "../lessonMaterials.js";
import type * as lessons from "../lessons.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_slug from "../lib/slug.js";
import type * as modules from "../modules.js";
import type * as notebooks from "../notebooks.js";
import type * as publicProfiles from "../publicProfiles.js";
import type * as quizzes from "../quizzes.js";
import type * as ratings from "../ratings.js";
import type * as student from "../student.js";
import type * as testimonials from "../testimonials.js";
import type * as userFunctions from "../userFunctions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  catalog: typeof catalog;
  consents: typeof consents;
  courses: typeof courses;
  enrollments: typeof enrollments;
  handles: typeof handles;
  http: typeof http;
  institutions: typeof institutions;
  lessonComments: typeof lessonComments;
  lessonMaterials: typeof lessonMaterials;
  lessons: typeof lessons;
  "lib/auth": typeof lib_auth;
  "lib/slug": typeof lib_slug;
  modules: typeof modules;
  notebooks: typeof notebooks;
  publicProfiles: typeof publicProfiles;
  quizzes: typeof quizzes;
  ratings: typeof ratings;
  student: typeof student;
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

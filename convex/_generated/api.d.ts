/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auditLog from "../auditLog.js";
import type * as billing from "../billing.js";
import type * as documents from "../documents.js";
import type * as email from "../email.js";
import type * as http from "../http.js";
import type * as pdfGeneration from "../pdfGeneration.js";
import type * as recipients from "../recipients.js";
import type * as signing from "../signing.js";
import type * as storage from "../storage.js";
import type * as templates from "../templates.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auditLog: typeof auditLog;
  billing: typeof billing;
  documents: typeof documents;
  email: typeof email;
  http: typeof http;
  pdfGeneration: typeof pdfGeneration;
  recipients: typeof recipients;
  signing: typeof signing;
  storage: typeof storage;
  templates: typeof templates;
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

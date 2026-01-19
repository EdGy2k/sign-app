import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

export const getOrCreate = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, { clerkId, email, name }) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (existingUser) {
      return existingUser._id;
    }

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      email,
      name,
      clerkId,
      plan: "free",
      subscriptionStatus: "none",
      billingCycleStart: now,
      createdAt: now,
    });

    return userId;
  },
});

export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existingUser) {
      return existingUser._id;
    }

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      email: identity.email ?? "",
      name: identity.name ?? "Unknown User",
      clerkId: identity.subject,
      plan: "free",
      subscriptionStatus: "none",
      billingCycleStart: now,
      createdAt: now,
    });

    return userId;
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return null;
    }

    const billingCycleStart = user.billingCycleStart;

    const documentsThisMonth = await ctx.db
      .query("documents")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .filter((q) => q.gte(q.field("createdAt"), billingCycleStart))
      .collect();

    return {
      ...user,
      documentsCreatedThisMonth: documentsThisMonth.length,
      documentsLimitThisMonth: user.plan === "free" ? 3 : Infinity,
    };
  },
});

export const updateProfile = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, { name }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, { name });

    return { success: true };
  },
});

export const uploadLogo = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { storageId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    if (user.plan !== "pro") {
      throw new Error("Logo upload is only available for Pro users");
    }

    const fileUrl = await ctx.storage.getUrl(storageId);
    if (!fileUrl) {
      throw new Error("Storage file does not exist");
    }

    await ctx.db.patch(user._id, { logoStorageId: storageId });

    return { success: true };
  },
});

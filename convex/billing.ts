import { v } from "convex/values";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { Polar } from "@polar-sh/sdk";
import { internal } from "./_generated/api";

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
});

const PRODUCT_IDS = {
  pro_monthly_usd: process.env.POLAR_PRODUCT_PRO_MONTHLY_USD || "",
  pro_monthly_eur: process.env.POLAR_PRODUCT_PRO_MONTHLY_EUR || "",
  pro_yearly_usd: process.env.POLAR_PRODUCT_PRO_YEARLY_USD || "",
  pro_yearly_eur: process.env.POLAR_PRODUCT_PRO_YEARLY_EUR || "",
} as const;

type ProductKey = keyof typeof PRODUCT_IDS;

export const createCheckoutUrl = action({
  args: {
    productKey: v.union(
      v.literal("pro_monthly_usd"),
      v.literal("pro_monthly_eur"),
      v.literal("pro_yearly_usd"),
      v.literal("pro_yearly_eur")
    ),
    successUrl: v.string(),
    returnUrl: v.optional(v.string()),
  },
  handler: async (ctx, { productKey, successUrl, returnUrl }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.runQuery(internal.billing.getUserByClerkId, {
      clerkId: identity.subject,
    });

    if (!user) {
      throw new Error("User not found");
    }

    const productId = PRODUCT_IDS[productKey as ProductKey];
    if (!productId) {
      throw new Error(`Invalid product key: ${productKey}`);
    }

    const checkout = await polar.checkouts.create({
      products: [productId],
      successUrl,
      returnUrl,
      customerEmail: user.email,
      externalCustomerId: user.clerkId,
      metadata: {
        clerkId: user.clerkId,
      },
    });

    return { checkoutUrl: checkout.url };
  },
});

export const getSubscription = query({
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

    return {
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      planExpiresAt: user.planExpiresAt,
      polarCustomerId: user.polarCustomerId,
    };
  },
});

export const getUserByClerkId = internalQuery({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, { clerkId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();
  },
});

export const upgradeToPro = internalMutation({
  args: {
    clerkId: v.string(),
    polarCustomerId: v.string(),
    planExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, { clerkId, polarCustomerId, planExpiresAt }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      plan: "pro",
      subscriptionStatus: "active",
      polarCustomerId,
      planExpiresAt,
    });

    return { success: true };
  },
});

export const updateSubscriptionStatus = internalMutation({
  args: {
    polarCustomerId: v.string(),
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("past_due"),
      v.literal("cancelled"),
      v.literal("none")
    ),
    planExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, { polarCustomerId, subscriptionStatus, planExpiresAt }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_polar_customer_id", (q) =>
        q.eq("polarCustomerId", polarCustomerId)
      )
      .unique();

    if (!user) {
      throw new Error("User not found with polarCustomerId");
    }

    await ctx.db.patch(user._id, {
      subscriptionStatus,
      planExpiresAt,
    });

    return { success: true };
  },
});

export const downgradeToFree = internalMutation({
  args: {
    polarCustomerId: v.string(),
  },
  handler: async (ctx, { polarCustomerId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_polar_customer_id", (q) =>
        q.eq("polarCustomerId", polarCustomerId)
      )
      .unique();

    if (!user) {
      throw new Error("User not found with polarCustomerId");
    }

    await ctx.db.patch(user._id, {
      plan: "free",
      subscriptionStatus: "none",
      planExpiresAt: undefined,
    });

    return { success: true };
  },
});

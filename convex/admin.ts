import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

const isAuthorized = async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
        .unique();

    if (!user || user.role !== "admin") return null;
    return user;
};

export const getStats = query({
    args: {},
    handler: async (ctx) => {
        const admin = await isAuthorized(ctx);
        if (!admin) throw new Error("Unauthorized");

        const users = await ctx.db.query("users").collect();
        const documents = await ctx.db.query("documents").collect();

        const totalUsers = users.length;
        const proUsers = users.filter((u) => u.plan === "pro").length;
        const totalDocuments = documents.length;
        const signedDocuments = documents.filter((d) => d.status === "signed").length;

        return {
            totalUsers,
            proUsers,
            totalDocuments,
            signedDocuments,
        };
    },
});

export const listUsers = query({
    args: {},
    handler: async (ctx) => {
        const admin = await isAuthorized(ctx);
        if (!admin) throw new Error("Unauthorized");

        return await ctx.db.query("users").order("desc").take(100);
    },
});

export const listDocuments = query({
    args: {},
    handler: async (ctx) => {
        const admin = await isAuthorized(ctx);
        if (!admin) throw new Error("Unauthorized");

        // Fetch documents with owner info
        const docs = await ctx.db.query("documents").order("desc").take(100);

        // We'd ideally want to join with users to get owner names, but for now just raw data is okay 
        // or we fetch owners in parallel.
        // Let's keep it simple for MVP.
        // Actually, listing owner email/name is useful.

        const docsWithOwners = await Promise.all(docs.map(async (doc) => {
            const owner = await ctx.db.get(doc.ownerId);
            return {
                ...doc,
                ownerName: owner?.name || "Unknown",
                ownerEmail: owner?.email || "Unknown",
            };
        }));

        return docsWithOwners;
    },
});

export const updateUserRole = mutation({
    args: {
        userId: v.id("users"),
        role: v.union(v.literal("user"), v.literal("admin")),
    },
    handler: async (ctx, { userId, role }) => {
        const admin = await isAuthorized(ctx);
        if (!admin) throw new Error("Unauthorized");

        await ctx.db.patch(userId, { role });
    },
});

export const updateUserPlan = mutation({
    args: {
        userId: v.id("users"),
        plan: v.union(v.literal("free"), v.literal("pro")),
    },
    handler: async (ctx, { userId, plan }) => {
        const admin = await isAuthorized(ctx);
        if (!admin) throw new Error("Unauthorized");

        await ctx.db.patch(userId, {
            plan,
            subscriptionStatus: plan === "pro" ? "active" : "none"
        });
    },
});

export const banUser = mutation({
    args: {
        userId: v.id("users"),
        isBanned: v.boolean(),
    },
    handler: async (ctx, { userId, isBanned }) => {
        const admin = await isAuthorized(ctx);
        if (!admin) throw new Error("Unauthorized");

        await ctx.db.patch(userId, { isBanned });
    },
});

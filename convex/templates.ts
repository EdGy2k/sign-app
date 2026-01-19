import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listSystem = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("templates")
      .withIndex("by_system_template", (q) => q.eq("isSystemTemplate", true))
      .collect();
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
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

    return await ctx.db
      .query("templates")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();
  },
});

export const get = query({
  args: {
    id: v.id("templates"),
  },
  handler: async (ctx, { id }) => {
    const template = await ctx.db.get(id);

    if (!template) {
      throw new Error("Template not found");
    }

    if (!template.isSystemTemplate) {
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

      if (template.ownerId !== user._id) {
        throw new Error("Not authorized to view this template");
      }
    }

    return template;
  },
});

export const createCustom = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("contract"),
      v.literal("nda"),
      v.literal("proposal"),
      v.literal("invoice"),
      v.literal("other")
    ),
    pdfStorageId: v.string(),
    fields: v.array(
      v.object({
        id: v.string(),
        type: v.union(
          v.literal("signature"),
          v.literal("date"),
          v.literal("text"),
          v.literal("initials"),
          v.literal("checkbox")
        ),
        label: v.string(),
        x: v.number(),
        y: v.number(),
        width: v.number(),
        height: v.number(),
        page: v.number(),
        assignedTo: v.union(
          v.literal("sender"),
          v.literal("recipient"),
          v.literal("recipient_2"),
          v.literal("recipient_3")
        ),
        required: v.boolean(),
      })
    ),
    variables: v.array(
      v.object({
        name: v.string(),
        label: v.string(),
        type: v.union(
          v.literal("text"),
          v.literal("date"),
          v.literal("textarea")
        ),
        defaultValue: v.optional(v.string()),
        required: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
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

    const templateId = await ctx.db.insert("templates", {
      name: args.name,
      description: args.description,
      category: args.category,
      isSystemTemplate: false,
      ownerId: user._id,
      pdfStorageId: args.pdfStorageId,
      fields: args.fields,
      variables: args.variables,
    });

    return templateId;
  },
});

export const update = mutation({
  args: {
    id: v.id("templates"),
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("contract"),
      v.literal("nda"),
      v.literal("proposal"),
      v.literal("invoice"),
      v.literal("other")
    ),
    pdfStorageId: v.string(),
    fields: v.array(
      v.object({
        id: v.string(),
        type: v.union(
          v.literal("signature"),
          v.literal("date"),
          v.literal("text"),
          v.literal("initials"),
          v.literal("checkbox")
        ),
        label: v.string(),
        x: v.number(),
        y: v.number(),
        width: v.number(),
        height: v.number(),
        page: v.number(),
        assignedTo: v.union(
          v.literal("sender"),
          v.literal("recipient"),
          v.literal("recipient_2"),
          v.literal("recipient_3")
        ),
        required: v.boolean(),
      })
    ),
    variables: v.array(
      v.object({
        name: v.string(),
        label: v.string(),
        type: v.union(
          v.literal("text"),
          v.literal("date"),
          v.literal("textarea")
        ),
        defaultValue: v.optional(v.string()),
        required: v.boolean(),
      })
    ),
  },
  handler: async (ctx, { id, ...updates }) => {
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

    const template = await ctx.db.get(id);
    if (!template) {
      throw new Error("Template not found");
    }

    if (template.isSystemTemplate) {
      throw new Error("Cannot update system templates");
    }

    if (template.ownerId !== user._id) {
      throw new Error("Not authorized to update this template");
    }

    await ctx.db.patch(id, updates);

    return { success: true };
  },
});

export const deleteTemplate = mutation({
  args: {
    id: v.id("templates"),
  },
  handler: async (ctx, { id }) => {
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

    const template = await ctx.db.get(id);
    if (!template) {
      throw new Error("Template not found");
    }

    if (template.isSystemTemplate) {
      throw new Error("Cannot delete system templates");
    }

    if (template.ownerId !== user._id) {
      throw new Error("Not authorized to delete this template");
    }

    await ctx.db.delete(id);

    return { success: true };
  },
});

export const seedSystemTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const existingTemplates = await ctx.db
      .query("templates")
      .withIndex("by_system_template", (q) => q.eq("isSystemTemplate", true))
      .collect();

    if (existingTemplates.length > 0) {
      return { message: "System templates already seeded", count: existingTemplates.length };
    }

    const systemTemplates = [
      {
        name: "Freelance Contract",
        description: "Standard freelance service agreement template with payment terms, deliverables, and intellectual property clauses.",
        category: "contract" as const,
        pdfStorageId: "placeholder_freelance_contract",
        fields: [
          {
            id: "client_signature",
            type: "signature" as const,
            label: "Client Signature",
            x: 100,
            y: 700,
            width: 200,
            height: 50,
            page: 1,
            assignedTo: "recipient" as const,
            required: true,
          },
          {
            id: "freelancer_signature",
            type: "signature" as const,
            label: "Freelancer Signature",
            x: 350,
            y: 700,
            width: 200,
            height: 50,
            page: 1,
            assignedTo: "sender" as const,
            required: true,
          },
          {
            id: "contract_date",
            type: "date" as const,
            label: "Contract Date",
            x: 100,
            y: 650,
            width: 150,
            height: 30,
            page: 1,
            assignedTo: "sender" as const,
            required: true,
          },
        ],
        variables: [
          {
            name: "client_name",
            label: "Client Name",
            type: "text" as const,
            required: true,
          },
          {
            name: "project_description",
            label: "Project Description",
            type: "textarea" as const,
            required: true,
          },
          {
            name: "payment_amount",
            label: "Payment Amount",
            type: "text" as const,
            required: true,
          },
          {
            name: "delivery_date",
            label: "Delivery Date",
            type: "date" as const,
            required: true,
          },
        ],
      },
      {
        name: "Non-Disclosure Agreement",
        description: "Mutual NDA to protect confidential information shared between parties during business discussions.",
        category: "nda" as const,
        pdfStorageId: "placeholder_nda",
        fields: [
          {
            id: "party_a_signature",
            type: "signature" as const,
            label: "Party A Signature",
            x: 100,
            y: 700,
            width: 200,
            height: 50,
            page: 1,
            assignedTo: "sender" as const,
            required: true,
          },
          {
            id: "party_b_signature",
            type: "signature" as const,
            label: "Party B Signature",
            x: 350,
            y: 700,
            width: 200,
            height: 50,
            page: 1,
            assignedTo: "recipient" as const,
            required: true,
          },
          {
            id: "agreement_date",
            type: "date" as const,
            label: "Agreement Date",
            x: 100,
            y: 650,
            width: 150,
            height: 30,
            page: 1,
            assignedTo: "sender" as const,
            required: true,
          },
        ],
        variables: [
          {
            name: "party_a_name",
            label: "Party A Name",
            type: "text" as const,
            required: true,
          },
          {
            name: "party_b_name",
            label: "Party B Name",
            type: "text" as const,
            required: true,
          },
          {
            name: "effective_date",
            label: "Effective Date",
            type: "date" as const,
            required: true,
          },
          {
            name: "disclosure_purpose",
            label: "Purpose of Disclosure",
            type: "textarea" as const,
            required: true,
          },
        ],
      },
      {
        name: "Project Proposal",
        description: "Professional project proposal template including scope, timeline, budget, and terms.",
        category: "proposal" as const,
        pdfStorageId: "placeholder_project_proposal",
        fields: [
          {
            id: "client_approval_signature",
            type: "signature" as const,
            label: "Client Approval Signature",
            x: 100,
            y: 700,
            width: 200,
            height: 50,
            page: 1,
            assignedTo: "recipient" as const,
            required: true,
          },
          {
            id: "proposal_date",
            type: "date" as const,
            label: "Proposal Date",
            x: 100,
            y: 650,
            width: 150,
            height: 30,
            page: 1,
            assignedTo: "sender" as const,
            required: true,
          },
          {
            id: "terms_acceptance",
            type: "checkbox" as const,
            label: "I accept the terms and conditions",
            x: 100,
            y: 600,
            width: 20,
            height: 20,
            page: 1,
            assignedTo: "recipient" as const,
            required: true,
          },
        ],
        variables: [
          {
            name: "client_company",
            label: "Client Company",
            type: "text" as const,
            required: true,
          },
          {
            name: "project_name",
            label: "Project Name",
            type: "text" as const,
            required: true,
          },
          {
            name: "project_scope",
            label: "Project Scope",
            type: "textarea" as const,
            required: true,
          },
          {
            name: "total_budget",
            label: "Total Budget",
            type: "text" as const,
            required: true,
          },
          {
            name: "timeline",
            label: "Project Timeline",
            type: "text" as const,
            required: true,
          },
        ],
      },
      {
        name: "Photography Contract",
        description: "Photography service agreement covering shoot details, deliverables, usage rights, and payment.",
        category: "contract" as const,
        pdfStorageId: "placeholder_photography_contract",
        fields: [
          {
            id: "photographer_signature",
            type: "signature" as const,
            label: "Photographer Signature",
            x: 100,
            y: 700,
            width: 200,
            height: 50,
            page: 1,
            assignedTo: "sender" as const,
            required: true,
          },
          {
            id: "client_signature",
            type: "signature" as const,
            label: "Client Signature",
            x: 350,
            y: 700,
            width: 200,
            height: 50,
            page: 1,
            assignedTo: "recipient" as const,
            required: true,
          },
          {
            id: "photographer_initials",
            type: "initials" as const,
            label: "Photographer Initials",
            x: 100,
            y: 650,
            width: 60,
            height: 30,
            page: 1,
            assignedTo: "sender" as const,
            required: true,
          },
          {
            id: "client_initials",
            type: "initials" as const,
            label: "Client Initials",
            x: 200,
            y: 650,
            width: 60,
            height: 30,
            page: 1,
            assignedTo: "recipient" as const,
            required: true,
          },
        ],
        variables: [
          {
            name: "client_name",
            label: "Client Name",
            type: "text" as const,
            required: true,
          },
          {
            name: "shoot_location",
            label: "Shoot Location",
            type: "text" as const,
            required: true,
          },
          {
            name: "shoot_date",
            label: "Shoot Date",
            type: "date" as const,
            required: true,
          },
          {
            name: "package_details",
            label: "Package Details",
            type: "textarea" as const,
            required: true,
          },
          {
            name: "total_fee",
            label: "Total Fee",
            type: "text" as const,
            required: true,
          },
        ],
      },
      {
        name: "Web Design Contract",
        description: "Web design and development contract template including project milestones, revisions, and ownership terms.",
        category: "contract" as const,
        pdfStorageId: "placeholder_web_design_contract",
        fields: [
          {
            id: "designer_signature",
            type: "signature" as const,
            label: "Designer Signature",
            x: 100,
            y: 700,
            width: 200,
            height: 50,
            page: 1,
            assignedTo: "sender" as const,
            required: true,
          },
          {
            id: "client_signature",
            type: "signature" as const,
            label: "Client Signature",
            x: 350,
            y: 700,
            width: 200,
            height: 50,
            page: 1,
            assignedTo: "recipient" as const,
            required: true,
          },
          {
            id: "contract_date",
            type: "date" as const,
            label: "Contract Date",
            x: 100,
            y: 650,
            width: 150,
            height: 30,
            page: 1,
            assignedTo: "sender" as const,
            required: true,
          },
        ],
        variables: [
          {
            name: "client_business_name",
            label: "Client Business Name",
            type: "text" as const,
            required: true,
          },
          {
            name: "website_url",
            label: "Website URL",
            type: "text" as const,
            required: false,
          },
          {
            name: "project_scope",
            label: "Project Scope",
            type: "textarea" as const,
            required: true,
          },
          {
            name: "number_of_pages",
            label: "Number of Pages",
            type: "text" as const,
            required: true,
          },
          {
            name: "number_of_revisions",
            label: "Number of Revisions Included",
            type: "text" as const,
            defaultValue: "3",
            required: true,
          },
          {
            name: "project_fee",
            label: "Project Fee",
            type: "text" as const,
            required: true,
          },
          {
            name: "completion_date",
            label: "Expected Completion Date",
            type: "date" as const,
            required: true,
          },
        ],
      },
    ];

    const templateIds = [];
    for (const template of systemTemplates) {
      const templateId = await ctx.db.insert("templates", {
        ...template,
        isSystemTemplate: true,
      });
      templateIds.push(templateId);
    }

    return {
      message: "System templates seeded successfully",
      count: templateIds.length,
      templateIds,
    };
  },
});

# Convex Setup

This project uses Convex as the backend database.

## Initial Setup

The schema has been defined in `convex/schema.ts` with the following tables:
- users
- templates
- documents
- recipients
- auditLog

## Deployment

To deploy the schema to Convex:

1. Run `npx convex dev` to start development mode (requires authentication)
2. Or run `npx convex deploy` to deploy to production

Note: On first run, you'll need to:
- Authenticate with your Convex account
- Create or select a project
- The schema will be automatically deployed

## Schema Verification

The schema has been verified to compile without TypeScript errors.

# Deployment Guide

This guide will help you deploy your **Sign App** to Vercel, along with its Convex backend.

## Prerequisites

- [Vercel Account](https://vercel.com/signup)
- [Convex Account](https://convex.dev)
- [Clerk Account](https://clerk.com) (for production keys)

## Step 1: Deploy Convex Backend

Before deploying the frontend, you need to deploy your Convex functions and schema to a production environment.

1. Run the following command in your terminal:
   ```bash
   npx convex deploy
   ```
   *This command will ask you to create a production deployment if you haven't already.*

2. Once completed, it will output environment variables similar to these:
   - `CONVEX_DEPLOYMENT`
   - `NEXT_PUBLIC_CONVEX_URL`

   **Save these values**, you will need them for Vercel.

## Step 2: Prepare Environment Variables

You need to gather all the environment variables for your production environment.

**1. Convex:**
   - `CONVEX_DEPLOYMENT` (from Step 1)
   - `NEXT_PUBLIC_CONVEX_URL` (from Step 1)

**2. Clerk (Authentication):**
   - Go to your Clerk Dashboard -> API Keys.
   - Switch to **Production** instance (or create one).
   - Copy:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`
     - `CLERK_ISSUER_URL`
   - Set Redirect URLs in Clerk Production:
     - Sign-in: `https://<your-vercel-domain>/sign-in`
     - Sign-up: `https://<your-vercel-domain>/sign-up`
     - After sign-in/up: `https://<your-vercel-domain>/dashboard`

**3. Resend (Email):**
   - get a live API key from Resend.
   - `RESEND_API_KEY`

**4. Polar (Payments):**
   - `POLAR_ACCESS_TOKEN`
   - `POLAR_WEBHOOK_SECRET`
   - `POLAR_PRODUCT_PRO_MONTHLY_USD`
   - `POLAR_PRODUCT_PRO_MONTHLY_EUR`
   - `POLAR_PRODUCT_PRO_YEARLY_USD`
   - `POLAR_PRODUCT_PRO_YEARLY_EUR`

**5. App Setup:**
   - `APP_URL`: Set this to your Vercel domain (e.g., `https://sign-app.vercel.app`)

## Step 3: Deploy to Vercel

You can deploy using the Vercel CLI or via the Vercel Dashboard (Git Integration).

### Option A: Using Vercel CLI (Fastest)

1. Run the deployment command:
   ```bash
   npx vercel
   ```

2. Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? **(Select your account)**
   - Link to existing project? **No**
   - Project Name: **sign-app**
   - In which directory is your code located? **./**
   - Want to modify these settings? **No**

3. **Environment Variables:**
   - The CLI might ask to import env vars. You can say **No** and add them in the dashboard later, OR say **Yes** and paste them one by one.
   - *Recommendation:* It's often easier to add them in the Vercel Dashboard after the first failed build, or assume the first build might fail if variables are missing.

### Option B: Using Git Integration (Recommended for CI/CD)

1. Push your code to a GitHub repository.
2. Go to [Vercel Dashboard](https://vercel.com/new).
3. Import your repository.
4. Open the **Environment Variables** section and add all keys from Step 2.
5. Click **Deploy**.

## Step 4: Post-Deployment

1. **Update URLs:**
   - Go back to Clerk and ensure the "Home URL", "Sign-in URL", and "Sign-up URL" match your new Vercel domain.
   - Update `APP_URL` in Vercel if it changed.

2. **Webhooks:**
   - If you use Polar or Clerk webhooks, update the endpoint URLs in their respective dashboards to point to your Vercel app (e.g., `https://your-app.vercel.app/api/webhooks/...`).

3. **Test:**
   - Verify login works.
   - Verify database references (Create a document).

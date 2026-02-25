# Setup Guide

Follow these steps before running the project for the first time.

---

## 1. Create a Clerk Application

1. Go to [https://clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Choose **Email/Password** (and any social providers you want)
4. Go to **API Keys** in the Clerk dashboard
5. Copy the **Publishable Key** and paste it into `.env.local`:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

---

## 2. Create a Convex Project

1. Install the Convex CLI if you haven't:
   ```bash
   npm install -g convex
   ```
2. In the project root, run:
   ```bash
   npx convex dev
   ```
3. Follow the prompts to log in and create a new Convex project
4. Once initialized, Convex will automatically add `VITE_CONVEX_URL` to your `.env.local`

---

## 3. Configure Clerk JWT Template for Convex

This is required so Convex can verify Clerk tokens.

1. In the **Clerk dashboard**, go to **JWT Templates**
2. Click **New template** and select **Convex**
3. Copy the **Issuer URL** shown (looks like `https://xxx.clerk.accounts.dev`)
4. In the **Convex dashboard** ([dashboard.convex.dev](https://dashboard.convex.dev)):
   - Go to your project → **Settings** → **Authentication**
   - Click **Add authentication provider**
   - Select **Clerk** and paste the Issuer URL
5. Save — Convex will now accept Clerk JWTs

---

## 4. Run the project

```bash
# Terminal 1 — Convex dev server (keeps schema in sync)
npx convex dev

# Terminal 2 — Vite dev server
npm run dev
```

---

## Environment Variables Reference

| Variable | Where to find it |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API Keys |
| `VITE_CONVEX_URL` | Auto-added by `npx convex dev` |

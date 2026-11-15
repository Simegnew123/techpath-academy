# 🎓 TechPath Academy — Your Learning Website (LMS)

A complete learning management system for your training business:
IT Support, Networking, Database Administration, Cyber Security, and Ethical Hacking.

## ✅ What's included

- **Course catalog** — browse courses, filter by category (free/paid)
- **Student accounts** — sign up, log in, track progress
- **Free tutorials** — visible to everyone (great for marketing/SEO)
- **Paid courses** — locked until purchase
- **Checkout** — payments via **Card, M-Pesa** (Flutterwave) + built-in **demo mode** for testing
- **Admin dashboard** — add/edit courses with a simple form (no coding!)

## 🚀 How to run it (3 steps)

1. **Open a terminal** in this folder (`lms`)
2. Run this command:
   ```
   npm run dev
   ```
3. Open your browser at: **http://localhost:3000**

That's it. Your website is live on your computer.

## 👤 First steps (5 minutes)

1. Open **http://localhost:3000/register** and create an account.
   - ⚠️ **The very first account becomes the ADMIN (you).**
2. Click **Admin** in the top menu.
3. Click **+ New course**, fill in the details, add lessons, tick **Publish**, and save.
4. Go to the catalog — your course is live!

Demo courses are already loaded so you can see how everything works.
Delete them from the Admin panel if you don't want them.

## 💳 Getting real payments (later, when ready to go live)

The website works in **demo mode** right now (simulated payments, no real money).
To accept real payments:

1. Create a free account at [Flutterwave](https://flutterwave.com) (works with M-Pesa + cards).
2. Copy `.env.example` to a new file called `.env.local`.
3. Fill in your Flutterwave keys:
   ```
   PAYMENT_MODE=live
   FLW_PUBLIC_KEY=pk_...
   FLW_SECRET_KEY=fls_...
   SITE_URL=https://your-domain.com
   ```
4. Deploy the website online (see below), then payments go live.

## 🌍 Going online (when you're ready)

The easiest way to publish your website on the internet:

1. Install [Git](https://git-scm.com/download/win) and create a free account at [Vercel](https://vercel.com).
2. Run these commands in this folder:
   ```
   npx vercel
   ```
3. Follow the prompts — Vercel gives you a free public URL like `your-site.vercel.app`.

> ⚠️ When going live, you'll also want a real database (free options exist) —
> we can set that up together when you reach this step. The local file database is perfect for testing.

## 📁 Project structure (short version)

- `src/app/` — pages (home, courses, admin, dashboard, checkout)
- `src/components/` — UI building blocks
- `src/lib/` — data storage & business logic
- `data/db.json` — **your website's data** (created automatically)
- `smoketest.js` — internal test script (safe to delete)

## ❓ Questions?

Happy to help — just ask. Common next features we can add later:
student quiz results, certificates, email notifications, live-class calendar, coupons.

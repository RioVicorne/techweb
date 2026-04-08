# RioShop

Next.js shop demo upgraded to:

- **Supabase Orders**: create/fetch orders via server API routes
- **Stripe Checkout**: redirect to Stripe to pay (optional)

## 1) Supabase setup

1. Create a Supabase project.
2. Run SQL in `supabase/schema.sql` (SQL editor).
3. Put these into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

> The app uses the **service role key only on the server** (API routes) to bypass RLS.

## 2) Stripe setup (optional)

1. Create a Stripe account + get your secret key.
2. Add to `.env.local`:

```bash
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Checkout flow:

- `POST /api/orders` creates an order in Supabase (falls back to local storage if Supabase isn't configured)
- `POST /api/stripe/checkout-session` creates a Stripe Checkout session and returns `url`

## Run locally

```bash
npm install
npm run dev
```


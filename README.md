This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# Google sign-in setup

1. Create a Google OAuth 2.0 **Web application** client in Google Cloud Console and add your frontend origins (for local development, `http://localhost:3000`) to **Authorized JavaScript origins**.
2. Copy `client/.env.example` to `client/.env.local` and set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to that client ID and `NEXT_PUBLIC_API_URL` to the Express server URL.
3. Copy `server/.env.example` to `server/.env` and set the same `GOOGLE_CLIENT_ID`, a strong random `JWT_SECRET`, and your `MONGO_URI`. Set `CLIENT_URL` to the frontend origin.
4. Install server dependencies with `npm install` in `server/`, then start it with `npm run dev`. Start the frontend with `npm run dev` in `client/`.

The frontend receives a Google ID token from Google Identity Services and posts it to `POST /api/auth/google`. The server verifies the token against the configured client ID, creates or loads the MongoDB user, and returns a seven-day JWT. The starter UI stores that JWT in local storage; production apps should prefer a secure, HTTP-only cookie session.

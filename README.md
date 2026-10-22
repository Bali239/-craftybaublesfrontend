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
2. Set `NEXT_PUBLIC_API_URL` in `client/.env` to the Express server URL.
3. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `MONGO_URI` in `server/.env`. Set `GOOGLE_REDIRECT_URI` to `http://localhost:5000/api/auth/google/callaback` and `CLIENT_URL` to `http://localhost:3000`.
4. Install server dependencies with `npm install` in `server/`, then start it with `npm run dev`. Start the frontend with `npm run dev` in `client/`.

The frontend redirects to `GET /api/auth/google`. The server starts Google's authorization-code flow, validates the returned `state`, exchanges the authorization code for tokens, verifies the ID token, and requests the user profile from Google's OpenID Connect userinfo endpoint. The callback creates or updates the MongoDB user (name, username, email, photo URL, provider, verified-email status, and last login) and creates a seven-day session. MongoDB stores only a hash of the opaque app session token, along with expiry, last activity, user agent, and IP address. The app bearer token is returned to the frontend in the URL fragment and then kept in local storage; it is sent in the `Authorization: Bearer` header to `GET /api/auth/me` and `POST /api/auth/logout`. Logout deletes the session document, revoking that token.

In Google Cloud Console, add this exact URI under the OAuth client's **Authorized redirect URIs**: `http://localhost:5000/api/auth/google/callaback`. Google requires an exact match, including scheme and path. This project uses the spelling `callaback` in the route to match the URL above.

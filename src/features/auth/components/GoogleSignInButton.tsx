"use client";

import { Button, type ButtonProps } from "antd";
import { API_URL } from "../../../lib/api";

type GoogleSignInButtonProps = Omit<ButtonProps, "href" | "onClick">;
// Google sign in button that redirects to the Google OAuth flow. The button will redirect to the API route that handles the OAuth flow, and then the API route will redirect back to the client with the appropriate tokens.
export default function GoogleSignInButton(props: GoogleSignInButtonProps) {
  const beginSignIn = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    const returnTo = `${window.location.pathname}${window.location.search}`;
    const authorizationUrl = new URL("/api/auth/google", API_URL);
    authorizationUrl.searchParams.set("returnTo", returnTo);
    window.location.assign(authorizationUrl.toString());
  };

  return (
    <Button
      {...props}
      className={`cursor-pointer disabled:cursor-not-allowed ${props.className || ""}`}
      href={`${API_URL}/api/auth/google`}
      onClick={beginSignIn}
    />
  );
}

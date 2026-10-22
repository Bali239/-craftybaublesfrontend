"use client";

import { Button, type ButtonProps } from "antd";
import { API_URL } from "../lib/api";

type GoogleSignInButtonProps = Omit<ButtonProps, "href" | "onClick">;

export default function GoogleSignInButton(props: GoogleSignInButtonProps) {
  const beginSignIn = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    const returnTo = `${window.location.pathname}${window.location.search}`;
    const authorizationUrl = new URL("/api/auth/google", API_URL);
    authorizationUrl.searchParams.set("returnTo", returnTo);
    window.location.assign(authorizationUrl.toString());
  };

  return <Button {...props} href={`${API_URL}/api/auth/google`} onClick={beginSignIn} />;
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "antd";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { api, type Product, type WishlistPage } from "../lib/api";
import { readSession } from "../lib/session";
import { useEffect, useState } from "react";

type WishlistButtonProps = {
  productId: string;
  productName: string;
  showLabel?: boolean;
  className?: string;
};

export default function WishlistButton({ productId, productName, showLabel = false, className = "" }: WishlistButtonProps) {
  const client = useQueryClient();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSignedIn(Boolean(readSession())), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const wishlist = useQuery({ queryKey: ["wishlist", "membership"], queryFn: () => api<WishlistPage>("/api/wishlist?limit=100"), enabled: signedIn });
  const saved = wishlist.data?.items?.some((product) => product._id === productId) || false;
  const toggle = useMutation({
    mutationFn: ({ add }: { add: boolean }) => api<Product[]>(`/api/wishlist/${productId}`, { method: add ? "POST" : "DELETE" }),
    onSuccess: async (_items, variables) => {
      await client.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(variables.add ? `${productName} added to your wishlist.` : `${productName} removed from your wishlist.`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return <Button
    type={showLabel ? "default" : "text"}
    shape={showLabel ? undefined : "circle"}
    aria-label={saved ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
    aria-pressed={saved}
    title={saved ? "Remove from wishlist" : "Add to wishlist"}
    loading={toggle.isPending}
    disabled={toggle.isPending}
    onClick={(event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!readSession()) {
        toast.info("Sign in to save products to your wishlist.");
        return;
      }
      toggle.mutate({ add: !saved });
    }}
    icon={<Heart size={17} className={saved ? "fill-current text-rose-600" : ""} />}
    className={`${showLabel ? "" : "bg-white/95 shadow-sm"} cursor-pointer disabled:cursor-not-allowed ${className}`}
  >{showLabel && (saved ? "Saved to wishlist" : "Add to wishlist")}</Button>;
}

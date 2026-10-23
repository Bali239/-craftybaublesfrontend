"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Skeleton } from "antd";
import { ArrowLeft, Heart, ShoppingBag } from "lucide-react";
import { api, formatPrice, type Product } from "../../lib/api";
import { readSession } from "../../lib/session";
import GoogleSignInButton from "../../components/GoogleSignInButton";
import WishlistButton from "../../components/WishlistButton";

export default function WishlistPage() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    const task = window.setTimeout(() => setSignedIn(Boolean(readSession())), 0);
    return () => window.clearTimeout(task);
  }, []);

  const wishlist = useQuery({ queryKey: ["wishlist"], queryFn: () => api<Product[]>("/api/wishlist"), enabled: signedIn });
  const products = wishlist.data || [];

  return <div className="min-h-screen bg-[#fbfaf7] [&_a]:cursor-pointer [&_button:not(:disabled)]:cursor-pointer [&_img]:cursor-pointer">
    <main className="mx-auto max-w-6xl px-5 pb-12">
      <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-[#737866] transition-colors hover:text-[#303429]"><ArrowLeft size={16} /> Continue shopping</Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-b border-[#e8e6de] pb-6">
        <div><p className="text-xs uppercase tracking-[0.18em] text-[#858978]">Saved for later</p><h1 className="mt-2 font-serif text-4xl text-[#303429] sm:text-5xl">My wishlist</h1></div>
        {products.length > 0 && <p className="text-sm text-[#777b6d]">{products.length} {products.length === 1 ? "item" : "items"}</p>}
      </div>

      {!signedIn ? <div className="mt-8 rounded-2xl border border-[#e7e5dc] bg-white px-6 py-12 text-center shadow-sm">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#f2f1eb] text-[#697457]"><Heart size={24} /></div>
        <h2 className="mt-5 font-serif text-2xl text-[#303429]">Sign in to view your wishlist</h2>
        <p className="mx-auto mb-5 mt-2 max-w-md text-sm leading-6 text-[#777b6d]">Your saved products are kept with your account so you can find them again later.</p>
        <GoogleSignInButton type="primary">Sign in to continue</GoogleSignInButton>
      </div> : wishlist.isLoading ? <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="rounded-2xl border border-[#e8e6de] bg-white p-4"><Skeleton active /></div>)}</div> : wishlist.error ? <Alert className="mt-8" type="error" showIcon title={(wishlist.error as Error).message} /> : products.length === 0 ? <div className="mt-8 rounded-2xl border border-[#e8e6de] bg-white px-6 py-14 text-center shadow-sm">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#f2f1eb] text-[#697457]"><ShoppingBag size={24} /></div>
        <h2 className="mt-5 font-serif text-2xl text-[#303429]">Your wishlist is empty</h2>
        <p className="mt-2 text-sm text-[#777b6d]">Save products you love and they’ll be waiting here.</p>
        <Button type="primary" size="large" className="mt-6" href="/shop">Explore the collection</Button>
      </div> : <div className="mt-8 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => <article key={product._id} className="group relative rounded-2xl border border-[#e8e6de] bg-white p-3 transition duration-200 hover:-translate-y-0.5 hover:border-[#cfd2c4] hover:shadow-lg hover:shadow-[#303429]/[0.06]">
          <Link href={`/products/${product.slug}`} className="block">
            <div className="relative aspect-[4/4.5] overflow-hidden rounded-xl bg-[#efeee8]">
              {product.images?.[0]?.secureUrl ? <Image fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" src={product.images[0].secureUrl} alt={product.images[0].altText || product.name} className="object-cover transition-transform duration-500 group-hover:scale-[1.035]" /> : <div className="grid size-full place-items-center font-serif text-5xl text-[#b3b5a9]">N.</div>}
              {product.discountPercent > 0 && <span className="absolute left-3 top-3 rounded-full bg-[#a64e43] px-3 py-1 text-xs font-medium text-white">Save {product.discountPercent}%</span>}
            </div>
            <div className="flex items-start justify-between gap-3 px-1 pt-3">
              <div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8c80]">{product.category?.name || "Collection"}</p><h2 className="mt-1 truncate font-medium text-[#303429] group-hover:text-[#758064]">{product.name}</h2></div>
              <div className="shrink-0 text-right"><p className="text-sm font-semibold text-[#3d4235]">{formatPrice(product.salePriceMinor, product.currency)}</p>{product.discountPercent > 0 && <p className="text-xs text-[#9a9a90] line-through">{formatPrice(product.priceMinor, product.currency)}</p>}</div>
            </div>
          </Link>
          <div className="mt-3 flex justify-end"><WishlistButton productId={product._id} productName={product.name} showLabel /></div>
        </article>)}
      </div>}
    </main>
  </div>;
}

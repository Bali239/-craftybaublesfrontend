"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, App, Button, InputNumber, Skeleton, Tag } from "antd";
import StoreHeader from "../../../components/StoreHeader";
import { api, formatPrice, type Product } from "../../../lib/api";
import { queryKeys } from "../../../lib/queryKeys";
import { readSession } from "../../../lib/session";
import GoogleSignInButton from "../../../components/GoogleSignInButton";

export default function ProductDetailPage() {
  const { message } = App.useApp();
  const params = useParams<{ identifier: string }>();
  const id = decodeURIComponent(params.identifier);
  const [quantity, setQuantity] = useState(1);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { const task = window.setTimeout(() => setSignedIn(Boolean(readSession())), 0); return () => window.clearTimeout(task); }, []);
  const client = useQueryClient();
  const productQuery = useQuery({ queryKey: queryKeys.products.detail(id), queryFn: () => api<Product>(`/api/products/${encodeURIComponent(id)}`) });
  const addMutation = useMutation({ mutationFn: () => api("/api/cart/items", { method: "POST", body: JSON.stringify({ productId: productQuery.data?._id, quantity }) }), onSuccess: () => { message.success("Added to your cart."); client.invalidateQueries({ queryKey: ["cart"] }); }, onError: (error: Error) => message.error(error.message) });
  const product = productQuery.data;
  return <div className="min-h-screen bg-[#fbfaf7]"><StoreHeader /><main className="mx-auto max-w-6xl px-5 py-8">
    <Link href="/" className="text-sm text-[#7c806f]">← Back to collection</Link>
    {productQuery.isLoading ? <div className="mt-8 grid gap-10 md:grid-cols-2"><Skeleton.Image active className="!h-[520px] !w-full" /><Skeleton active /></div> : productQuery.error ? <Alert className="mt-8" type="error" showIcon title={(productQuery.error as Error).message} /> : product && <div className="mt-8 grid gap-8 md:grid-cols-2 md:gap-14">
      <div className="grid grid-cols-2 gap-3">{(product.images.length ? product.images : [{ _id: "empty", secureUrl: "", altText: "" }]).map((image) => <div key={image._id} className="relative aspect-square overflow-hidden rounded-xl bg-[#efeee8] first:col-span-2">{image.secureUrl ? <Image fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" src={image.secureUrl} alt={image.altText || product.name} /> : <div className="grid size-full place-items-center font-serif text-6xl text-[#b3b5a9]">N.</div>}</div>)}</div>
      <div className="pt-2 md:pt-8"><p className="text-xs uppercase tracking-[0.18em] text-[#858978]">{product.category?.name || "Collection"}</p><h1 className="mt-3 font-serif text-4xl text-[#303429]">{product.name}</h1>{product.brand && <p className="mt-2 text-sm text-[#85877d]">{product.brand}</p>}<div className="mt-5 flex items-center gap-3">{product.discountPercent > 0 && <Tag color="red">Save {product.discountPercent}%</Tag>}<p className="text-xl font-semibold text-[#4e5941]">{formatPrice(product.salePriceMinor, product.currency)}</p>{product.discountPercent > 0 && <p className="text-sm text-[#99998f] line-through">{formatPrice(product.priceMinor, product.currency)}</p>}</div>
        <p className="mt-6 whitespace-pre-line text-sm leading-7 text-[#6e7165]">{product.description}</p>{Boolean(product.attributes?.length) && <dl className="mt-6 divide-y divide-[#e9e7df] border-y border-[#e9e7df]">{product.attributes?.map((entry) => <div className="flex justify-between py-3 text-sm" key={entry.name}><dt className="text-[#87897e]">{entry.name}</dt><dd className="text-[#3e4438]">{entry.value}</dd></div>)}</dl>}
        {product.trackInventory && <p className="mt-5 text-xs text-[#85877d]">{product.availablePieces > 0 ? `${product.availablePieces} available` : "Currently out of stock"}</p>}
        <div className="mt-6 flex gap-3"><InputNumber min={1} max={product.trackInventory ? Math.max(1, product.availablePieces) : 99} value={quantity} onChange={(value) => setQuantity(value || 1)} size="large" disabled={product.trackInventory && product.availablePieces === 0} /><Button type="primary" size="large" className="flex-1" disabled={product.trackInventory && product.availablePieces === 0} loading={addMutation.isPending} onClick={() => signedIn ? addMutation.mutate() : message.info("Sign in first to add items to your cart.")}>Add to cart</Button></div>
        {!signedIn && <GoogleSignInButton type="link" className="mt-2 !px-0">Sign in with Google to shop</GoogleSignInButton>}
      </div>
    </div>}
  </main></div>;
}

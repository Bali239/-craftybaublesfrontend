"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, App, Button, Empty, InputNumber, Skeleton } from "antd";
import { api, formatPrice, type Order, type Product } from "../../lib/api";
import { readSession } from "../../lib/session";
import GoogleSignInButton from "../../components/GoogleSignInButton";

type CartItem = { product: Product; quantity: number; unitPriceMinor: number; lineTotalMinor: number };
type Cart = { items: CartItem[]; subtotalMinor: number; itemCount: number; currency: string };
export default function CartPage() {
  const { message } = App.useApp();
  const client = useQueryClient();
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { const task = window.setTimeout(() => setSignedIn(Boolean(readSession())), 0); return () => window.clearTimeout(task); }, []);
  const cartQuery = useQuery({ queryKey: ["cart"], queryFn: () => api<Cart>("/api/cart"), enabled: signedIn });
  const mutate = useMutation({ mutationFn: ({ id, quantity }: { id: string; quantity?: number }) => api<Cart>(`/api/cart/items/${id}`, quantity ? { method: "PATCH", body: JSON.stringify({ quantity }) } : { method: "DELETE" }), onSuccess: () => client.invalidateQueries({ queryKey: ["cart"] }), onError: (error: Error) => message.error(error.message) });
  const checkout = useMutation({ mutationFn: () => api<Order>("/api/orders/checkout", { method: "POST" }), onSuccess: (order) => { client.invalidateQueries({ queryKey: ["cart"] }); router.push(`/checkout?order=${encodeURIComponent(order.orderNumber)}`); }, onError: (error: Error) => message.error(error.message) });
  return <div className="min-h-screen bg-[#fbfaf7]"><main className="mx-auto max-w-5xl px-5 py-10"><Link href="/" className="text-sm text-[#7c806f]">← Continue shopping</Link><h1 className="mb-8 mt-4 font-serif text-4xl text-[#303429]">Your cart</h1>
    {!signedIn ? <div className="rounded-xl border border-[#e7e5dc] bg-white p-8 text-center"><p className="mb-4 text-[#666b5e]">Sign in with Google to view and save your cart.</p><GoogleSignInButton type="primary">Sign in to continue</GoogleSignInButton></div> : cartQuery.isLoading ? <Skeleton active /> : cartQuery.error ? <Alert type="error" showIcon title={(cartQuery.error as Error).message} /> : !cartQuery.data?.items.length ? <Empty description="Your cart is waiting for something lovely." /> : <div className="grid gap-8 lg:grid-cols-[1fr_320px]"><div className="divide-y divide-[#e8e6de] rounded-xl border border-[#e8e6de] bg-white px-5">{cartQuery.data.items.map(({ product, quantity, lineTotalMinor }) => <div key={product._id} className="flex items-center gap-4 py-5"><div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-[#efeee8]">{product.images?.[0]?.secureUrl && <Image fill sizes="80px" src={product.images[0].secureUrl} alt={product.name} className="object-cover" />}</div><div className="min-w-0 flex-1"><Link href={`/products/${product.slug}`} className="font-medium text-[#303429]">{product.name}</Link><p className="mt-1 text-sm text-[#85877d]">{formatPrice(lineTotalMinor, product.currency)}</p></div><InputNumber min={1} max={99} value={quantity} onChange={(value) => value && mutate.mutate({ id: product._id, quantity: value })} /><Button type="text" danger onClick={() => mutate.mutate({ id: product._id })}>Remove</Button></div>)}</div><aside className="h-fit rounded-xl border border-[#e8e6de] bg-white p-5"><h2 className="font-serif text-xl text-[#303429]">Order summary</h2><div className="mt-5 flex justify-between text-sm text-[#666b5e]"><span>Subtotal ({cartQuery.data.itemCount} items)</span><span>{formatPrice(cartQuery.data.subtotalMinor, cartQuery.data.currency)}</span></div><p className="mt-3 text-xs leading-5 text-[#929388]">Shipping and final details can be added when payment processing is connected.</p><div className="my-5 border-t border-[#eceae3] pt-4"><div className="flex justify-between font-semibold text-[#34392e]"><span>Total</span><span>{formatPrice(cartQuery.data.subtotalMinor, cartQuery.data.currency)}</span></div></div><Button type="primary" block size="large" loading={checkout.isPending} onClick={() => checkout.mutate()}>Create order</Button></aside></div>}
  </main></div>;
}

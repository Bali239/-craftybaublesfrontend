"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Skeleton } from "antd";
import StoreHeader from "../../components/StoreHeader";
import { api, formatPrice, type Order } from "../../lib/api";

export default function CheckoutPage() {
  const [orderNumber, setOrderNumber] = useState("");
  useEffect(() => { const task = window.setTimeout(() => setOrderNumber(new URLSearchParams(window.location.search).get("order") || ""), 0); return () => window.clearTimeout(task); }, []);
  const order = useQuery({ queryKey: ["order", orderNumber], queryFn: () => api<Order>(`/api/orders/${encodeURIComponent(orderNumber)}`), enabled: Boolean(orderNumber) });
  return <div className="min-h-screen bg-[#fbfaf7]"><StoreHeader /><main className="mx-auto max-w-3xl px-5 py-10"><Link href="/" className="text-sm text-[#7c806f]">← Back to store</Link><p className="mt-10 text-[10px] font-bold tracking-[0.22em] text-[#858978]">CHECKOUT</p><h1 className="mt-2 font-serif text-4xl text-[#303429]">Payment</h1><p className="mt-3 text-sm leading-6 text-[#77796e]">Your order is saved. Payment processing will be connected in a later step.</p>
    {!orderNumber ? <Alert className="mt-7" type="warning" showIcon message="No order selected" description="Create an order from your cart to continue." action={<Button href="/cart">Open cart</Button>} /> : order.isLoading ? <div className="mt-8 rounded-xl bg-white p-6"><Skeleton active /></div> : order.error ? <Alert className="mt-7" type="error" showIcon message={(order.error as Error).message} /> : order.data && <section className="mt-8 rounded-xl border border-[#e7e5dc] bg-white p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#eceae3] pb-5"><div><p className="text-xs text-[#85877d]">Order number</p><p className="mt-1 font-medium text-[#303429]">{order.data.orderNumber}</p></div><span className="rounded-full bg-[#f1f0e9] px-3 py-1 text-xs capitalize text-[#606655]">{order.data.paymentStatus}</span></div><div className="divide-y divide-[#eceae3]">{order.data.items.map((item, index) => <div key={`${item.name}-${index}`} className="flex justify-between gap-4 py-4 text-sm"><span className="text-[#666b5e]">{item.name} <span className="text-[#99998f]">× {item.quantity}</span></span><span className="text-[#3e4438]">{formatPrice(item.lineTotalMinor, order.data.currency)}</span></div>)}</div><div className="flex justify-between border-t border-[#eceae3] pt-5 text-base font-semibold text-[#34392e]"><span>Amount due</span><span>{formatPrice(order.data.totalMinor, order.data.currency)}</span></div><div className="mt-6 rounded-lg bg-[#f7f6f1] p-4 text-sm leading-6 text-[#77796e]">Online payment is not active yet. Your order is saved as pending payment; no charge has been made.</div><Button href="/" className="mt-6">Continue shopping</Button></section>}
  </main></div>;
}

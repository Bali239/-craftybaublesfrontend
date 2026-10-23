"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Modal, Skeleton } from "antd";
import { ArrowLeft, Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, formatPrice, type Order, type Product } from "../../lib/api";
import { readSession } from "../../lib/session";
import GoogleSignInButton from "../../components/GoogleSignInButton";

type CartItem = { product: Product; quantity: number; unitPriceMinor: number; lineTotalMinor: number };
type Cart = { items: CartItem[]; subtotalMinor: number; itemCount: number; currency: string };

export default function CartPage() {
  const client = useQueryClient();
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<CartItem | null>(null);

  useEffect(() => {
    const task = window.setTimeout(() => setSignedIn(Boolean(readSession())), 0);
    return () => window.clearTimeout(task);
  }, []);

  const cartQuery = useQuery({ queryKey: ["cart"], queryFn: () => api<Cart>("/api/cart"), enabled: signedIn });
  const refreshCart = () => client.invalidateQueries({ queryKey: ["cart"] });
  const changeQuantity = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => api<Cart>(`/api/cart/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    }),
    onSuccess: refreshCart,
    onError: (error: Error) => toast.error(error.message),
  });
  const removeItem = useMutation({
    mutationFn: (id: string) => api<Cart>(`/api/cart/items/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      setItemToRemove(null);
      await refreshCart();
      toast.success("Item removed from your cart.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const checkout = useMutation({
    mutationFn: () => api<Order>("/api/orders/checkout", { method: "POST" }),
    onSuccess: (order) => {
      void refreshCart();
      router.push(`/checkout?order=${encodeURIComponent(order.orderNumber)}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const cart = cartQuery.data;
  const updatePending = changeQuantity.isPending || removeItem.isPending;

  return <div className="min-h-screen bg-[#fbfaf7] [&_a]:cursor-pointer [&_button:not(:disabled)]:cursor-pointer [&_img]:cursor-pointer">
    <main className="mx-auto max-w-6xl px-5 pb-8 sm:pb-10">
      <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-[#737866] transition-colors hover:text-[#303429]"><ArrowLeft size={16} /> Continue shopping</Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-b border-[#e8e6de] pb-6">
        <div><p className="text-xs uppercase tracking-[0.18em] text-[#858978]">Your selection</p><h1 className="mt-2 font-serif text-4xl text-[#303429] sm:text-5xl">Shopping cart</h1></div>
        {cart && cart.items.length > 0 && <p className="text-sm text-[#777b6d]">{cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}</p>}
      </div>

      {!signedIn ? <div className="mt-8 rounded-2xl border border-[#e7e5dc] bg-white px-6 py-12 text-center shadow-sm">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#f2f1eb] text-[#697457]"><ShoppingBag size={24} /></div>
        <h2 className="mt-5 font-serif text-2xl text-[#303429]">Sign in to see your cart</h2>
        <p className="mx-auto mb-5 mt-2 max-w-md text-sm leading-6 text-[#777b6d]">Your saved items are linked to your account. Sign in to review them and continue to checkout.</p>
        <GoogleSignInButton type="primary">Sign in to continue</GoogleSignInButton>
      </div> : cartQuery.isLoading ? <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]"><div className="rounded-2xl border border-[#e8e6de] bg-white p-6"><Skeleton active paragraph={{ rows: 4 }} /></div><Skeleton active /></div> : cartQuery.error ? <Alert className="mt-8" type="error" showIcon title={(cartQuery.error as Error).message} /> : !cart?.items.length ? <div className="mt-8 rounded-2xl border border-[#e8e6de] bg-white px-6 py-14 text-center shadow-sm">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#f2f1eb] text-[#697457]"><ShoppingBag size={24} /></div>
        <h2 className="mt-5 font-serif text-2xl text-[#303429]">Your cart is waiting for something lovely</h2>
        <p className="mt-2 text-sm text-[#777b6d]">Explore the collection and find something made for you.</p>
        <Button type="primary" size="large" className="mt-6" href="/shop">Explore the collection</Button>
      </div> : <div className="mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-label="Cart items" className="space-y-4">
          {cart.items.map((item) => {
            const { product, quantity, unitPriceMinor, lineTotalMinor } = item;
            const quantityLimit = product.trackInventory ? Math.max(quantity, product.availablePieces) : 99;
            const busy = updatePending && (changeQuantity.variables?.id === product._id || removeItem.variables === product._id);
            return <article key={product._id} className="group flex flex-col gap-4 rounded-2xl border border-[#e8e6de] bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#cfd2c4] hover:shadow-lg hover:shadow-[#303429]/[0.06] sm:flex-row sm:items-center sm:gap-5 sm:p-5">
              <Link href={`/products/${product.slug}`} aria-label={`View ${product.name}`} className="flex min-w-0 flex-1 items-center gap-4 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#758064] sm:gap-5">
                <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-[#f1f0e9] sm:size-28">
                  {product.images?.[0]?.secureUrl ? <Image fill sizes="112px" src={product.images[0].secureUrl} alt={product.images[0].altText || product.name} className="object-cover transition-transform duration-300 group-hover:scale-105" /> : <div className="grid size-full place-items-center font-serif text-3xl text-[#b3b5a9]">N.</div>}
                </div>
                <div className="min-w-0 py-1">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#858978]">{product.category?.name || "Collection"}</p>
                  <h2 className="mt-1 truncate font-serif text-xl text-[#303429] transition-colors group-hover:text-[#697457] sm:text-2xl">{product.name}</h2>
                  {product.brand && <p className="mt-1 truncate text-sm text-[#888b80]">{product.brand}</p>}
                  <p className="mt-3 text-sm text-[#737866]">{formatPrice(unitPriceMinor, product.currency)} <span className="text-[#a1a296]">each</span></p>
                </div>
              </Link>
              <div className="flex items-center justify-between gap-4 border-t border-[#efeee8] pt-4 sm:min-w-[205px] sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                <div className="inline-flex h-10 items-center rounded-lg border border-[#e5e4dc] bg-[#fbfaf7]">
                  <button type="button" aria-label={`Decrease ${product.name} quantity`} disabled={busy || quantity <= 1} onClick={() => changeQuantity.mutate({ id: product._id, quantity: quantity - 1 })} className="grid size-10 place-items-center rounded-l-lg text-[#666b5e] transition-colors hover:bg-[#efeee8] disabled:cursor-not-allowed disabled:opacity-40"><Minus size={15} /></button>
                  <span aria-live="polite" className="min-w-9 text-center text-sm font-medium text-[#303429]">{quantity}</span>
                  <button type="button" aria-label={`Increase ${product.name} quantity`} disabled={busy || quantity >= quantityLimit} onClick={() => changeQuantity.mutate({ id: product._id, quantity: quantity + 1 })} className="grid size-10 place-items-center rounded-r-lg text-[#666b5e] transition-colors hover:bg-[#efeee8] disabled:cursor-not-allowed disabled:opacity-40"><Plus size={15} /></button>
                </div>
                <div className="flex items-center gap-3 sm:justify-end">
                  <p className="min-w-[92px] text-right font-semibold text-[#3e4438]">{formatPrice(lineTotalMinor, product.currency)}</p>
                  <button type="button" aria-label={`Remove ${product.name} from cart`} disabled={busy} onClick={() => setItemToRemove(item)} className="grid size-9 place-items-center rounded-lg text-[#96988e] transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={17} /></button>
                </div>
              </div>
            </article>;
          })}
          <p className="flex items-center gap-2 px-1 pt-2 text-xs leading-5 text-[#898c80]"><ShieldCheck size={15} className="shrink-0 text-[#758064]" /> Your cart is saved securely to your account.</p>
        </section>

        <aside className="h-fit rounded-2xl border border-[#e8e6de] bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
          <h2 className="font-serif text-2xl text-[#303429]">Order summary</h2>
          <div className="mt-6 space-y-4 text-sm text-[#737866]">
            <div className="flex justify-between gap-4"><span>Subtotal · {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}</span><span className="font-medium text-[#3e4438]">{formatPrice(cart.subtotalMinor, cart.currency)}</span></div>
            <div className="flex justify-between gap-4"><span>Shipping</span><span className="text-right text-xs text-[#929388]">Calculated at next step</span></div>
          </div>
          <div className="my-5 border-t border-[#eceae3]" />
          <div className="flex items-baseline justify-between gap-4"><span className="font-semibold text-[#303429]">Total</span><span className="text-xl font-semibold text-[#3e4438]">{formatPrice(cart.subtotalMinor, cart.currency)}</span></div>
          <p className="mt-2 text-xs leading-5 text-[#929388]">Shipping and final details are confirmed before payment.</p>
          <Button type="primary" block size="large" loading={checkout.isPending} disabled={updatePending} onClick={() => checkout.mutate()} className="mt-6">Continue to checkout</Button>
          <Link href="/shop" className="mt-4 flex items-center justify-center gap-2 text-sm text-[#737866] transition-colors hover:text-[#303429]"><ArrowLeft size={15} /> Keep shopping</Link>
        </aside>
      </div>}
    </main>

    <Modal title="Remove item from cart?" open={Boolean(itemToRemove)} onCancel={() => setItemToRemove(null)} onOk={() => itemToRemove && removeItem.mutate(itemToRemove.product._id)} confirmLoading={removeItem.isPending} okText="Remove item" okButtonProps={{ danger: true }} cancelText="Keep item">
      <p className="py-3 text-sm leading-6 text-[#737866]">Remove <span className="font-medium text-[#303429]">{itemToRemove?.product.name}</span> from your cart?</p>
    </Modal>
  </div>;
}

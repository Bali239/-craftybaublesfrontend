"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Alert, Button, Input, Modal, Skeleton } from "antd";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, formatPrice, type Order, type Product } from "../../lib/api";
import { readSession } from "../../lib/session";

const pakistanPhonePattern = /^03\d{2}-\d{7}$/;

const formatPakistaniPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits.length >= 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
};

const orderSchema = z.object({
  recipientName: z.string().trim().min(2, "Recipient name is required."),
  phoneNumber: z.string().trim().regex(pakistanPhonePattern, "Enter your mobile number as 03xx-xxxxxxx."),
  address: z.string().trim().min(5, "Enter a complete delivery address."),
});

type CheckoutForm = z.infer<typeof orderSchema>;

type CartItem = { product: Product; quantity: number; unitPriceMinor: number; lineTotalMinor: number };
type Cart = { items: CartItem[]; subtotalMinor: number; itemCount: number; currency: string };

export default function CheckoutPage() {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [serverError, setServerError] = useState<string>("");
  const session = useMemo(() => readSession(), []);

  const { register, handleSubmit, control, formState: { errors, isSubmitting, submitCount }, reset } = useForm<CheckoutForm>({
    resolver: zodResolver(orderSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      recipientName: session?.user?.name || "",
      phoneNumber: "",
      address: "",
    },
  });

  useEffect(() => {
    const task = window.setTimeout(() => setSessionReady(true), 0);
    return () => window.clearTimeout(task);
  }, []);

  useEffect(() => {
    const fetchCart = async () => {
      if (!session) return;
      setCartLoading(true);
      try {
        const data = await api<Cart>("/api/cart");
        setCart(data);
      } catch (error) {
        setServerError(error instanceof Error ? error.message : "Unable to load your cart.");
      } finally {
        setCartLoading(false);
      }
    };
    if (sessionReady) void fetchCart();
  }, [sessionReady, session]);

  const placeOrder = useMutation({
    mutationFn: async (values: CheckoutForm) => {
      if (!cart || cart.items.length === 0) {
        throw new Error("Your cart is empty. Add an item before checking out.");
      }
      const payload = {
        idempotencyKey: `${session?.user.id || "guest"}:${Date.now()}`,
        recipientName: values.recipientName,
        phoneNumber: values.phoneNumber,
        address: values.address,
        items: cart.items.map((item) => ({ productId: item.product._id, quantity: item.quantity })),
      };
      return api<Order>("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    },
    onSuccess: (order) => {
      setOrderNumber(order.orderNumber);
      setShowSuccessModal(true);
      reset();
    },
    onError: (error: Error) => {
      setServerError(error.message);
    },
  });

  if (!sessionReady) {
    return <div className="min-h-screen bg-[#fbfaf7] p-5"><Skeleton active /></div>;
  }

  if (!session) {
    return <div className="min-h-screen bg-[#fbfaf7] px-5 py-10"><main className="mx-auto max-w-4xl rounded-2xl border border-[#e8e6de] bg-white p-8"><Alert type="warning" showIcon title="Sign in required" description="Please sign in to continue with checkout." action={<Button onClick={() => router.push("/shop")}>Back to shop</Button>} /></main></div>;
  }

  return (
    <div className="min-h-screen bg-[#fbfaf7] [&_a]:cursor-pointer [&_button:not(:disabled)]:cursor-pointer [&_img]:cursor-pointer">
      <main className="mx-auto max-w-6xl px-5 py-8 md:py-10">
        <Modal open={showSuccessModal} onOk={() => { setShowSuccessModal(false); router.push("/shop"); }} onCancel={() => { setShowSuccessModal(false); router.push("/shop"); }} okText="Back to shopping" cancelText="Close" centered title="Order placed successfully">
          <p className="mt-2 text-sm leading-6 text-[#5d6156]">Your order has been received and our representative will contact you shortly. A confirmation email has also been sent to the admin team.</p>
          <div className="mt-4 rounded-xl bg-[#f5f4ee] p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-[#858978]">Order number</p>
            <p className="mt-1 text-lg font-semibold text-[#303429]">{orderNumber}</p>
          </div>
        </Modal>
        <Link href="/cart" className="text-sm text-[#7c806f]">← Back to cart</Link>
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
          <section className="flex-1 rounded-2xl border border-[#e7e5dc] bg-white p-5 sm:p-8">
            <p className="text-[10px] font-bold tracking-[0.22em] text-[#858978]">CHECKOUT</p>
            <h1 className="mt-2 font-serif text-4xl text-[#303429]">Cash on delivery</h1>
            <p className="mt-3 text-sm leading-6 text-[#77796e]">Pay when your order arrives in Pakistan. Final amounts are validated on the server using the locked-in product prices and cart snapshot before the order is confirmed.</p>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit((values: CheckoutForm) => { setServerError(""); placeOrder.mutate(values); })} noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[#4b5145]">Recipient full name</label>
                  <Input {...register("recipientName")} status={submitCount > 0 && errors.recipientName ? "error" : undefined} placeholder="Enter recipient name" />
                  {submitCount > 0 && errors.recipientName && <p className="mt-2 text-xs text-red-600">{errors.recipientName.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[#4b5145]">Email</label>
                  <Input value={session.user.email} readOnly className="bg-[#f8f7f3]" />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[#4b5145]">Mobile number</label>
                  <Controller
                    control={control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ""}
                        inputMode="numeric"
                        autoComplete="tel-national"
                        maxLength={12}
                        status={submitCount > 0 && errors.phoneNumber ? "error" : undefined}
                        onChange={(event) => field.onChange(formatPakistaniPhone(event.target.value))}
                        placeholder="0333-0562174"
                      />
                    )}
                  />
                  {submitCount > 0 && errors.phoneNumber && <p className="mt-2 text-xs text-red-600">{errors.phoneNumber.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-[#4b5145]">Complete delivery address</label>
                  <Controller
                    control={control}
                    name="address"
                    render={({ field }) => (
                      <Input.TextArea
                        {...field}
                        value={field.value || ""}
                        status={submitCount > 0 && errors.address ? "error" : undefined}
                        rows={4}
                        placeholder="House number, street, block, sector..."
                      />
                    )}
                  />
                  {submitCount > 0 && errors.address && <p className="mt-2 text-xs text-red-600">{errors.address.message}</p>}
                </div>
              </div>

              {serverError && <Alert type="error" showIcon title={serverError} />}

              <div className="rounded-xl border border-[#e9e6df] bg-[#faf9f5] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#858978]">Payment</p>
                <div className="mt-3 flex items-center justify-between gap-4 text-sm text-[#555c4d]">
                  <span>Cash on Delivery</span>
                  <span className="font-medium text-[#303429]">{cart && formatPrice(cart.subtotalMinor, cart.currency)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eceae3] pt-5">
                <Link href="/cart" className="text-sm text-[#697457]">Back to cart</Link>
                <Button type="primary" size="large" htmlType="submit" loading={placeOrder.isPending || isSubmitting} disabled={cartLoading || !cart || cart.items.length === 0}>
                  Place order
                </Button>
              </div>
            </form>
          </section>

          <aside className="w-full max-w-md rounded-2xl border border-[#e8e6de] bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <h2 className="font-serif text-2xl text-[#303429]">Order summary</h2>
            {cartLoading ? <Skeleton active className="mt-4" /> : cart ? <div className="mt-5 space-y-4">
              <div className="space-y-3">
                {cart.items.map((item) => (
                  <div key={item.product._id} className="flex items-center justify-between gap-3 text-sm text-[#5b6153]">
                    <span>{item.product.name} × {item.quantity}</span>
                    <span className="font-medium text-[#303429]">{formatPrice(item.lineTotalMinor, item.product.currency)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#eceae3] pt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(cart.subtotalMinor, cart.currency)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>Calculated by courier</span></div>
                <div className="flex justify-between"><span>Taxes</span><span>Included at checkout</span></div>
              </div>
              <div className="border-t border-[#eceae3] pt-4 flex justify-between text-base font-semibold text-[#303429]">
                <span>Total</span>
                <span>{formatPrice(cart.subtotalMinor, cart.currency)}</span>
              </div>
              <div className="rounded-lg bg-[#f7f6f1] p-3 text-xs leading-5 text-[#787d70]">Cash on delivery amount due is confirmed when the order is placed. The final amount will reflect the verified server-side pricing rules.</div>
            </div> : <Alert type="error" showIcon title="Unable to load your cart." />}
          </aside>
        </div>
      </main>
    </div>
  );
}

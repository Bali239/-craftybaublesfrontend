"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Skeleton, Tag, Timeline } from "antd";
import { ArrowLeft } from "lucide-react";
import { api, formatPrice, type Order } from "../../../lib/api";
import { readSession } from "../../../lib/session";
import NotificationBell from "../../../components/NotificationBell";

const statusLabels: Record<string, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

const paymentLabels: Record<string, string> = {
  pending: "Pending",
  collected: "Collected",
  failed: "Failed",
  refunded: "Refunded",
};

const statusColors: Record<string, string> = {
  placed: "blue",
  confirmed: "cyan",
  processing: "orange",
  shipped: "purple",
  delivered: "green",
  cancelled: "red",
  returned: "magenta",
};

const timelineStatusColors: Record<string, string> = {
  placed: "blue",
  confirmed: "cyan",
  processing: "orange",
  shipped: "purple",
  delivered: "green",
  cancelled: "red",
  returned: "magenta",
};

const dateLabel = (value?: string) => value ? new Date(value).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" }) : "-";

export default function OrderDetailPage() {
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = params.orderNumber;
  const queryClient = useQueryClient();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSignedIn(Boolean(readSession())), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const orderQuery = useQuery({
    queryKey: ["orders", "detail", orderNumber],
    queryFn: () => api<Order>(`/api/orders/${orderNumber}`),
    enabled: signedIn && Boolean(orderNumber),
  });

  useEffect(() => {
    if (!signedIn || !orderQuery.data?._id) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit("order:subscribe", orderQuery.data._id);
    const handler = (updated: Order) => {
      if (updated.orderNumber === orderNumber || updated._id === orderQuery.data?._id) {
        queryClient.setQueryData(["orders", "detail", orderNumber], updated);
      }
    };
    socket.on("order:updated", handler);
    return () => {
      if (orderQuery.data?._id) socket.emit("order:unsubscribe", orderQuery.data._id);
      socket.off("order:updated", handler);
    };
  }, [signedIn, orderQuery.data?._id, orderNumber, queryClient]);

  if (!signedIn) {
    return <main className="mx-auto min-h-screen max-w-4xl bg-[#fbfaf7] px-4 py-10 sm:px-6"><Alert type="warning" showIcon title="Sign in required" description="Sign in to view this order." /></main>;
  }

  if (orderQuery.isLoading) {
    return <main className="mx-auto min-h-screen max-w-4xl bg-[#fbfaf7] px-4 py-10 sm:px-6"><Skeleton active paragraph={{ rows: 8 }} /></main>;
  }

  if (orderQuery.isError || !orderQuery.data) {
    return <main className="mx-auto min-h-screen max-w-4xl bg-[#fbfaf7] px-4 py-10 sm:px-6"><Alert type="error" showIcon title="Order not found" description={(orderQuery.error as Error)?.message || "We could not load this order."} action={<Link href="/orders"><Button>Back to orders</Button></Link>} /></main>;
  }

  const order = orderQuery.data;
  const timelineItems = [
    ...(order.statusHistory || []).slice().reverse().map((entry: any) => ({
      color: timelineStatusColors[entry.status] || "blue",
      content: <div><p className="font-medium text-[#303429]">{statusLabels[entry.status] || entry.status}</p>{entry.note && <p className="text-sm text-[#62675c]">{entry.note}</p>}<p className="text-xs text-[#858978]">{dateLabel(entry.at)}</p></div>,
    })),
    ...(order.paymentHistory || []).slice().reverse().map((entry: any) => ({
      color: entry.status === "collected" ? "green" : entry.status === "failed" ? "red" : "gray",
      content: <div><p className="font-medium text-[#303429]">Payment: {paymentLabels[entry.status] || entry.status}</p>{entry.note && <p className="text-sm text-[#62675c]">{entry.note}</p>}<p className="text-xs text-[#858978]">{dateLabel(entry.at)}</p></div>,
    })),
  ];

  return (
    <main className="min-h-screen bg-[#fbfaf7]">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-[#73796a] hover:text-[#303429]"><ArrowLeft size={15} /> Back to orders</Link>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#858978]">ORDER DETAILS</p>
            <h1 className="mt-2 font-serif text-3xl text-[#303429] sm:text-4xl">Your Order</h1>
            <p className="mt-2 text-sm text-[#77796e]">Placed {dateLabel(order.createdAt)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tag color={statusColors[order.status] || "default"}>{statusLabels[order.status] || order.status}</Tag>
            <Tag color={order.paymentStatus === "collected" ? "green" : order.paymentStatus === "failed" ? "red" : "gold"}>{paymentLabels[order.paymentStatus] || order.paymentStatus}</Tag>
            <NotificationBell />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section className="rounded-xl border border-[#e7e5dc] bg-white p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#858978]">Items</h2>
            <div className="mt-4 space-y-3">
              {(order.items || []).map((item: any, index: number) => (
                <div key={index} className="flex justify-between gap-4 text-sm">
                  <span className="text-[#555b4f]">{item.productName || item.name} × {item.quantity}</span>
                  <span className="font-medium text-[#303429]">{formatPrice(item.lineTotalMinor, order.currency)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-[#eceae3] pt-3 font-semibold text-[#303429]">
              <span>Total</span>
              <span>{formatPrice(order.totalMinor, order.currency)}</span>
            </div>
          </section>

          <section className="rounded-xl border border-[#e7e5dc] bg-white p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#858978]">Delivery</h2>
            <p className="mt-2 font-medium text-[#303429]">{order.recipientName}</p>
            <p className="text-sm text-[#62675c]">{order.phoneNumber}</p>
            <p className="text-sm text-[#62675c]">{order.customerEmail}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#62675c]">{order.shipping?.address}</p>
          </section>
        </div>

        <section className="mt-6 rounded-xl border border-[#e7e5dc] bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#858978]">Tracking</h2>
          {timelineItems.length ? <Timeline className="mt-4" items={timelineItems} /> : <p className="mt-3 text-sm text-[#62675c]">No updates yet.</p>}
        </section>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Empty, Skeleton, Tag } from "antd";
import { ArrowLeft, ClipboardList, ExternalLink } from "lucide-react";
import { api, formatPrice, type Order } from "../../lib/api";
import { queryKeys } from "../../lib/queryKeys";
import { readSession } from "../../lib/session";
import { getSocket } from "../../lib/socket";

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

const statusBackground: Record<string, string> = {
  placed: "bg-blue-50/70 border-blue-200",
  confirmed: "bg-cyan-50/70 border-cyan-200",
  processing: "bg-orange-50/70 border-orange-200",
  shipped: "bg-purple-50/70 border-purple-200",
  delivered: "bg-green-50/70 border-green-200",
  cancelled: "bg-red-50/70 border-red-200",
  returned: "bg-fuchsia-50/70 border-fuchsia-200",
};

const statusTagColors: Record<string, string> = {
  placed: "blue",
  confirmed: "cyan",
  processing: "orange",
  shipped: "purple",
  delivered: "green",
  cancelled: "red",
  returned: "magenta",
};

const dateLabel = (value?: string) => value ? new Date(value).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" }) : "-";

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSignedIn(Boolean(readSession())), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const ordersQuery = useQuery({
    queryKey: queryKeys.orders.mine,
    queryFn: () => api<Order[]>("/api/orders"),
    enabled: signedIn,
  });

  useEffect(() => {
    if (!signedIn) return;
    const socket = getSocket();
    if (!socket) return;
    const handler = (updated: Order) => {
      queryClient.setQueryData<Order[]>(queryKeys.orders.mine, (current = []) => {
        const exists = current.some((order) => order._id === updated._id || order.orderNumber === updated.orderNumber);
        if (exists) return current.map((order) => (order._id === updated._id || order.orderNumber === updated.orderNumber ? { ...order, ...updated } : order));
        return [updated, ...current];
      });
    };
    socket.on("order:updated", handler);
    return () => { socket.off("order:updated", handler); };
  }, [signedIn, queryClient]);

  if (!signedIn) {
    return <main className="mx-auto min-h-screen max-w-5xl bg-[#fbfaf7] px-4 py-10 sm:px-6"><Alert type="warning" showIcon title="Sign in required" description="Sign in to view and track your orders." /></main>;
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#73796a] hover:text-[#303429]"><ArrowLeft size={15} /> Back to store</Link>
        <div className="mt-5">
          <p className="text-[10px] font-bold tracking-[0.2em] text-[#858978]">YOUR ORDERS</p>
          <h1 className="mt-2 font-serif text-3xl text-[#303429] sm:text-4xl">Order history</h1>
          <p className="mt-2 text-sm text-[#77796e]">Track status updates in real time after placing your order.</p>
        </div>

        <section className="mt-6 space-y-3">
          {ordersQuery.isLoading ? <Skeleton active paragraph={{ rows: 4 }} /> : ordersQuery.data?.length ? (
            ordersQuery.data.map((order) => (
              <Link key={order._id || order.orderNumber} href={`/orders/${order.orderNumber}`} className={`flex flex-col gap-3 rounded-xl border p-4 transition hover:shadow-sm sm:flex-row sm:items-center sm:justify-between ${statusBackground[order.status] || "bg-white border-[#e7e5dc]"}`}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[#303429]">Order</p>
                    <Tag color={statusTagColors[order.status] || "default"}>{statusLabels[order.status] || order.status}</Tag>
                    <Tag color={order.paymentStatus === "collected" ? "green" : order.paymentStatus === "failed" ? "red" : "gold"}>{paymentLabels[order.paymentStatus] || order.paymentStatus}</Tag>
                  </div>
                  <p className="mt-1 text-sm text-[#858978]">Placed {dateLabel(order.createdAt)} · {order.items?.length || 0} item(s)</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-[#303429]">{formatPrice(order.totalMinor, order.currency)}</p>
                  <Button type="text" icon={<ExternalLink size={16} />}>View details</Button>
                </div>
              </Link>
            ))
          ) : (
            <Empty image={<ClipboardList size={34} className="mx-auto text-[#a4a799]" />} description="No orders yet" />
          )}
        </section>
      </div>
    </main>
  );
}

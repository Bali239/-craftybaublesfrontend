"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Drawer, Empty, Input, Pagination, Select, Skeleton, Table, Tag } from "antd";
import type { TableColumnsType } from "antd";
import { ArrowLeft, ClipboardList, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api, formatPrice, type Order, type OrderPage } from "../../../lib/api";
import { queryKeys } from "../../../lib/queryKeys";
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

const statusTransitions: Record<string, string[]> = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
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

const statusRowBackground: Record<string, string> = {
  placed: "bg-blue-50/40",
  confirmed: "bg-cyan-50/40",
  processing: "bg-orange-50/40",
  shipped: "bg-purple-50/40",
  delivered: "bg-green-50/40",
  cancelled: "bg-red-50/40",
  returned: "bg-fuchsia-50/40",
};

const dateLabel = (value?: string) => value ? new Date(value).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" }) : "-";

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [authorized, setAuthorized] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [nextStatus, setNextStatus] = useState("");
  const [nextPaymentStatus, setNextPaymentStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setAuthorized(readSession()?.user.role === "admin"), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const params = useMemo(() => {
    const query = new URLSearchParams({ page: String(page), limit: "20" });
    if (debouncedSearch) query.set("q", debouncedSearch);
    if (status) query.set("status", status);
    if (paymentStatus) query.set("paymentStatus", paymentStatus);
    return query.toString();
  }, [page, debouncedSearch, status, paymentStatus]);

  const ordersQuery = useQuery({
    queryKey: [...queryKeys.orders.adminList, params],
    queryFn: () => api<OrderPage>(`/api/orders/admin?${params}`),
    enabled: authorized,
  });

  const statusMutation = useMutation({
    mutationFn: ({ order, status }: { order: Order; status: string }) => {
      if (!order._id) throw new Error("This order is missing its record ID.");
      return api<Order>(`/api/orders/${order._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: adminNote.trim() || undefined }),
      });
    },
    onSuccess: (updatedOrder) => {
      setSelectedOrder(updatedOrder);
      setNextStatus("");
      setAdminNote("");
      toast.success("Order status updated.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders.adminList }),
    onError: (error: Error) => toast.error(error.message),
  });

  const paymentMutation = useMutation({
    mutationFn: ({ order, paymentStatus }: { order: Order; paymentStatus: string }) => {
      if (!order._id) throw new Error("This order is missing its record ID.");
      return api<Order>(`/api/orders/${order._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus, note: adminNote.trim() || undefined }),
      });
    },
    onSuccess: (updatedOrder) => {
      setSelectedOrder(updatedOrder);
      setAdminNote("");
      toast.success("Payment status updated.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders.adminList }),
    onError: (error: Error) => toast.error(error.message),
  });

  const columns: TableColumnsType<Order> = [
    {
      title: "Order",
      dataIndex: "orderNumber",
      key: "orderNumber",
      render: (orderNumber: string, order) => <div><p className="font-semibold text-[#303429]">{orderNumber}</p><p className="text-xs text-[#858978]">{dateLabel(order.createdAt)}</p></div>,
    },
    {
      title: "Customer",
      key: "customer",
      render: (_value, order) => <div><p className="font-medium text-[#454a3f]">{order.recipientName || "Customer"}</p><p className="text-xs text-[#858978]">{order.phoneNumber || order.customerEmail || "-"}</p></div>,
    },
    {
      title: "Delivery address",
      key: "address",
      render: (_value, order) => <span className="line-clamp-2 max-w-xs text-sm text-[#62675c]">{order.shipping?.address || "-"}</span>,
    },
    {
      title: "Total",
      key: "total",
      align: "right",
      render: (_value, order) => <span className="font-medium text-[#303429]">{formatPrice(order.totalMinor, order.currency)}</span>,
    },
    {
      title: "Order status",
      dataIndex: "status",
      key: "status",
      render: (value: string) => <Tag color={statusColors[value] || "default"}>{statusLabels[value] || value}</Tag>,
    },
    {
      title: "COD payment",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (value: string) => <Tag color={value === "collected" ? "green" : value === "failed" ? "red" : "gold"}>{paymentLabels[value] || value}</Tag>,
    },
    {
      title: "",
      key: "action",
      align: "right",
      render: (_value, order) => <Button type="text" aria-label={`View order ${order.orderNumber}`} icon={<ExternalLink size={16} />} onClick={() => { setSelectedOrder(order); setNextStatus(""); setNextPaymentStatus(order.paymentStatus); setAdminNote(""); }} />,
    },
  ];

  const openOrder = (order: Order) => {
    setSelectedOrder(order);
    setNextStatus("");
    setNextPaymentStatus(order.paymentStatus);
    setAdminNote("");
  };

  if (!authorized) {
    return <main className="mx-auto min-h-screen max-w-7xl bg-[#fbfaf7] px-4 py-8 sm:px-6"><Alert type="warning" showIcon title="Admin access required" description="Sign in with an email listed in the server ADMIN_EMAILS setting." /></main>;
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-[#73796a] hover:text-[#303429]"><ArrowLeft size={15} /> Store administration</Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#858978]">ORDER OPERATIONS</p>
            <h1 className="mt-2 font-serif text-3xl text-[#303429] sm:text-4xl">Manage orders</h1>
            <p className="mt-2 text-sm text-[#77796e]">Review COD orders, update fulfillment, and record collected payments.</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button icon={<RefreshCw size={15} />} onClick={() => ordersQuery.refetch()} loading={ordersQuery.isFetching}>Refresh</Button>
          </div>
        </div>

        <section className="mt-6 rounded-xl border border-[#e7e5dc] bg-white p-4 sm:p-5">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
            <Input.Search aria-label="Search orders" allowClear value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Order number, customer, email, phone" className="md:max-w-md" />
            <Select aria-label="Filter by order status" value={status} onChange={(value) => { setStatus(value); setPage(1); }} className="w-full md:w-48" options={[{ value: "", label: "All order statuses" }, ...Object.entries(statusLabels).map(([value, label]) => ({ value, label }))]} />
            <Select aria-label="Filter by payment status" value={paymentStatus} onChange={(value) => { setPaymentStatus(value); setPage(1); }} className="w-full md:w-48" options={[{ value: "", label: "All payment statuses" }, ...Object.entries(paymentLabels).map(([value, label]) => ({ value, label }))]} />
            <p className="ml-auto whitespace-nowrap text-sm text-[#858978]">{ordersQuery.data?.pagination.total ?? 0} orders</p>
          </div>

          {ordersQuery.isError && <Alert className="mb-4" type="error" showIcon title="Could not load orders" description={(ordersQuery.error as Error).message} action={<Button onClick={() => ordersQuery.refetch()}>Retry</Button>} />}
          {ordersQuery.isLoading ? <Skeleton active paragraph={{ rows: 6 }} /> : ordersQuery.data?.items.length ? (
            <>
              <Table<Order>
                rowKey="_id"
                columns={columns}
                dataSource={ordersQuery.data.items}
                pagination={false}
                loading={ordersQuery.isFetching}
                scroll={{ x: 920 }}
                onRow={(order) => ({ onDoubleClick: () => openOrder(order), className: statusRowBackground[order.status] || "" })}
              />
              {ordersQuery.data.pagination.pages > 1 && <div className="mt-5 flex justify-center"><Pagination current={page} pageSize={ordersQuery.data.pagination.limit} total={ordersQuery.data.pagination.total} showSizeChanger={false} onChange={setPage} /></div>}
            </>
          ) : !ordersQuery.isError ? <Empty image={<ClipboardList size={34} className="mx-auto text-[#a4a799]" />} description={search || status || paymentStatus ? "No matching orders" : "No orders yet"} /> : null}
        </section>
      </div>

      <Drawer
        title={selectedOrder ? `Order ${selectedOrder.orderNumber}` : "Order details"}
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        size={560}
        className="max-w-[calc(100vw-16px)]"
        extra={selectedOrder && <Tag color={statusColors[selectedOrder.status] || "default"}>{statusLabels[selectedOrder.status] || selectedOrder.status}</Tag>}
      >
        {selectedOrder && <div className="space-y-6 pb-5">
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#858978]">Customer</h2>
            <p className="mt-2 font-medium text-[#303429]">{selectedOrder.recipientName || "Customer"}</p>
            <p className="text-sm text-[#62675c]">{selectedOrder.phoneNumber || "-"}</p>
            <p className="text-sm text-[#62675c]">{selectedOrder.customerEmail || "-"}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#62675c]">{selectedOrder.shipping?.address || "No delivery address"}</p>
          </section>

          <section className="border-t border-[#eceae3] pt-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#858978]">Items</h2>
            <div className="mt-3 space-y-3">
              {selectedOrder.items.map((item, index) => <div key={`${selectedOrder._id}-${index}`} className="flex justify-between gap-4 text-sm"><span className="text-[#555b4f]">{item.productName || item.name || "Product"} × {item.quantity}</span><span className="font-medium text-[#303429]">{formatPrice(item.lineTotalMinor, selectedOrder.currency)}</span></div>)}
            </div>
            <div className="mt-4 flex justify-between border-t border-[#eceae3] pt-3 font-semibold text-[#303429]"><span>COD total</span><span>{formatPrice(selectedOrder.totalMinor, selectedOrder.currency)}</span></div>
          </section>

          <section className="border-t border-[#eceae3] pt-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#858978]">Order status</h2>
            <p className="mt-2 text-sm text-[#62675c]">Current: {statusLabels[selectedOrder.status] || selectedOrder.status}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Select aria-label="Next order status" value={nextStatus || undefined} onChange={setNextStatus} placeholder="Choose status" className="flex-1" options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))} />
              <Button type="primary" disabled={!nextStatus || nextStatus === selectedOrder.status} loading={statusMutation.isPending} onClick={() => statusMutation.mutate({ order: selectedOrder, status: nextStatus })}>Update status</Button>
            </div>
          </section>

          <section className="border-t border-[#eceae3] pt-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#858978]">Cash collection</h2>
            <p className="mt-2 text-sm text-[#62675c]">Current: {paymentLabels[selectedOrder.paymentStatus] || selectedOrder.paymentStatus}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Select aria-label="Payment status" value={nextPaymentStatus} onChange={setNextPaymentStatus} className="flex-1" options={Object.entries(paymentLabels).map(([value, label]) => ({ value, label }))} />
              <Button disabled={!nextPaymentStatus || nextPaymentStatus === selectedOrder.paymentStatus} loading={paymentMutation.isPending} onClick={() => paymentMutation.mutate({ order: selectedOrder, paymentStatus: nextPaymentStatus })}>Update payment</Button>
            </div>
          </section>

          <section className="border-t border-[#eceae3] pt-4">
            <label htmlFor="admin-order-note" className="text-xs font-semibold uppercase tracking-[0.12em] text-[#858978]">Admin note (optional)</label>
            <Input.TextArea id="admin-order-note" value={adminNote} onChange={(event) => setAdminNote(event.target.value)} maxLength={500} rows={2} className="mt-2" placeholder="Add context to the next update" />
            <p className="mt-2 text-xs text-[#858978]">Placed {dateLabel(selectedOrder.createdAt)}</p>
          </section>
        </div>}
      </Drawer>
    </main>
  );
}
import { readSession } from "./session";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
export type Category = { _id: string; name: string; slug: string };
export type Product = {
  _id: string; name: string; slug: string; description: string; shortDescription: string;
  category: Category; brand: string; sku?: string; priceMinor: number; salePriceMinor: number;
  discountPercent: number; currency: string; availablePieces: number; trackInventory: boolean;
  status: string; images: { _id: string; secureUrl: string; altText: string }[];
  attributes?: { name: string; value: string }[];
};
export type ProductPage = { items: Product[]; pagination: { page: number; limit: number; total: number; pages: number } };
export type Order = { orderNumber: string; status: string; paymentStatus: string; items: { name: string; quantity: number; lineTotalMinor: number }[]; currency: string; subtotalMinor: number; totalMinor: number };

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = readSession();
  const headers = new Headers(init.headers);
  if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message || `Request failed (${response.status})`);
  return payload.data as T;
}

export const formatPrice = (minor: number, currency = "PKR") => new Intl.NumberFormat("en-PK", { style: "currency", currency, maximumFractionDigits: 2 }).format(minor / 100);

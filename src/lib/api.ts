import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { readSession } from "./session";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { Accept: "application/json" },
});

export class ApiError extends Error {
  code: string;
  status?: number;
  details?: unknown;
  requestId?: string;
  constructor(message: string, options: { code?: string; status?: number; details?: unknown; requestId?: string } = {}) {
    super(message);
    this.name = "ApiError";
    this.code = options.code || "NETWORK_ERROR";
    this.status = options.status;
    this.details = options.details;
    this.requestId = options.requestId;
  }
}

apiClient.interceptors.request.use((config) => {
  const session = readSession();
  if (session?.token) config.headers.set("Authorization", `Bearer ${session.token}`);
  return config;
});

export type Category = { _id: string; name: string; slug: string };
export type Product = {
  _id: string; name: string; slug: string; description: string; shortDescription: string;
  category: Category; brand: string; sku?: string; priceMinor: number; salePriceMinor: number;
  discountPercent: number; currency: string; availablePieces: number; trackInventory: boolean;
  status: string; images: { _id: string; secureUrl: string; altText: string }[];
  attributes?: { name: string; value: string }[];
};
export type ProductPage = { items: Product[]; pagination: { page: number; limit: number; total: number; pages: number } };
export type WishlistPage = ProductPage;
export type Order = { orderNumber: string; status: string; paymentStatus: string; items: { name: string; quantity: number; lineTotalMinor: number }[]; currency: string; subtotalMinor: number; totalMinor: number };

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const config: AxiosRequestConfig = {
    url: path,
    method: init.method || "GET",
    headers: init.headers as AxiosRequestConfig["headers"],
    signal: init.signal ?? undefined,
  };
  if (init.body !== undefined) config.data = init.body;

  try {
    const response = await apiClient.request<{ data: T }>(config);
    return response.data.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const payload = error.response?.data;
      throw new ApiError(payload?.message || (error.response ? `Request failed (${error.response.status})` : "Unable to reach the server. Check your connection and try again."), {
        code: payload?.code || (error.response ? "REQUEST_FAILED" : "NETWORK_ERROR"), status: error.response?.status,
        details: payload?.details, requestId: payload?.requestId,
      });
    }
    throw error;
  }
}

export const formatPrice = (minor: number, currency = "PKR") => new Intl.NumberFormat("en-PK", { style: "currency", currency, maximumFractionDigits: 2 }).format(minor / 100);

"use client";

import { useQuery } from "@tanstack/react-query";
import CoverFlowCarousel from "../components/pixel-perfect/cover-flow-carousel";
import { api, type ProductPage } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";

const latestProductsParams = new URLSearchParams({ page: "1", limit: "10", sort: "newest" }).toString();

export default function Home() {
  const latestProducts = useQuery({
    queryKey: queryKeys.products.list(latestProductsParams),
    queryFn: () => api<ProductPage>(`/api/products?${latestProductsParams}`),
  });

  return (
    <div className="min-h-screen bg-[#fbfaf7]">
      <CoverFlowCarousel products={latestProducts.data?.items || []} />
    </div>
  );
}

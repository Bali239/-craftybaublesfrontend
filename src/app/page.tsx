"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Card, Empty, Input, InputNumber, Pagination, Select, Skeleton, Switch, Tag } from "antd";
import StoreHeader from "../components/StoreHeader";
import { api, formatPrice, type Category, type ProductPage } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";
import { setBrand, setCategory, setDiscounted, setInStock, setMaxPrice, setMinPrice, setPage, setSearch, setSort, setTag, type AppDispatch, type RootState } from "../store/store";

export default function Home() {
  const dispatch = useDispatch<AppDispatch>();
  const filters = useSelector((state: RootState) => state.catalog);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  useEffect(() => { const timer = window.setTimeout(() => setDebouncedSearch(filters.search.trim()), 350); return () => window.clearTimeout(timer); }, [filters.search]);
  const params = useMemo(() => {
    const search = new URLSearchParams({ page: String(filters.page), limit: "12", sort: filters.sort });
    if (debouncedSearch) search.set("q", debouncedSearch);
    if (filters.category) search.set("category", filters.category);
    if (filters.inStock) search.set("inStock", "true");
    if (filters.discounted) search.set("discounted", "true");
    if (filters.minPrice && Number(filters.minPrice) >= 0) search.set("minPrice", String(Math.round(Number(filters.minPrice) * 100)));
    if (filters.maxPrice && Number(filters.maxPrice) >= 0) search.set("maxPrice", String(Math.round(Number(filters.maxPrice) * 100)));
    if (filters.brand.trim()) search.set("brand", filters.brand.trim());
    if (filters.tag.trim()) search.set("tag", filters.tag.trim());
    return search.toString();
  }, [filters.page, filters.sort, filters.category, filters.inStock, filters.discounted, filters.minPrice, filters.maxPrice, filters.brand, filters.tag, debouncedSearch]);
  const productsQuery = useQuery({ queryKey: queryKeys.products.list(params), queryFn: () => api<ProductPage>(`/api/products?${params}`) });
  const categoriesQuery = useQuery({ queryKey: queryKeys.categories.list, queryFn: () => api<Category[]>("/api/categories") });
  const page = productsQuery.data;
  return <div className="min-h-screen bg-[#fbfaf7]">
    <StoreHeader />
    <main className="mx-auto max-w-7xl px-5 pb-16">
      <section className="relative my-7 overflow-hidden rounded-2xl bg-[#e8e8de] px-7 py-12 sm:my-10 sm:px-14 sm:py-16">
        <div className="relative z-10 max-w-xl"><p className="mb-3 text-[10px] font-bold tracking-[0.25em] text-[#727965]">THOUGHTFULLY CHOSEN</p><h1 className="font-serif text-4xl leading-tight text-[#2d3327] sm:text-5xl">Find the pieces<br />that feel like you.</h1><p className="mt-4 max-w-md text-sm leading-7 text-[#6e7165]">Everyday essentials and considered details, gathered in one place.</p><a href="#shop" className="mt-6 inline-flex rounded-full bg-[#657052] px-6 py-3 text-sm font-medium text-white">Explore the collection</a></div>
        <div aria-hidden className="absolute -right-12 -top-16 size-80 rounded-full border-[46px] border-white/30 sm:right-12 sm:top-5" />
      </section>
      <section id="shop" className="scroll-mt-24">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold tracking-[0.22em] text-[#858978]">THE COLLECTION</p><h2 className="mt-1 font-serif text-3xl text-[#303429]">Shop all</h2></div><p className="text-sm text-[#85877d]">A little something for every day.</p></div>
        <div className="mb-7 grid gap-3 rounded-xl border border-[#e7e5dc] bg-white/75 p-4 md:grid-cols-2 lg:grid-cols-[minmax(200px,1fr)_190px_180px_150px_150px]">
          <Input size="large" allowClear placeholder="Search products…" value={filters.search} onChange={(e) => dispatch(setSearch(e.target.value))} />
          <Select size="large" value={filters.category || ""} onChange={(value) => dispatch(setCategory(value))} options={[{ value: "", label: "All categories" }, ...(categoriesQuery.data || []).map((category) => ({ value: category.slug, label: category.name }))]} />
          <Select size="large" value={filters.sort} onChange={(value) => dispatch(setSort(value))} options={[{ value: "newest", label: "Recently added" }, { value: "price_asc", label: "Price: low to high" }, { value: "price_desc", label: "Price: high to low" }, { value: "discount_desc", label: "Biggest discount" }, { value: "name_asc", label: "Name: A to Z" }]} />
          <InputNumber size="large" min={0} placeholder="Min price (PKR)" value={filters.minPrice ? Number(filters.minPrice) : null} onChange={(value) => dispatch(setMinPrice(value == null ? "" : String(value)))} className="!w-full" />
          <InputNumber size="large" min={0} placeholder="Max price (PKR)" value={filters.maxPrice ? Number(filters.maxPrice) : null} onChange={(value) => dispatch(setMaxPrice(value == null ? "" : String(value)))} className="!w-full" />
          <Input size="large" allowClear placeholder="Brand" value={filters.brand} onChange={(e) => dispatch(setBrand(e.target.value))} />
          <Input size="large" allowClear placeholder="Tag" value={filters.tag} onChange={(e) => dispatch(setTag(e.target.value))} />
          <label className="flex items-center gap-2 text-sm text-[#666b5e]"><Switch checked={filters.inStock} onChange={(value) => dispatch(setInStock(value))} /> In stock</label>
          <label className="flex items-center gap-2 text-sm text-[#666b5e]"><Switch checked={filters.discounted} onChange={(value) => dispatch(setDiscounted(value))} /> Discounted</label>
        </div>
        {productsQuery.isError && <Alert className="mb-5" type="error" showIcon title={productsQuery.error.message} />}
        {productsQuery.isLoading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Card key={i}><Skeleton active /></Card>)}</div> : page?.items.length ? <>
          <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{page.items.map((product) => <Link href={`/products/${product.slug}`} key={product._id} className="group block text-inherit">
            <div className="relative aspect-[4/4.5] overflow-hidden rounded-xl bg-[#efeee8]">{product.images[0]?.secureUrl ? <Image fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw" src={product.images[0].secureUrl} alt={product.images[0].altText || product.name} className="object-cover transition duration-500 group-hover:scale-[1.035]" /> : <div className="grid size-full place-items-center font-serif text-5xl text-[#b3b5a9]">N.</div>}{product.discountPercent > 0 && <Tag color="red" className="absolute left-3 top-3">-{product.discountPercent}%</Tag>}</div>
            <div className="flex items-start justify-between gap-3 pt-3"><div><p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8c80]">{product.category?.name || "Collection"}</p><h3 className="mt-1 font-medium text-[#303429] group-hover:text-[#758064]">{product.name}</h3></div><div className="shrink-0 text-right"><p className="text-sm font-semibold text-[#3d4235]">{formatPrice(product.salePriceMinor, product.currency)}</p>{product.discountPercent > 0 && <p className="text-xs text-[#9a9a90] line-through">{formatPrice(product.priceMinor, product.currency)}</p>}</div></div>
          </Link>)}</div>
          <div className="mt-10 flex justify-center"><Pagination current={page.pagination.page} pageSize={page.pagination.limit} total={page.pagination.total} showSizeChanger={false} onChange={(value) => { dispatch(setPage(value)); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }} /></div>
        </> : <div className="rounded-xl border border-dashed border-[#dcdcd2] bg-white/50 py-16"><Empty description="No products match those filters." /><div className="mt-5 text-center"><Button onClick={() => { dispatch(setSearch("")); dispatch(setCategory("")); dispatch(setInStock(false)); dispatch(setDiscounted(false)); dispatch(setMinPrice("")); dispatch(setMaxPrice("")); dispatch(setBrand("")); dispatch(setTag("")); }}>Clear filters</Button></div></div>}
      </section>
    </main>
  </div>;
}

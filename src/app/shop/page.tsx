"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Card, Drawer, Empty, Input, InputNumber, Pagination, Select, Skeleton, Switch, Tag } from "antd";
import { api, formatPrice, type Category, type ProductPage } from "../../lib/api";
import { queryKeys } from "../../lib/queryKeys";
import { setBrand, setCategory, setDiscounted, setInStock, setMaxPrice, setMinPrice, setPage, setSearch, setSort, setTag, type AppDispatch, type RootState } from "../../store/store";

const sortOptions = [
  { value: "newest", label: "Recently added" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "discount_desc", label: "Biggest discount" },
  { value: "name_asc", label: "Name: A to Z" },
];

export default function ShopPage() {
  const dispatch = useDispatch<AppDispatch>();
  const filters = useSelector((state: RootState) => state.catalog);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(filters.search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

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

  const productsQuery = useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => api<ProductPage>(`/api/products?${params}`),
  });
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list,
    queryFn: () => api<Category[]>("/api/categories"),
  });
  const page = productsQuery.data;

  const clearFilters = () => {
    dispatch(setSearch(""));
    dispatch(setCategory(""));
    dispatch(setInStock(false));
    dispatch(setDiscounted(false));
    dispatch(setMinPrice(""));
    dispatch(setMaxPrice(""));
    dispatch(setBrand(""));
    dispatch(setTag(""));
    dispatch(setSort("newest"));
  };

  const filterControls = (
    <div className="space-y-5">
      <div>
        <label htmlFor="product-search" className="mb-2 block text-xs font-medium text-[#666b5e]">Search</label>
        <Input id="product-search" allowClear placeholder="Search products…" value={filters.search} onChange={(event) => dispatch(setSearch(event.target.value))} />
      </div>
      <div>
        <label htmlFor="product-category" className="mb-2 block text-xs font-medium text-[#666b5e]">Category</label>
        <Select id="product-category" className="w-full" value={filters.category || ""} onChange={(value) => dispatch(setCategory(value))} options={[{ value: "", label: "All categories" }, ...(categoriesQuery.data || []).map((category) => ({ value: category.slug, label: category.name }))]} />
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-[#666b5e]">Price (PKR)</p>
        <div className="grid grid-cols-2 gap-2">
          <InputNumber aria-label="Minimum price in PKR" min={0} placeholder="Min" value={filters.minPrice ? Number(filters.minPrice) : null} onChange={(value) => dispatch(setMinPrice(value == null ? "" : String(value)))} className="!w-full" />
          <InputNumber aria-label="Maximum price in PKR" min={0} placeholder="Max" value={filters.maxPrice ? Number(filters.maxPrice) : null} onChange={(value) => dispatch(setMaxPrice(value == null ? "" : String(value)))} className="!w-full" />
        </div>
      </div>
      <div>
        <label htmlFor="product-brand" className="mb-2 block text-xs font-medium text-[#666b5e]">Brand</label>
        <Input id="product-brand" allowClear placeholder="Brand" value={filters.brand} onChange={(event) => dispatch(setBrand(event.target.value))} />
      </div>
      <div>
        <label htmlFor="product-tag" className="mb-2 block text-xs font-medium text-[#666b5e]">Tag</label>
        <Input id="product-tag" allowClear placeholder="Tag" value={filters.tag} onChange={(event) => dispatch(setTag(event.target.value))} />
      </div>
      <div className="space-y-4 border-t border-[#eceae3] pt-4">
        <label className="flex items-center justify-between gap-3 text-sm text-[#666b5e]">In stock <Switch checked={filters.inStock} onChange={(value) => dispatch(setInStock(value))} /></label>
        <label className="flex items-center justify-between gap-3 text-sm text-[#666b5e]">Discounted <Switch checked={filters.discounted} onChange={(value) => dispatch(setDiscounted(value))} /></label>
      </div>
      <Button block onClick={clearFilters}>Clear filters</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fbfaf7]">
      <main className="mx-auto max-w-7xl px-5 pb-16 pt-10">


        <div className="grid items-start gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside aria-label="Product filters" className="sticky top-24 hidden rounded-xl border border-[#e7e5dc] bg-white/85 p-5 lg:block">
            <h2 className="mb-5 font-serif text-xl text-[#303429]">Filter by</h2>
            {filterControls}
          </aside>

          <section aria-label="Products" className="min-w-0">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[#77796e]">{page ? `${page.pagination.total} products` : "Browse the collection"}</p>
              <div className="flex items-center gap-3">
                <Button className="lg:!hidden" onClick={() => setMobileFiltersOpen(true)}>Filters</Button>
                <Select aria-label="Sort products" value={filters.sort} onChange={(value) => dispatch(setSort(value))} options={sortOptions} className="w-48" />
              </div>
            </div>

            {productsQuery.isError && <Alert className="mb-5" type="error" showIcon title={productsQuery.error.message} />}
            {productsQuery.isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Card key={index}><Skeleton active /></Card>)}</div>
            ) : page?.items.length ? <>
              <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
                {page.items.map((product) => <Link href={`/products/${product.slug}`} key={product._id} className="group block text-inherit">
                  <div className="relative aspect-[4/4.5] overflow-hidden rounded-xl bg-[#efeee8]">
                    {product.images[0]?.secureUrl ? <Image fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" src={product.images[0].secureUrl} alt={product.images[0].altText || product.name} className="object-cover transition duration-500 group-hover:scale-[1.035]" /> : <div className="grid size-full place-items-center font-serif text-5xl text-[#b3b5a9]">N.</div>}
                    {product.discountPercent > 0 && <Tag color="red" className="absolute left-3 top-3">-{product.discountPercent}%</Tag>}
                  </div>
                  <div className="flex items-start justify-between gap-3 pt-3">
                    <div><p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8c80]">{product.category?.name || "Collection"}</p><h2 className="mt-1 font-medium text-[#303429] group-hover:text-[#758064]">{product.name}</h2></div>
                    <div className="shrink-0 text-right"><p className="text-sm font-semibold text-[#3d4235]">{formatPrice(product.salePriceMinor, product.currency)}</p>{product.discountPercent > 0 && <p className="text-xs text-[#9a9a90] line-through">{formatPrice(product.priceMinor, product.currency)}</p>}</div>
                  </div>
                </Link>)}
              </div>
              <div className="mt-10 flex justify-center"><Pagination current={page.pagination.page} pageSize={page.pagination.limit} total={page.pagination.total} showSizeChanger={false} onChange={(value) => { dispatch(setPage(value)); window.scrollTo({ top: 0, behavior: "smooth" }); }} /></div>
            </> : <div className="rounded-xl border border-dashed border-[#dcdcd2] bg-white/50 py-16"><Empty description="No products match those filters." /></div>}
          </section>
        </div>

        <Drawer
          title="Filter products"
          placement="left"
          size={320}
          open={mobileFiltersOpen}
          onClose={() => setMobileFiltersOpen(false)}
          footer={<Button type="primary" block onClick={() => setMobileFiltersOpen(false)}>Show results</Button>}
          className="lg:!hidden"
        >
          {filterControls}
        </Drawer>
      </main>
    </div>
  );
}

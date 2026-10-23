"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Card, Drawer, Empty, Input, InputNumber, Pagination, Select, Skeleton, Switch, Tag } from "antd";
import { SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import WishlistButton from "../../components/WishlistButton";
import { api, formatPrice, type Category, type ProductPage } from "../../lib/api";
import { queryKeys } from "../../lib/queryKeys";
import { readSession } from "../../lib/session";
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
  const queryClient = useQueryClient();
  const filters = useSelector((state: RootState) => state.catalog);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const priceRangeInvalid = Boolean(filters.minPrice && filters.maxPrice && Number(filters.minPrice) > Number(filters.maxPrice));

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
    if (!priceRangeInvalid && filters.minPrice && Number(filters.minPrice) >= 0) search.set("minPrice", String(Math.round(Number(filters.minPrice) * 100)));
    if (!priceRangeInvalid && filters.maxPrice && Number(filters.maxPrice) >= 0) search.set("maxPrice", String(Math.round(Number(filters.maxPrice) * 100)));
    if (filters.brand.trim()) search.set("brand", filters.brand.trim());
    if (filters.tag.trim()) search.set("tag", filters.tag.trim());
    return search.toString();
  }, [filters.page, filters.sort, filters.category, filters.inStock, filters.discounted, filters.minPrice, filters.maxPrice, filters.brand, filters.tag, debouncedSearch, priceRangeInvalid]);

  const productsQuery = useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => api<ProductPage>(`/api/products?${params}`),
  });
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list,
    queryFn: () => api<Category[]>("/api/categories"),
  });
  const page = productsQuery.data;
  const addToCart = useMutation({
    mutationFn: (productId: string) => api("/api/cart/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, quantity: 1 }) }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["cart"] }); toast.success("Added to your cart."); },
    onError: (error: Error) => toast.error(error.message),
  });
  const activeFilters = [
    ...(debouncedSearch ? [{ label: `Search: ${debouncedSearch}`, clear: () => dispatch(setSearch("")) }] : []),
    ...(filters.category ? [{ label: categoriesQuery.data?.find((item) => item.slug === filters.category)?.name || "Category", clear: () => dispatch(setCategory("")) }] : []),
    ...(filters.minPrice ? [{ label: `From PKR ${filters.minPrice}`, clear: () => dispatch(setMinPrice("")) }] : []),
    ...(filters.maxPrice ? [{ label: `Up to PKR ${filters.maxPrice}`, clear: () => dispatch(setMaxPrice("")) }] : []),
    ...(filters.brand ? [{ label: `Brand: ${filters.brand}`, clear: () => dispatch(setBrand("")) }] : []),
    ...(filters.tag ? [{ label: `Tag: ${filters.tag}`, clear: () => dispatch(setTag("")) }] : []),
    ...(filters.inStock ? [{ label: "In stock", clear: () => dispatch(setInStock(false)) }] : []),
    ...(filters.discounted ? [{ label: "On sale", clear: () => dispatch(setDiscounted(false)) }] : []),
  ];

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
        {priceRangeInvalid && <p role="alert" className="mt-2 text-xs text-[#a14d42]">Maximum price must be at least the minimum price.</p>}
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
      <Button block onClick={clearFilters} disabled={activeFilters.length === 0}>Clear filters</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fbfaf7] [&_a]:cursor-pointer [&_button:not(:disabled)]:cursor-pointer [&_img]:cursor-pointer">
      <main className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:pt-10">


        <div className="grid items-start gap-8 lg:grid-cols-[230px_minmax(0,1fr)] xl:gap-10">
          <aside aria-label="Product filters" className="sticky top-24 hidden border-r border-[#e7e5dc] pr-6 lg:block">
            <h2 className="mb-5 font-serif text-xl text-[#303429]">Refine</h2>
            {filterControls}
          </aside>

          <section aria-label="Products" className="min-w-0">
            <header className="mb-6 border-b border-[#e8e6de] pb-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#858978]">Thoughtfully chosen</p>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                <div><h1 className="font-serif text-3xl tracking-tight text-[#303429] sm:text-4xl">The collection</h1><p className="mt-1 text-sm text-[#77796e]">{page ? `${page.pagination.total} pieces to discover` : "Browse the collection"}</p></div>
              <div className="flex items-center gap-3">
                <Button className="lg:!hidden" icon={<SlidersHorizontal size={15} />} onClick={() => setMobileFiltersOpen(true)}>Filters{activeFilters.length ? ` · ${activeFilters.length}` : ""}</Button>
                <Select aria-label="Sort products" value={filters.sort} onChange={(value) => dispatch(setSort(value))} options={sortOptions} className="w-48" />
              </div>
              </div>
              {activeFilters.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-2">{activeFilters.map((filter) => <Tag key={filter.label} closable onClose={(event) => { event.preventDefault(); filter.clear(); }} className="!m-0 !rounded-full !border-[#dedfd5] !bg-white !px-3 !py-1 !text-[#626858]">{filter.label}</Tag>)}<Button type="link" size="small" onClick={clearFilters} className="!px-1 !text-[#697457]">Clear all</Button></div>}
            </header>

            {priceRangeInvalid && <Alert className="mb-5" type="warning" showIcon title="Check your price range" description="Adjust the minimum or maximum price to see matching products." />}
            {productsQuery.isError && !page && <Alert className="mb-5" type="error" showIcon title="We couldn’t load the collection" description="Please check your connection and try again." action={<Button onClick={() => productsQuery.refetch()}>Retry</Button>} />}
            {productsQuery.isLoading && !page ? (
              <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Card key={index} className="!border-0 !bg-transparent !p-0 !shadow-none"><Skeleton.Image active className="!h-auto !aspect-[4/4.5] !w-full" /><Skeleton active title={{ width: "68%" }} paragraph={{ rows: 1, width: "45%" }} className="mt-3" /></Card>)}</div>
            ) : page?.items.length ? <>
              <div aria-live="polite" className={`grid gap-x-5 gap-y-9 transition-opacity duration-200 motion-reduce:transition-none sm:grid-cols-2 xl:grid-cols-3 ${productsQuery.isFetching ? "opacity-70" : "opacity-100"}`}>
                {page.items.map((product) => <article key={product._id} className="group relative min-w-0">
                  <Link href={`/products/${product.slug}`} className="block text-inherit outline-none focus-visible:ring-2 focus-visible:ring-[#758064] focus-visible:ring-offset-4">
                  <div className="relative aspect-[4/4.7] overflow-hidden bg-[#efeee8]">
                    {product.images[0]?.secureUrl ? <Image fill sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 1024px) 44vw, (max-width: 1280px) 30vw, 25vw" src={product.images[0].secureUrl} alt={product.images[0].altText || product.name} className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none" /> : <div className="grid size-full place-items-center font-serif text-5xl text-[#b3b5a9]">N.</div>}
                    {product.discountPercent > 0 && <span className="absolute left-3 top-3 bg-[#fbfaf7] px-2.5 py-1 text-[10px] font-medium tracking-wide text-[#697457]">−{product.discountPercent}%</span>}
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex h-14 items-start justify-end p-2">
                    <div className="pointer-events-auto">
                      <WishlistButton productId={product._id} productName={product.name} className="!relative !right-auto !top-auto !z-30 !size-9 !border-0 !bg-[#fbfaf7]/95 !text-[#4d5344] !shadow-none transition-colors hover:!bg-white hover:!text-rose-600 motion-reduce:transition-none" />
                    </div>
                  </div>
                  <div className="flex flex-col pt-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#858978]">{product.category?.name || product.brand || "Collection"}</p>
                    <h2 className="mt-1 line-clamp-2 text-sm leading-5 text-[#303429] transition-colors group-hover:text-[#697457]">{product.name}</h2>
                    <div className="flex items-baseline gap-2"><p className="text-sm font-semibold text-[#3d4235]">{formatPrice(product.salePriceMinor, product.currency)}</p>{product.discountPercent > 0 && <p className="text-xs text-[#9a9a90] line-through">{formatPrice(product.priceMinor, product.currency)}</p>}</div>
                  </div>
                  </Link>
                  <Button
                    block
                    size="small"
                    disabled={product.trackInventory && product.availablePieces < 1}
                    loading={addToCart.isPending && addToCart.variables === product._id}
                    onClick={() => {
                      if (!readSession()) { toast.info("Sign in first to add items to your cart."); return; }
                      addToCart.mutate(product._id);
                    }}
                    className="mt-2 !h-9 !rounded-none !border-[#d9dbd0] !bg-transparent !text-xs !font-medium !tracking-wide !text-[#4d5344] transition-colors hover:!border-[#758064] hover:!bg-[#758064] hover:!text-white motion-reduce:transition-none"
                  >{product.trackInventory && product.availablePieces < 1 ? "Out of stock" : "Add to cart"}</Button>
                </article>)}
              </div>
              <div className="mt-12 flex justify-center"><Pagination aria-label="Product pages" current={page.pagination.page} pageSize={page.pagination.limit} total={page.pagination.total} showSizeChanger={false} onChange={(value) => { dispatch(setPage(value)); window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }} /></div>
            </> : !productsQuery.isError ? <div className="border-y border-[#e7e5dc] py-16 text-center"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className="text-[#77796e]">No pieces match these filters.</span>} /><Button type="primary" ghost onClick={clearFilters}>Clear filters</Button></div> : null}
          </section>
        </div>

        <Drawer
          title="Filter products"
          placement="left"
          size={360}
          open={mobileFiltersOpen}
          onClose={() => setMobileFiltersOpen(false)}
          footer={<div className="flex items-center gap-3"><Button className="flex-1" onClick={clearFilters}>Clear</Button><Button type="primary" className="flex-[2]" onClick={() => setMobileFiltersOpen(false)}>Show {page?.pagination.total ?? ""} results</Button></div>}
          className="lg:!hidden"
        >
          <div className="max-h-[calc(100dvh-150px)] overflow-y-auto px-1 pb-2">{filterControls}</div>
        </Drawer>
      </main>
    </div>
  );
}

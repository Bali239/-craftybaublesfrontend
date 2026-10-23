"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Card, Drawer, Empty, Input, InputNumber, Pagination, Select, Skeleton, Switch, Tag } from "antd";
import { SlidersHorizontal, X } from "lucide-react";
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
    <div className="space-y-0 divide-y divide-[#eae8e0]">
      <div className="pb-3">
        <label htmlFor="product-search" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.11em] text-[#74796a]">Search</label>
        <Input id="product-search" allowClear placeholder="Search products…" value={filters.search} onChange={(event) => dispatch(setSearch(event.target.value))} className="filter-control" />
      </div>
      <div className="py-3">
        <label htmlFor="product-category" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.11em] text-[#74796a]">Category</label>
        <Select id="product-category" className="filter-control w-full" value={filters.category || ""} onChange={(value) => dispatch(setCategory(value))} options={[{ value: "", label: "All categories" }, ...(categoriesQuery.data || []).map((category) => ({ value: category.slug, label: category.name }))]} />
      </div>
      <div className="py-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.11em] text-[#74796a]">Price range <span className="font-normal normal-case tracking-normal text-[#999b91]">(PKR)</span></p>
        <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-[#e4e3da] bg-white/70 p-1.5 transition-colors focus-within:border-[#9ca58b] focus-within:ring-2 focus-within:ring-[#758064]/15 motion-reduce:transition-none">
          <label className="min-w-0 text-[10px] font-medium uppercase tracking-wide text-[#919387]">Min<InputNumber aria-label="Minimum price in PKR" min={0} placeholder="0" value={filters.minPrice ? Number(filters.minPrice) : null} onChange={(value) => dispatch(setMinPrice(value == null ? "" : String(value)))} className="filter-price w-full" controls={false} /></label>
          <label className="min-w-0 border-l border-[#eceae3] pl-2 text-[10px] font-medium uppercase tracking-wide text-[#919387]">Max<InputNumber aria-label="Maximum price in PKR" min={0} placeholder="Any" value={filters.maxPrice ? Number(filters.maxPrice) : null} onChange={(value) => dispatch(setMaxPrice(value == null ? "" : String(value)))} className="filter-price w-full" controls={false} /></label>
        </div>
        {priceRangeInvalid && <p role="alert" className="mt-2 text-xs text-[#a14d42]">Maximum price must be at least the minimum price.</p>}
      </div>
      <div className="py-3">
        <label htmlFor="product-brand" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.11em] text-[#74796a]">Brand</label>
        <Input id="product-brand" allowClear placeholder="Any brand" value={filters.brand} onChange={(event) => dispatch(setBrand(event.target.value))} className="filter-control" />
      </div>
      <div className="py-3">
        <label htmlFor="product-tag" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.11em] text-[#74796a]">Tag</label>
        <Input id="product-tag" allowClear placeholder="Any tag" value={filters.tag} onChange={(event) => dispatch(setTag(event.target.value))} className="filter-control" />
      </div>
      <div className="space-y-2.5 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-[#74796a]">Availability & offers</p>
        <label className="flex min-h-8 cursor-pointer items-center justify-between gap-3 text-[13px] text-[#4e5347]">In stock <Switch checked={filters.inStock} onChange={(value) => dispatch(setInStock(value))} className="filter-switch" /></label>
        <label className="flex min-h-8 cursor-pointer items-center justify-between gap-3 text-[13px] text-[#4e5347]">Discounted <Switch checked={filters.discounted} onChange={(value) => dispatch(setDiscounted(value))} className="filter-switch" /></label>
      </div>
    </div>
  );

  return (
    <div className="shop-page min-h-screen bg-[#fbfaf7] [&_a]:cursor-pointer [&_button:not(:disabled)]:cursor-pointer [&_img]:cursor-pointer [&_.filter-control.ant-input-affix-wrapper]:!h-9 [&_.filter-control.ant-input-affix-wrapper]:!rounded-lg [&_.filter-control.ant-input-affix-wrapper]:!border-[#e4e3da] [&_.filter-control.ant-input-affix-wrapper]:!bg-white/75 [&_.filter-control.ant-input-affix-wrapper]:!px-2.5 [&_.filter-control.ant-input-affix-wrapper]:!shadow-none [&_.filter-control.ant-input-affix-wrapper:hover]:!border-[#b9bfad] [&_.filter-control.ant-input-affix-wrapper-focused]:!border-[#899579] [&_.filter-control.ant-input-affix-wrapper-focused]:!ring-2 [&_.filter-control.ant-input-affix-wrapper-focused]:!ring-[#758064]/15 [&_.filter-control.ant-input]:!text-[13px] [&_.filter-control.ant-input]:placeholder:!text-[#adafa5] [&_.filter-control.ant-select-selector]:!h-9 [&_.filter-control.ant-select-selector]:!items-center [&_.filter-control.ant-select-selector]:!rounded-lg [&_.filter-control.ant-select-selector]:!border-[#e4e3da] [&_.filter-control.ant-select-selector]:!bg-white/75 [&_.filter-control.ant-select-selector]:!shadow-none [&_.filter-control.ant-select-focused_.ant-select-selector]:!border-[#899579] [&_.filter-control.ant-select-focused_.ant-select-selector]:!ring-2 [&_.filter-control.ant-select-focused_.ant-select-selector]:!ring-[#758064]/15 [&_.filter-price.ant-input-number]:!h-7 [&_.filter-price.ant-input-number]:!border-0 [&_.filter-price.ant-input-number]:!bg-transparent [&_.filter-price.ant-input-number]:!shadow-none [&_.filter-price_.ant-input-number-input]:!px-0 [&_.filter-price_.ant-input-number-input]:!text-[13px] [&_.filter-switch.ant-switch-checked]:!bg-[#758064] [&_.filter-switch.ant-switch]:transition-colors [&_.filter-switch.ant-switch]:duration-200 [&_.filter-switch.ant-switch]:motion-reduce:!transition-none">
      <main className="mx-auto max-w-7xl px-5 pb-12 pt-5 sm:pt-6">


        <div className="grid items-start gap-8 lg:grid-cols-[230px_minmax(0,1fr)] xl:gap-10">
          <aside aria-label="Product filters" className="sticky top-24 hidden max-h-[calc(100vh-7rem)] self-start overflow-y-auto overscroll-contain rounded-xl border border-[#e7e5dc] bg-white/65 p-4 [scrollbar-color:#c7cabc_transparent] [scrollbar-width:thin] lg:block">
            <div className="mb-2.5 flex items-center justify-between border-b border-[#eae8e0] pb-2.5">
              <h2 className="flex items-center gap-1.5 font-serif text-lg text-[#303429]"><SlidersHorizontal size={14} strokeWidth={1.7} className="text-[#758064]" />Filters</h2>
              <Button type="text" size="small" onClick={clearFilters} disabled={activeFilters.length === 0} className="!h-auto !px-1 !text-xs !text-[#7a806d] hover:!text-[#4f5b40] disabled:!text-[#b2b3aa]">Clear all</Button>
            </div>
            {filterControls}
          </aside>

          <section aria-label="Products" className="min-w-0">
            <header className="mb-4 border-b border-[#e8e6de] pb-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#858978]">Thoughtfully chosen</p>
              <div className="mt-1.5 flex flex-wrap items-end justify-between gap-3">
                <div><h1 className="font-serif text-2xl tracking-tight text-[#303429] sm:text-3xl">The collection</h1><p className="mt-0.5 text-xs text-[#77796e]">{page ? `${page.pagination.total} pieces to discover` : "Browse the collection"}</p></div>
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
              <div className="grid grid-cols-3 gap-x-2 gap-y-4 sm:gap-x-3 sm:gap-y-5 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">{Array.from({ length: 10 }, (_, index) => <Card key={index} className="!border-0 !bg-transparent !p-0 !shadow-none"><Skeleton.Image active className="!h-auto !aspect-[4/4.2] !w-full" /><Skeleton active title={{ width: "68%" }} paragraph={{ rows: 1, width: "45%" }} className="mt-2" /></Card>)}</div>
            ) : page?.items.length ? <>
              <div aria-live="polite" className={`grid grid-cols-3 gap-x-2 gap-y-4 transition-opacity duration-200 motion-reduce:transition-none sm:gap-x-3 sm:gap-y-5 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 ${productsQuery.isFetching ? "opacity-70" : "opacity-100"}`}>
                {page.items.map((product) => <article key={product._id} className="group relative flex min-w-0 flex-col">
                  <Link href={`/products/${product.slug}`} className="block text-inherit outline-none focus-visible:ring-2 focus-visible:ring-[#758064] focus-visible:ring-offset-4">
                  <div className="relative aspect-[4/4.2] overflow-hidden bg-[#efeee8]">
                    {product.images[0]?.secureUrl ? <Image fill sizes="(max-width: 640px) calc((100vw - 52px) / 2), (max-width: 768px) 30vw, (max-width: 1024px) 22vw, (max-width: 1536px) 18vw, 16vw" src={product.images[0].secureUrl} alt={product.images[0].altText || product.name} className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none" /> : <div className="grid size-full place-items-center font-serif text-4xl text-[#b3b5a9]">N.</div>}
                    {product.discountPercent > 0 && <span className="absolute left-2 top-2 bg-[#fbfaf7] px-2 py-0.5 text-[9px] font-medium tracking-wide text-[#697457]">−{product.discountPercent}%</span>}
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex h-14 items-start justify-end p-2">
                    <div className="pointer-events-auto">
                      <WishlistButton productId={product._id} productName={product.name} className="!relative !right-auto !top-auto !z-30 !size-8 !border-0 !bg-[#fbfaf7]/95 !text-[#4d5344] !shadow-none transition-colors hover:!bg-white hover:!text-rose-600 motion-reduce:transition-none" />
                    </div>
                  </div>
                  <div className="flex h-[88px] flex-col pt-2 sm:h-[92px]">
                    <p className="text-[9px] uppercase tracking-[0.12em] text-[#858978]">{product.category?.name || product.brand || "Collection"}</p>
                    <h2 className="mt-0.5 line-clamp-2 min-h-8 text-xs leading-4 text-[#303429] transition-colors group-hover:text-[#697457] sm:text-[13px]">{product.name}</h2>
                    <div className="flex items-baseline gap-1.5"><p className="text-[13px] font-semibold text-[#3d4235]">{formatPrice(product.salePriceMinor, product.currency)}</p>{product.discountPercent > 0 && <p className="text-[10px] text-[#9a9a90] line-through">{formatPrice(product.priceMinor, product.currency)}</p>}</div>
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
                    className="!mt-auto !h-8 !shrink-0 !rounded-none !border-[#d9dbd0] !bg-transparent !text-[11px] !font-medium !tracking-wide !text-[#4d5344] transition-colors hover:!border-[#758064] hover:!bg-[#758064] hover:!text-white motion-reduce:transition-none"
                  >{product.trackInventory && product.availablePieces < 1 ? "Out of stock" : "Add to cart"}</Button>
                </article>)}
              </div>
              <div className="mt-8 flex justify-center"><Pagination aria-label="Product pages" current={page.pagination.page} pageSize={page.pagination.limit} total={page.pagination.total} showSizeChanger={false} onChange={(value) => { dispatch(setPage(value)); window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }} /></div>
            </> : !productsQuery.isError ? <div className="border-y border-[#e7e5dc] py-16 text-center"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className="text-[#77796e]">No pieces match these filters.</span>} /><Button type="primary" ghost onClick={clearFilters}>Clear filters</Button></div> : null}
          </section>
        </div>

        <Drawer
          title={<span className="flex items-center gap-2 font-serif text-xl text-[#303429]"><SlidersHorizontal size={17} className="text-[#758064]" />Filters</span>}
          placement="left"
          size={360}
          open={mobileFiltersOpen}
          onClose={() => setMobileFiltersOpen(false)}
          closeIcon={<X size={18} />}
          footer={<div className="flex items-center justify-between gap-3"><Button type="text" onClick={clearFilters} disabled={activeFilters.length === 0} className="!text-[#737a66]">Clear all</Button><Button type="primary" className="flex-1 !h-10 !bg-[#758064]" onClick={() => setMobileFiltersOpen(false)}>Show {page?.pagination.total ?? ""} results</Button></div>}
          className="filter-drawer lg:!hidden"
          styles={{ header: { borderBottom: "1px solid #eae8e0", padding: "14px 18px" }, body: { padding: "12px 18px 0" }, footer: { borderTop: "1px solid #eae8e0", padding: "10px 18px max(10px, env(safe-area-inset-bottom))" } }}
        >
          <div className="max-h-[calc(100dvh-155px)] overflow-y-auto px-1 pb-8">{filterControls}</div>
        </Drawer>
      </main>
    </div>
  );
}

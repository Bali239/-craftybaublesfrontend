"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Drawer, Empty, Input, InputNumber, Pagination, Select, Skeleton, Switch } from "antd";
import { ArrowLeft, Heart, ShoppingBag, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import GoogleSignInButton from "../../components/GoogleSignInButton";
import WishlistButton from "../../components/WishlistButton";
import { api, formatPrice, type WishlistPage } from "../../lib/api";
import { readSession } from "../../lib/session";
import { setBrand, setCategory, setDiscounted, setInStock, setMaxPrice, setMinPrice, setPage, setSearch, setSort, setTag, type AppDispatch, type RootState } from "../../store/store";

const sortOptions = [
  { value: "newest", label: "Recently added" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "discount_desc", label: "Biggest discount" },
  { value: "name_asc", label: "Name: A to Z" },
];
export default function WishlistPage() {
  const dispatch = useDispatch<AppDispatch>();
  const filters = useSelector((state: RootState) => state.catalog);
  const client = useQueryClient();
  const [signedIn, setSignedIn] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [categorySearch, setCategorySearch] = useState("");
  const [debouncedCategorySearch, setDebouncedCategorySearch] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const priceRangeInvalid = Boolean(filters.minPrice && filters.maxPrice && Number(filters.minPrice) > Number(filters.maxPrice));

  useEffect(() => {
    const timer = window.setTimeout(() => setSignedIn(Boolean(readSession())), 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(filters.search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [filters.search]);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedCategorySearch(categorySearch.trim()), 500);
    return () => window.clearTimeout(timer);
  }, [categorySearch]);

  const params = useMemo(() => {
    const query = new URLSearchParams({ page: String(filters.page), limit: "12", sort: filters.sort });
    if (debouncedSearch) query.set("q", debouncedSearch);
    if (filters.category) query.set("category", filters.category);
    if (filters.brand.trim()) query.set("brand", filters.brand.trim());
    if (filters.tag.trim()) query.set("tag", filters.tag.trim());
    if (!priceRangeInvalid && filters.minPrice) query.set("minPrice", String(Math.round(Number(filters.minPrice) * 100)));
    if (!priceRangeInvalid && filters.maxPrice) query.set("maxPrice", String(Math.round(Number(filters.maxPrice) * 100)));
    if (filters.inStock) query.set("inStock", "true");
    if (filters.discounted) query.set("discounted", "true");
    return query.toString();
  }, [filters.page, filters.sort, filters.category, filters.brand, filters.tag, filters.minPrice, filters.maxPrice, filters.inStock, filters.discounted, debouncedSearch, priceRangeInvalid]);
  const wishlist = useQuery({ queryKey: ["wishlist", "page", params], queryFn: () => api<WishlistPage>(`/api/wishlist?${params}`), enabled: signedIn });
  const products = useMemo(() => wishlist.data?.items || [], [wishlist.data?.items]);
  const pagination = wishlist.data?.pagination;
  const total = pagination?.total || 0;
  const categoriesQuery = useQuery({ queryKey: ["categories", "list", debouncedCategorySearch], queryFn: () => api<{ _id: string; name: string; slug: string }[]>(`/api/categories${debouncedCategorySearch ? `?q=${encodeURIComponent(debouncedCategorySearch)}` : ""}`), enabled: signedIn });
  const productCountLabel = `${total} ${total === 1 ? "saved piece" : "saved pieces"}`;

  const clearFilters = () => {
    dispatch(setSearch("")); dispatch(setCategory("")); dispatch(setInStock(false)); dispatch(setDiscounted(false));
    dispatch(setMinPrice("")); dispatch(setMaxPrice("")); dispatch(setBrand("")); dispatch(setTag("")); dispatch(setSort("newest")); dispatch(setPage(1));
  };
  const activeCount = Number(Boolean(filters.search.trim())) + Number(Boolean(filters.category)) + Number(Boolean(filters.minPrice)) + Number(Boolean(filters.maxPrice)) + Number(Boolean(filters.brand.trim())) + Number(Boolean(filters.tag.trim())) + Number(filters.inStock) + Number(filters.discounted);
  const addToCart = useMutation({
    mutationFn: (productId: string) => api("/api/cart/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, quantity: 1 }) }),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ["cart"] }); toast.success("Added to your cart."); },
    onError: (error: Error) => toast.error(error.message),
  });

  const filterControls = <div className="space-y-0 divide-y divide-[#eae8e0]">
    <div className="pb-3"><label htmlFor="wishlist-search" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.11em] text-[#74796a]">Search saved items</label><Input id="wishlist-search" allowClear placeholder="Search wishlist…" value={filters.search} onChange={(event) => dispatch(setSearch(event.target.value))} className="wishlist-filter-control" /></div>
    <div className="py-3"><label htmlFor="wishlist-category" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.11em] text-[#74796a]">Category</label><Select id="wishlist-category" showSearch filterOption={false} onSearch={setCategorySearch} searchValue={categorySearch} notFoundContent={categoriesQuery.isFetching ? "Searching…" : "No matching categories"} className="wishlist-filter-control w-full" value={filters.category || ""} onChange={(value) => { dispatch(setCategory(value)); setCategorySearch(""); }} options={[{ value: "", label: "All categories" }, ...(categoriesQuery.data || []).map((category) => ({ value: category.slug, label: category.name }))]} /></div>
    <div className="py-3"><p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.11em] text-[#74796a]">Price range <span className="font-normal normal-case tracking-normal text-[#999b91]">(PKR)</span></p><div className="grid grid-cols-2 gap-1.5 rounded-lg border border-[#e4e3da] bg-white/70 p-1.5 focus-within:border-[#9ca58b] focus-within:ring-2 focus-within:ring-[#758064]/15"><label className="min-w-0 text-[10px] font-medium uppercase tracking-wide text-[#919387]">Min<InputNumber aria-label="Minimum wishlist price in PKR" min={0} placeholder="0" value={filters.minPrice ? Number(filters.minPrice) : null} onChange={(value) => dispatch(setMinPrice(value == null ? "" : String(value)))} className="wishlist-filter-price w-full" controls={false} /></label><label className="min-w-0 border-l border-[#eceae3] pl-2 text-[10px] font-medium uppercase tracking-wide text-[#919387]">Max<InputNumber aria-label="Maximum wishlist price in PKR" min={0} placeholder="Any" value={filters.maxPrice ? Number(filters.maxPrice) : null} onChange={(value) => dispatch(setMaxPrice(value == null ? "" : String(value)))} className="wishlist-filter-price w-full" controls={false} /></label></div>{priceRangeInvalid && <p role="alert" className="mt-2 text-xs text-[#a14d42]">Maximum price must be at least the minimum price.</p>}</div>
    <div className="py-3"><label htmlFor="wishlist-brand" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.11em] text-[#74796a]">Brand</label><Input id="wishlist-brand" allowClear placeholder="Any brand" value={filters.brand} onChange={(event) => dispatch(setBrand(event.target.value))} className="wishlist-filter-control" /></div>
    <div className="py-3"><label htmlFor="wishlist-tag" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.11em] text-[#74796a]">Tag</label><Input id="wishlist-tag" allowClear placeholder="Any tag" value={filters.tag} onChange={(event) => dispatch(setTag(event.target.value))} className="wishlist-filter-control" /></div>
    <div className="space-y-2.5 pt-3"><p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-[#74796a]">Availability & offers</p><label className="flex min-h-8 cursor-pointer items-center justify-between gap-3 text-[13px] text-[#4e5347]">In stock <Switch checked={filters.inStock} onChange={(value) => dispatch(setInStock(value))} className="wishlist-filter-switch" /></label><label className="flex min-h-8 cursor-pointer items-center justify-between gap-3 text-[13px] text-[#4e5347]">Discounted <Switch checked={filters.discounted} onChange={(value) => dispatch(setDiscounted(value))} className="wishlist-filter-switch" /></label></div>
  </div>;

  return <div className="wishlist-page min-h-screen bg-[#fbfaf7] [&_a]:cursor-pointer [&_button:not(:disabled)]:cursor-pointer [&_img]:cursor-pointer [&_.wishlist-filter-control.ant-input-affix-wrapper]:!h-9 [&_.wishlist-filter-control.ant-input-affix-wrapper]:!rounded-lg [&_.wishlist-filter-control.ant-input-affix-wrapper]:!border-[#e4e3da] [&_.wishlist-filter-control.ant-input-affix-wrapper]:!bg-white/75 [&_.wishlist-filter-control.ant-input-affix-wrapper]:!px-2.5 [&_.wishlist-filter-control.ant-input-affix-wrapper]:!shadow-none [&_.wishlist-filter-control.ant-input]:!text-[13px] [&_.wishlist-filter-control.ant-select-selector]:!h-9 [&_.wishlist-filter-control.ant-select-selector]:!items-center [&_.wishlist-filter-control.ant-select-selector]:!rounded-lg [&_.wishlist-filter-control.ant-select-selector]:!border-[#e4e3da] [&_.wishlist-filter-control.ant-select-selector]:!bg-white/75 [&_.wishlist-filter-control.ant-select-selector]:!shadow-none [&_.wishlist-filter-price.ant-input-number]:!h-7 [&_.wishlist-filter-price.ant-input-number]:!border-0 [&_.wishlist-filter-price.ant-input-number]:!bg-transparent [&_.wishlist-filter-price.ant-input-number]:!shadow-none [&_.wishlist-filter-price_.ant-input-number-input]:!px-0 [&_.wishlist-filter-switch.ant-switch-checked]:!bg-[#758064]">
    <main className="mx-auto max-w-7xl px-5 pb-12 pt-5 sm:pt-6">
      <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-[#737866] transition-colors hover:text-[#303429]"><ArrowLeft size={16} /> Continue shopping</Link>
      <header className="mt-5 mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-[#e8e6de] pb-4">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#858978]">Saved for later</p><h1 className="mt-1 font-serif text-3xl tracking-tight text-[#303429] sm:text-4xl">My wishlist</h1><p className="mt-0.5 text-xs text-[#77796e]">{productCountLabel}</p></div>
        {signedIn && total > 0 && <div className="flex items-center gap-2"><Button className="lg:!hidden" icon={<SlidersHorizontal size={15} />} onClick={() => setMobileFiltersOpen(true)}>Filters{activeCount ? ` · ${activeCount}` : ""}</Button><Select aria-label="Sort wishlist" value={filters.sort} onChange={(value) => dispatch(setSort(value))} options={sortOptions} className="w-44" /></div>}
      </header>

      {!signedIn ? <div className="mt-8 rounded-2xl border border-[#e7e5dc] bg-white px-6 py-12 text-center shadow-sm"><div className="mx-auto grid size-14 place-items-center rounded-full bg-[#f2f1eb] text-[#697457]"><Heart size={24} /></div><h2 className="mt-5 font-serif text-2xl text-[#303429]">Sign in to view your wishlist</h2><p className="mx-auto mb-5 mt-2 max-w-md text-sm leading-6 text-[#777b6d]">Your saved products are kept with your account so you can find them again later.</p><GoogleSignInButton type="primary">Sign in to continue</GoogleSignInButton></div>
      : wishlist.isLoading ? <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">{Array.from({ length: 10 }, (_, index) => <div key={index}><Skeleton.Image active className="!h-auto !aspect-[4/4.2] !w-full" /><Skeleton active className="mt-2" title={{ width: "68%" }} paragraph={{ rows: 1, width: "45%" }} /></div>)}</div>
      : wishlist.error ? <Alert className="mt-6" type="error" showIcon title="We couldn’t load your wishlist" description="Please check your connection and try again." action={<Button onClick={() => wishlist.refetch()}>Retry</Button>} />
      : total === 0 && activeCount === 0 ? <div className="mt-8 rounded-2xl border border-[#e7e5dc] bg-white px-6 py-14 text-center"><div className="mx-auto grid size-14 place-items-center rounded-full bg-[#f2f1eb] text-[#697457]"><ShoppingBag size={24} /></div><h2 className="mt-5 font-serif text-2xl text-[#303429]">Your wishlist is empty</h2><p className="mt-2 text-sm text-[#777b6d]">Save products you love and they’ll be waiting here.</p><Button type="primary" size="large" className="mt-6" href="/shop">Explore the collection</Button></div>
      : <div className="grid items-start gap-6 lg:grid-cols-[230px_minmax(0,1fr)] xl:gap-8">
        <aside aria-label="Wishlist filters" className="sticky top-24 hidden max-h-[calc(100vh-7rem)] self-start overflow-y-auto overscroll-contain rounded-xl border border-[#e7e5dc] bg-white/65 p-4 [scrollbar-color:#c7cabc_transparent] [scrollbar-width:thin] lg:block"><div className="mb-2.5 flex items-center justify-between border-b border-[#eae8e0] pb-2.5"><h2 className="flex items-center gap-1.5 font-serif text-lg text-[#303429]"><SlidersHorizontal size={14} className="text-[#758064]" />Filters</h2><Button type="text" size="small" onClick={clearFilters} disabled={!activeCount} className="!h-auto !px-1 !text-xs !text-[#7a806d]">Clear all</Button></div>{filterControls}</aside>
        <section aria-label="Saved products" className="min-w-0">
          {priceRangeInvalid && <Alert className="mb-4" type="warning" showIcon title="Check your price range" description="Adjust the minimum or maximum price to see matching products." />}
          {products.length ? <><div className={`grid grid-cols-3 gap-x-2 gap-y-4 transition-opacity motion-reduce:transition-none sm:gap-x-3 sm:gap-y-5 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 ${wishlist.isFetching ? "opacity-70" : "opacity-100"}`}>{products.map((product) => <article key={product._id} className="group relative flex min-w-0 flex-col">
            <Link href={`/products/${product.slug}`} className="block text-inherit outline-none focus-visible:ring-2 focus-visible:ring-[#758064] focus-visible:ring-offset-4"><div className="relative aspect-[4/4.2] overflow-hidden bg-[#efeee8]">{product.images?.[0]?.secureUrl ? <Image fill sizes="(max-width: 640px) calc((100vw - 52px) / 3), (max-width: 768px) 30vw, (max-width: 1024px) 22vw, (max-width: 1536px) 18vw, 16vw" src={product.images[0].secureUrl} alt={product.images[0].altText || product.name} className="object-cover transition-transform duration-500 group-hover:scale-[1.025] motion-reduce:transition-none" /> : <div className="grid size-full place-items-center font-serif text-4xl text-[#b3b5a9]">N.</div>}{product.discountPercent > 0 && <span className="absolute left-2 top-2 bg-[#fbfaf7] px-2 py-0.5 text-[9px] font-medium text-[#697457]">−{product.discountPercent}%</span>}</div><div className="flex h-[88px] flex-col pt-2 sm:h-[92px]"><p className="text-[9px] uppercase tracking-[0.12em] text-[#858978]">{product.category?.name || product.brand || "Collection"}</p><h2 className="mt-0.5 line-clamp-2 min-h-8 text-xs leading-4 text-[#303429] sm:text-[13px]">{product.name}</h2><div className="flex items-baseline gap-1.5"><p className="text-[13px] font-semibold text-[#3d4235]">{formatPrice(product.salePriceMinor, product.currency)}</p>{product.discountPercent > 0 && <p className="text-[10px] text-[#9a9a90] line-through">{formatPrice(product.priceMinor, product.currency)}</p>}</div></div></Link>
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-12 justify-end p-2"><div className="pointer-events-auto"><WishlistButton productId={product._id} productName={product.name} className="!relative !size-8 !border-0 !bg-[#fbfaf7]/95 !text-[#4d5344] !shadow-none" /></div></div>
            <Button block size="small" disabled={product.trackInventory && product.availablePieces < 1} loading={addToCart.isPending && addToCart.variables === product._id} onClick={() => { if (!readSession()) { toast.info("Sign in first to add items to your cart."); return; } addToCart.mutate(product._id); }} className="!mt-auto !h-8 !rounded-none !border-[#d9dbd0] !bg-transparent !text-[11px] !font-medium !tracking-wide !text-[#4d5344]">{product.trackInventory && product.availablePieces < 1 ? "Out of stock" : "Add to cart"}</Button>
          </article>)}</div>{pagination && pagination.pages > 1 && <div className="mt-8 flex justify-center"><Pagination aria-label="Wishlist pages" current={pagination.page} pageSize={pagination.limit} total={pagination.total} showSizeChanger={false} onChange={(value) => { dispatch(setPage(value)); window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }} /></div>}</> : <div className="border-y border-[#e7e5dc] py-14 text-center"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span className="text-[#77796e]">No saved products match these filters.</span>} /><Button type="primary" ghost onClick={clearFilters}>Clear filters</Button></div>}
        </section>
      </div>}

      <Drawer title={<span className="flex items-center gap-2 font-serif text-xl text-[#303429]"><SlidersHorizontal size={17} className="text-[#758064]" />Wishlist filters</span>} placement="left" size={360} open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} closeIcon={<X size={18} />} footer={<div className="flex items-center justify-between gap-3"><Button type="text" disabled={!activeCount} onClick={clearFilters} className="!text-[#737a66]">Clear all</Button><Button type="primary" className="flex-1 !h-10 !bg-[#758064]" onClick={() => setMobileFiltersOpen(false)}>Show {total} results</Button></div>} className="lg:!hidden" styles={{ header: { borderBottom: "1px solid #eae8e0", padding: "14px 18px" }, body: { padding: "12px 18px 0" }, footer: { borderTop: "1px solid #eae8e0", padding: "10px 18px max(10px, env(safe-area-inset-bottom))" } }}><div className="max-h-[calc(100dvh-155px)] overflow-y-auto px-1 pb-8">{filterControls}</div></Drawer>
    </main>
  </div>;
}

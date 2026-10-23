"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Drawer, Empty, Form, Input, InputNumber, Modal, Pagination, Popconfirm, Select, Skeleton, Switch, Upload } from "antd";
import type { UploadFile } from "antd";
import { Pencil, SlidersHorizontal, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api, formatPrice, type Category, type Product, type ProductPage } from "../../lib/api";
import { readSession } from "../../lib/session";
import { queryKeys } from "../../lib/queryKeys";
import { setBrand, setCategory, setDiscounted, setInStock, setMaxPrice, setMinPrice, setPage, setSearch, setSort, setStatus, setTag, type AppDispatch, type RootState } from "../../store/store";

type ProductForm = { name: string; description: string; shortDescription?: string; categoryId: string; brand?: string; sku?: string; price: number; discountPercent?: number; availablePieces: number; status: "draft" | "published" | "archived" };
const sortOptions = [
  { value: "newest", label: "Recently added" }, { value: "oldest", label: "Oldest" },
  { value: "price_asc", label: "Price: low to high" }, { value: "price_desc", label: "Price: high to low" },
  { value: "discount_desc", label: "Biggest discount" }, { value: "name_asc", label: "Name: A to Z" }, { value: "name_desc", label: "Name: Z to A" },
];
const statusOptions = [{ value: "", label: "All statuses" }, { value: "draft", label: "Draft" }, { value: "published", label: "Published" }, { value: "archived", label: "Archived" }];

export default function AdminPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const filters = useSelector((state: RootState) => state.catalog);
  const queryClient = useQueryClient();
  const [authorized, setAuthorized] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [categoryCreateOpen, setCategoryCreateOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState(filters.search);
  const [brandDraft, setBrandDraft] = useState(filters.brand);
  const [tagDraft, setTagDraft] = useState(filters.tag);
  const [categorySearch, setCategorySearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [debouncedBrand, setDebouncedBrand] = useState(filters.brand);
  const [debouncedTag, setDebouncedTag] = useState(filters.tag);
  const [debouncedCategorySearch, setDebouncedCategorySearch] = useState("");
  const [form] = Form.useForm<ProductForm>();
  const [categoryForm] = Form.useForm();

  useEffect(() => { const timer = window.setTimeout(() => setAuthorized(readSession()?.user.role === "admin"), 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => { const timer = window.setTimeout(() => { const value = searchDraft.trim(); setDebouncedSearch(value); dispatch(setSearch(value)); }, 500); return () => window.clearTimeout(timer); }, [searchDraft, dispatch]);
  useEffect(() => { const timer = window.setTimeout(() => { const value = brandDraft.trim(); setDebouncedBrand(value); dispatch(setBrand(value)); }, 500); return () => window.clearTimeout(timer); }, [brandDraft, dispatch]);
  useEffect(() => { const timer = window.setTimeout(() => { const value = tagDraft.trim(); setDebouncedTag(value); dispatch(setTag(value)); }, 500); return () => window.clearTimeout(timer); }, [tagDraft, dispatch]);
  useEffect(() => { const timer = window.setTimeout(() => setDebouncedCategorySearch(categorySearch.trim()), 500); return () => window.clearTimeout(timer); }, [categorySearch]);

  const priceRangeInvalid = Boolean(filters.minPrice && filters.maxPrice && Number(filters.minPrice) > Number(filters.maxPrice));
  const params = useMemo(() => {
    const query = new URLSearchParams({ page: String(filters.page), limit: "12", sort: filters.sort });
    if (debouncedSearch) query.set("q", debouncedSearch);
    if (filters.category) query.set("category", filters.category);
    if (debouncedBrand) query.set("brand", debouncedBrand);
    if (debouncedTag) query.set("tag", debouncedTag);
    if (!priceRangeInvalid && filters.minPrice) query.set("minPrice", String(Math.round(Number(filters.minPrice) * 100)));
    if (!priceRangeInvalid && filters.maxPrice) query.set("maxPrice", String(Math.round(Number(filters.maxPrice) * 100)));
    if (filters.inStock) query.set("inStock", "true");
    if (filters.discounted) query.set("discounted", "true");
    if (filters.status) query.set("status", filters.status);
    return query.toString();
  }, [filters.page, filters.sort, filters.category, filters.minPrice, filters.maxPrice, filters.inStock, filters.discounted, filters.status, debouncedSearch, debouncedBrand, debouncedTag, priceRangeInvalid]);

  const products = useQuery({ queryKey: [...queryKeys.products.adminList, params], queryFn: () => api<ProductPage>(`/api/products?${params}`), enabled: authorized });
  const categories = useQuery({ queryKey: [...queryKeys.categories.list, "admin", debouncedCategorySearch], queryFn: () => api<Category[]>(`/api/categories?limit=20${debouncedCategorySearch ? `&q=${encodeURIComponent(debouncedCategorySearch)}` : ""}`), enabled: authorized });
  const invalidateProducts = () => { void queryClient.invalidateQueries({ queryKey: queryKeys.products.all }); void queryClient.invalidateQueries({ queryKey: queryKeys.products.details }); };
  const uploadImages = async (productId: string) => {
    const uploads = files.flatMap((file) => file.originFileObj ? [file.originFileObj] : []);
    if (!uploads.length) return;
    const body = new FormData(); uploads.forEach((file) => body.append("images", file));
    await api(`/api/products/${productId}/images`, { method: "POST", body });
  };
  const create = useMutation({ mutationFn: async (values: ProductForm) => {
    const product = await api<Product>("/api/products", { method: "POST", body: JSON.stringify({ name: values.name, description: values.description, shortDescription: values.shortDescription || "", categoryId: values.categoryId, brand: values.brand || "", sku: values.sku || undefined, priceMinor: Math.round(values.price * 100), discountPercent: values.discountPercent || 0, currency: "PKR", availablePieces: values.availablePieces, status: values.status, trackInventory: true }) });
    await uploadImages(product._id); return product;
  }, onSuccess: () => { toast.success("Product created."); setCreateOpen(false); setFiles([]); form.resetFields(); }, onSettled: invalidateProducts, onError: (error: Error) => toast.error(error.message) });
  const update = useMutation({ mutationFn: async (values: ProductForm) => {
    if (!editing) return;
    await api(`/api/products/${editing._id}`, { method: "PATCH", body: JSON.stringify({ name: values.name, description: values.description, shortDescription: values.shortDescription || "", categoryId: values.categoryId, brand: values.brand || "", sku: values.sku || undefined, priceMinor: Math.round(values.price * 100), discountPercent: values.discountPercent || 0, availablePieces: values.availablePieces, status: values.status }) });
    await uploadImages(editing._id);
  }, onSuccess: () => { toast.success("Product updated."); setEditing(null); setFiles([]); }, onSettled: invalidateProducts, onError: (error: Error) => toast.error(error.message) });
  const remove = useMutation({ mutationFn: (id: string) => api(`/api/products/${id}`, { method: "DELETE" }), onSuccess: () => toast.success("Product deleted."), onSettled: invalidateProducts, onError: (error: Error) => toast.error(error.message) });
  const removeImage = useMutation({ mutationFn: (imageId: string) => api(`/api/products/${editing?._id}/images/${imageId}`, { method: "DELETE" }), onSuccess: (_result, imageId) => { setEditing((current) => current ? { ...current, images: current.images.filter((image) => image._id !== imageId) } : current); toast.success("Image removed."); }, onSettled: invalidateProducts, onError: (error: Error) => toast.error(error.message) });
  const addCategory = useMutation({ mutationFn: (values: { name: string; description?: string }) => api("/api/categories", { method: "POST", body: JSON.stringify(values) }), onSuccess: () => { toast.success("Category created."); categoryForm.resetFields(); setCategoryCreateOpen(false); }, onSettled: () => { void queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }); }, onError: (error: Error) => toast.error(error.message) });

  const clearFilters = () => {
    setSearchDraft(""); setBrandDraft(""); setTagDraft("");
    dispatch(setSearch("")); dispatch(setCategory("")); dispatch(setMinPrice("")); dispatch(setMaxPrice("")); dispatch(setBrand("")); dispatch(setTag("")); dispatch(setInStock(false)); dispatch(setDiscounted(false)); dispatch(setPage(1)); dispatch(setSort("newest"));
  };
  const activeCount = Number(Boolean(debouncedSearch)) + Number(Boolean(filters.category)) + Number(Boolean(filters.minPrice)) + Number(Boolean(filters.maxPrice)) + Number(Boolean(debouncedBrand)) + Number(Boolean(debouncedTag)) + Number(filters.inStock) + Number(filters.discounted) + Number(Boolean(filters.status));
  const openEdit = (product: Product) => { setFiles([]); setEditing(product); setCreateOpen(false); };
  useEffect(() => {
    if (editing) form.setFieldsValue({ name: editing.name, description: editing.description, shortDescription: editing.shortDescription, categoryId: editing.category?._id, brand: editing.brand, sku: editing.sku, price: editing.priceMinor / 100, discountPercent: editing.discountPercent, availablePieces: editing.availablePieces, status: editing.status as ProductForm["status"] });
    else if (createOpen) form.resetFields();
  }, [editing, createOpen, form]);
  useEffect(() => { if (categoryCreateOpen) categoryForm.resetFields(); }, [categoryCreateOpen, categoryForm]);
  const categoryOptions = [{ value: "", label: "All categories" }, ...(categories.data || []).map((category) => ({ value: category.slug, label: category.name }))];

  const filterControls = <div className="space-y-4">
    <div><label className="mb-1 block text-xs font-medium text-[#686d60]">Search</label><Input aria-label="Search products" allowClear placeholder="Name or description" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} /></div>
    <div><label className="mb-1 block text-xs font-medium text-[#686d60]">Category</label><Select aria-label="Filter by category" showSearch filterOption={false} searchValue={categorySearch} onSearch={setCategorySearch} className="w-full" value={filters.category || ""} onChange={(value) => { dispatch(setCategory(value)); setCategorySearch(""); }} options={categoryOptions} notFoundContent={categories.isFetching ? "Searching…" : "No categories found"} /></div>
    <div><label className="mb-1 block text-xs font-medium text-[#686d60]">Price range (PKR)</label><div className="grid grid-cols-2 gap-2"><InputNumber aria-label="Minimum price" min={0} placeholder="Min" className="!w-full" value={filters.minPrice ? Number(filters.minPrice) : null} onChange={(value) => dispatch(setMinPrice(value == null ? "" : String(value)))} /><InputNumber aria-label="Maximum price" min={0} placeholder="Max" className="!w-full" value={filters.maxPrice ? Number(filters.maxPrice) : null} onChange={(value) => dispatch(setMaxPrice(value == null ? "" : String(value)))} /></div>{priceRangeInvalid && <p className="mt-1 text-xs text-red-700">Maximum must be at least minimum.</p>}</div>
    <div><label className="mb-1 block text-xs font-medium text-[#686d60]">Brand</label><Input aria-label="Filter by brand" allowClear placeholder="Any brand" value={brandDraft} onChange={(event) => setBrandDraft(event.target.value)} /></div>
    <div><label className="mb-1 block text-xs font-medium text-[#686d60]">Tag</label><Input aria-label="Filter by tag" allowClear placeholder="Any tag" value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} /></div>
    <div><label className="mb-1 block text-xs font-medium text-[#686d60]">Status</label><Select aria-label="Filter by status" className="w-full" value={filters.status || ""} onChange={(value) => dispatch(setStatus(value))} options={statusOptions} /></div>
    <div className="space-y-2 border-t border-[#eceae3] pt-3"><label className="flex min-h-8 items-center justify-between text-sm text-[#54594e]">In stock <Switch checked={filters.inStock} onChange={(value) => dispatch(setInStock(value))} /></label><label className="flex min-h-8 items-center justify-between text-sm text-[#54594e]">Discounted <Switch checked={filters.discounted} onChange={(value) => dispatch(setDiscounted(value))} /></label></div>
    <Button type="text" disabled={!activeCount} onClick={clearFilters} className="!px-0 !text-[#697457]">Clear all filters</Button>
  </div>;

  const productForm = <Form form={form} layout="vertical" onFinish={(values) => editing ? update.mutate(values) : create.mutate(values)} initialValues={{ price: 0, discountPercent: 0, availablePieces: 1, status: "draft" }}>
    <div className="grid gap-x-4 md:grid-cols-2"><Form.Item name="name" label="Name" rules={[{ required: true, min: 2 }]}><Input /></Form.Item><Form.Item name="categoryId" label="Category" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={(categories.data || []).map((category) => ({ value: category._id, label: category.name }))} /></Form.Item></div>
    <Form.Item name="description" label="Description" rules={[{ required: true, min: 5 }]}><Input.TextArea rows={3} /></Form.Item><Form.Item name="shortDescription" label="Short description"><Input /></Form.Item>
    <div className="grid grid-cols-2 gap-x-4 md:grid-cols-4"><Form.Item name="price" label="Price (PKR)" rules={[{ required: true }]}><InputNumber min={0} precision={2} className="!w-full" /></Form.Item><Form.Item name="discountPercent" label="Discount %"><InputNumber min={0} max={90} className="!w-full" /></Form.Item><Form.Item name="availablePieces" label="Stock" rules={[{ required: true }]}><InputNumber min={0} className="!w-full" /></Form.Item><Form.Item name="status" label="Visibility"><Select options={statusOptions.slice(1)} /></Form.Item></div>
    <div className="grid gap-x-4 md:grid-cols-2"><Form.Item name="brand" label="Brand"><Input /></Form.Item><Form.Item name="sku" label="SKU"><Input /></Form.Item></div>
    {editing && <div className="mb-4"><p className="mb-2 text-sm font-medium text-[#555a4f]">Current product images</p><div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{editing.images.map((image) => <div key={image._id} className="group relative aspect-square overflow-hidden rounded-lg bg-[#efeee8]"><Image fill sizes="120px" src={image.secureUrl} alt={image.altText || editing.name} className="object-cover" /><Button danger size="small" className="!absolute bottom-1 left-1 right-1 !w-[calc(100%-8px)]" loading={removeImage.isPending} onClick={() => removeImage.mutate(image._id)}>Remove</Button></div>)}</div>{editing.images.length === 0 && <p className="text-xs text-[#858978]">No images uploaded yet.</p>}</div>}
    <Form.Item label={editing ? "Add images" : "Product images"}><Upload accept="image/jpeg,image/png,image/webp,image/avif" listType="picture" multiple maxCount={8} beforeUpload={() => false} fileList={files} onChange={({ fileList }) => setFiles(fileList)}><Button>Choose photos</Button></Upload></Form.Item>
    <div className="flex justify-end gap-2"><Button onClick={() => { setCreateOpen(false); setEditing(null); setFiles([]); }}>Cancel</Button><Button type="primary" htmlType="submit" loading={create.isPending || update.isPending}>{editing ? "Save changes" : "Create product"}</Button></div>
  </Form>;

  return <div className="min-h-screen bg-[#fbfaf7]"><main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8"><p className="text-[10px] font-bold tracking-[0.2em] text-[#858978]">STORE ADMINISTRATION</p><h1 className="mb-6 mt-2 font-serif text-3xl text-[#303429] sm:mb-8 sm:text-4xl">Manage your store</h1>
    {!authorized ? <Alert type="warning" showIcon title="Admin access required" description="Sign in with an email listed in the server ADMIN_EMAILS setting." /> : <div className="w-full"><section className="min-w-0 space-y-6">
      <div className="rounded-xl border border-[#e7e5dc] bg-white p-4 sm:p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-serif text-2xl text-[#303429]">Products</h2><p className="mt-1 text-xs text-[#858978]">{products.data?.pagination.total ?? 0} catalog products</p></div><div className="flex flex-wrap gap-2"><Select aria-label="Sort products" value={filters.sort} onChange={(value) => dispatch(setSort(value))} options={sortOptions} className="w-40" /><Button className="lg:!hidden" icon={<SlidersHorizontal size={15} />} onClick={() => setMobileFiltersOpen(true)}>Filters{activeCount ? ` · ${activeCount}` : ""}</Button><Button onClick={() => setCategoryCreateOpen(true)}>Add category</Button><Button type="primary" onClick={() => { setEditing(null); setFiles([]); setCreateOpen(true); }}>Add product</Button></div></div>
        <div className="grid items-start gap-6 lg:grid-cols-[210px_minmax(0,1fr)]"><aside aria-label="Product filters" className="sticky top-24 hidden max-h-[calc(100vh-7rem)] self-start overflow-y-auto rounded-lg border border-[#e8e6de] bg-[#fbfaf7] p-4 lg:block"><div className="mb-3 flex justify-between"><h3 className="font-serif text-lg text-[#303429]">Refine</h3><Button type="text" size="small" disabled={!activeCount} onClick={clearFilters}>Clear</Button></div>{filterControls}</aside>
          <div className="min-w-0">
            {priceRangeInvalid && <Alert className="mb-3" type="warning" showIcon title="Adjust the price range" />}
            {products.isError && !products.data && <Alert className="mb-3" type="error" showIcon title="Could not load products" description={(products.error as Error).message} action={<Button onClick={() => products.refetch()}>Retry</Button>} />}
            {products.isLoading ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <Skeleton key={index} active />)}</div> : products.data?.items.length ? <><div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 ${products.isFetching ? "opacity-70" : ""}`}>{products.data.items.map((product) => <article key={product._id} role="link" tabIndex={0} onClick={() => router.push(`/products/${product.slug}`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") router.push(`/products/${product.slug}`); }} className="group cursor-pointer overflow-hidden rounded-lg border border-[#e7e5dc] bg-white transition-colors hover:border-[#b9bfad] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#758064]"><div className="relative aspect-[4/3.8] bg-[#efeee8]">{product.images[0]?.secureUrl ? <Image fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" src={product.images[0].secureUrl} alt={product.images[0].altText || product.name} className="object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none" /> : <div className="grid size-full place-items-center font-serif text-3xl text-[#b3b5a9]">N.</div>}</div><div className="p-3"><p className="truncate text-[10px] uppercase tracking-wide text-[#858978]">{product.category?.name || "Uncategorized"}</p><h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-medium text-[#303429]">{product.name}</h3><p className="mt-1 text-sm font-semibold text-[#3d4235]">{formatPrice(product.salePriceMinor, product.currency)}</p><div className="mt-3 flex justify-end gap-1" onClick={(event) => event.stopPropagation()}><Button type="text" size="small" aria-label={`Edit ${product.name}`} title="Edit product" icon={<Pencil size={15} />} onClick={() => openEdit(product)} className="!h-9 !w-9 !min-w-9 !rounded-md !bg-[#f1f2ec] !p-0 !text-[#657052] transition-colors hover:!bg-[#e7eadf]" /><Popconfirm title="Delete product?" description={`Delete ${product.name}?`} okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true, loading: remove.isPending }} onConfirm={() => remove.mutateAsync(product._id)}><Button type="text" size="small" danger aria-label={`Delete ${product.name}`} title="Delete product" icon={<Trash2 size={15} />} onClick={(event) => event.stopPropagation()} className="!h-9 !w-9 !min-w-9 !rounded-md !bg-[#f6eeec] !p-0 !text-[#a35449] transition-colors hover:!bg-[#f0e1de]" /></Popconfirm></div></div></article>)}</div>{products.data.pagination.pages > 1 && <div className="mt-6 flex justify-center"><Pagination current={products.data.pagination.page} pageSize={products.data.pagination.limit} total={products.data.pagination.total} showSizeChanger={false} onChange={(page) => { dispatch(setPage(page)); window.scrollTo({ top: 0, behavior: "smooth" }); }} /></div>}</> : !products.isError && <div className="py-12 text-center"><Empty description="No products match these filters." /><Button onClick={clearFilters}>Clear filters</Button></div>}
          </div>
        </div>
      </div>
    </section></div>}
    <Modal title={editing ? `Edit ${editing.name}` : "Add a product"} open={createOpen || Boolean(editing)} onCancel={() => { setCreateOpen(false); setEditing(null); setFiles([]); }} footer={null} width={760} className="max-w-[calc(100vw-24px)]">{productForm}</Modal>
    <Modal title="Add a category" open={categoryCreateOpen} onCancel={() => setCategoryCreateOpen(false)} footer={null} width={480} className="max-w-[calc(100vw-24px)]">
      <Form form={categoryForm} layout="vertical" onFinish={(values) => addCategory.mutate(values)}>
        <Form.Item name="name" label="Category name" rules={[{ required: true, min: 2, max: 100, whitespace: true }]}><Input placeholder="e.g. Home décor" maxLength={100} showCount /></Form.Item>
        <Form.Item name="description" label="Description" rules={[{ max: 1000 }]}><Input.TextArea placeholder="A short description (optional)" rows={4} maxLength={1000} showCount /></Form.Item>
        <div className="flex justify-end gap-2"><Button onClick={() => setCategoryCreateOpen(false)}>Cancel</Button><Button type="primary" htmlType="submit" loading={addCategory.isPending}>Create category</Button></div>
      </Form>
    </Modal>
    <Drawer title="Filter products" placement="left" size={340} open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} closeIcon={<X size={18} />} footer={<div className="flex items-center justify-between gap-3"><Button type="text" disabled={!activeCount} onClick={clearFilters}>Clear all</Button><Button type="primary" className="flex-1" onClick={() => setMobileFiltersOpen(false)}>Show {products.data?.pagination.total ?? 0} products</Button></div>} styles={{ header: { borderBottom: "1px solid #eae8e0", padding: "14px 18px" }, body: { padding: "14px 18px 0" }, footer: { borderTop: "1px solid #eae8e0", padding: "10px 18px max(10px, env(safe-area-inset-bottom))" } }}><div className="max-h-[calc(100dvh-150px)] overflow-y-auto pb-8">{filterControls}</div></Drawer>
  </main></div>;
}

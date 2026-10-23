"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { Alert, Button, InputNumber, Skeleton, Tag } from "antd";
import { toast } from "sonner";
import { api, formatPrice, type Product } from "../../../lib/api";
import { queryKeys } from "../../../lib/queryKeys";
import { readSession } from "../../../lib/session";
import { setCategory, type AppDispatch } from "../../../store/store";
import GoogleSignInButton from "../../../components/GoogleSignInButton";
import WishlistButton from "../../../components/WishlistButton";

export default function ProductDetailPage() {
  const params = useParams<{ identifier: string }>();
  const id = decodeURIComponent(params.identifier);
  const dispatch = useDispatch<AppDispatch>();
  const [quantity, setQuantity] = useState(1);
  const [selection, setSelection] = useState<{ productId: string; imageId: string } | null>(null);
  const [failedImageState, setFailedImageState] = useState<{ productId: string; ids: string[] } | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { const task = window.setTimeout(() => setSignedIn(Boolean(readSession())), 0); return () => window.clearTimeout(task); }, []);
  const client = useQueryClient();
  const productQuery = useQuery({ queryKey: queryKeys.products.detail(id), queryFn: () => api<Product>(`/api/products/${encodeURIComponent(id)}`) });
  const addMutation = useMutation({ mutationFn: () => {
    if (!product?._id) throw new Error("This product is not available right now.");
    return api("/api/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product._id, quantity }),
    });
  }, onSuccess: async () => { await client.invalidateQueries({ queryKey: ["cart"] }); toast.success("Added to your cart."); }, onError: (error: Error) => toast.error(error.message) });
  const product = productQuery.data;
  const selectedImageId = selection && selection.productId === product?._id ? selection.imageId : null;
  const failedImageIds = failedImageState && failedImageState.productId === product?._id ? failedImageState.ids : [];
  const validImages = (product?.images || []).filter((image) => image.secureUrl && !failedImageIds.includes(image._id));
  const selectedImage = validImages.find((image) => image._id === selectedImageId) || validImages[0];
  return <div className="min-h-screen bg-[#fbfaf7] [&_a]:cursor-pointer [&_button:not(:disabled)]:cursor-pointer [&_img]:cursor-pointer"><main className="mx-auto max-w-6xl px-5 pb-8">
    {productQuery.isLoading ? <div className="mt-8 grid gap-10 md:grid-cols-2"><Skeleton.Image active className="!h-[520px] !w-full" /><Skeleton active /></div> : productQuery.error ? <Alert className="mt-8" type="error" showIcon title={(productQuery.error as Error).message} /> : product && <>
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-[#858978]">
          <li><Link href="/shop" className="transition-colors hover:text-[#303429]">Shop</Link></li>
          {product.category?.name && <><li aria-hidden="true" className="text-[#b5b6ac]">/</li><li><Link href="/shop" onClick={() => dispatch(setCategory(product.category.slug))} className="transition-colors hover:text-[#303429]">{product.category.name}</Link></li></>}
          <li aria-hidden="true" className="text-[#b5b6ac]">/</li>
          <li aria-current="page" className="max-w-[60vw] truncate font-medium text-[#454a3e]">{product.name}</li>
        </ol>
      </nav>
      <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-14">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row">
        {validImages.length > 1 && <div className="order-2 flex max-w-full gap-2 overflow-x-auto md:order-1 md:max-h-[560px] md:flex-col md:overflow-x-hidden md:overflow-y-auto">
          {validImages.map((image) => <button key={image._id} type="button" aria-label={`View ${image.altText || product.name}`} aria-pressed={selectedImage?._id === image._id} onClick={() => setSelection({ productId: product._id, imageId: image._id })} className={`relative size-16 shrink-0 overflow-hidden rounded-lg border-2 bg-[#efeee8] transition-colors md:size-[76px] ${selectedImage?._id === image._id ? "border-[#697457]" : "border-transparent hover:border-[#c6c9bb]"}`}>
            <Image fill sizes="76px" className="object-contain p-1" src={image.secureUrl} alt={image.altText || product.name} onError={() => setFailedImageState((current) => { const ids = current?.productId === product._id ? current.ids : []; return ids.includes(image._id) ? current : { productId: product._id, ids: [...ids, image._id] }; })} />
          </button>)}
        </div>}
        <div className="relative order-1 aspect-square w-full overflow-hidden rounded-xl md:order-2 md:min-w-0 md:flex-1">
          {selectedImage ? <Image key={selectedImage._id} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-contain" src={selectedImage.secureUrl} alt={selectedImage.altText || product.name} onError={() => setFailedImageState((current) => { const ids = current?.productId === product._id ? current.ids : []; return ids.includes(selectedImage._id) ? current : { productId: product._id, ids: [...ids, selectedImage._id] }; })} /> : <div className="grid size-full place-items-center font-serif text-6xl text-[#b3b5a9]">N.</div>}
        </div>
      </div>
      <div className="pt-2 md:pt-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.18em] text-[#858978]">{product.category?.name || "Collection"}</p><h1 className="mt-3 font-serif text-4xl text-[#303429]">{product.name}</h1></div><WishlistButton productId={product._id} productName={product.name} showLabel /></div>{product.brand && <p className="mt-2 text-sm text-[#85877d]">{product.brand}</p>}<div className="mt-5 flex items-center gap-3">{product.discountPercent > 0 && <Tag color="red">Save {product.discountPercent}%</Tag>}<p className="text-xl font-semibold text-[#4e5941]">{formatPrice(product.salePriceMinor, product.currency)}</p>{product.discountPercent > 0 && <p className="text-sm text-[#99998f] line-through">{formatPrice(product.priceMinor, product.currency)}</p>}</div>
        <p className="mt-6 whitespace-pre-line text-sm leading-7 text-[#6e7165]">{product.description}</p>{Boolean(product.attributes?.length) && <dl className="mt-6 divide-y divide-[#e9e7df] border-y border-[#e9e7df]">{product.attributes?.map((entry) => <div className="flex justify-between py-3 text-sm" key={entry.name}><dt className="text-[#87897e]">{entry.name}</dt><dd className="text-[#3e4438]">{entry.value}</dd></div>)}</dl>}
        {product.trackInventory && <p className="mt-5 text-xs text-[#85877d]">{product.availablePieces > 0 ? `${product.availablePieces} available` : "Currently out of stock"}</p>}
        <div className="mt-6 flex gap-3"><InputNumber min={1} max={product.trackInventory ? Math.max(1, product.availablePieces) : 99} value={quantity} onChange={(value) => setQuantity(value || 1)} size="large" disabled={product.trackInventory && product.availablePieces === 0} /><Button type="primary" size="large" className="flex-1" disabled={product.trackInventory && product.availablePieces === 0} loading={addMutation.isPending} onClick={() => {
          if (!readSession()) {
            setSignedIn(false);
            toast.info("Sign in first to add items to your cart.");
            return;
          }
          setSignedIn(true);
          addMutation.mutate();
        }}>Add to cart</Button></div>
        {!signedIn && <GoogleSignInButton type="link" className="mt-2 !px-0">Sign in with Google to shop</GoogleSignInButton>}
      </div>
    </div></>}
  </main></div>;
}

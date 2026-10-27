"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import WishlistButton from "../features/wishlist/components/WishlistButton";
import { api, formatPrice, type Category, type ProductPage } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";

const latestParams = new URLSearchParams({
  page: "1",
  limit: "4",
  sort: "newest",
}).toString();
const categoryPhotos: Record<string, string> = {
  "home-decor": "photo-1616486338812-3dadae4b4ace",
  clothing: "photo-1490481651871-ab68de25d43d",
  "bags-accessories": "photo-1548036328-c9fa89d128fa",
  "kitchen-dining": "photo-1490645935967-10de6ba17061",
  "self-care": "photo-1608248543803-ba4f8c70ae0b",
};
const photo = (id: string, width = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

export default function Home() {
  const products = useQuery({
    queryKey: queryKeys.products.list(latestParams),
    queryFn: () => api<ProductPage>(`/api/products?${latestParams}`),
  });
  const categories = useQuery({
    queryKey: queryKeys.categories.list,
    queryFn: () => api<Category[]>("/api/categories"),
  });
  const groups = categories.data || [];

  return (
    <main className="overflow-clip bg-[#fbfaf7] text-[#252820] [&_a:focus-visible]:outline [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-[#78846b]">
      <section className="relative isolate mx-auto grid min-h-[650px] max-w-[1600px] overflow-hidden bg-[#fbfaf7] md:min-h-[680px] md:grid-cols-[0.88fr_1.12fr]">
        <div className="relative z-10 flex flex-col justify-center px-6 py-16 sm:px-12 md:px-16 lg:px-24">
          <p className="text-[10px] font-semibold tracking-[0.19em] text-[#78806d] uppercase">
            NaqshCorner · Thoughtfully chosen
          </p>
          <h1 className="mt-6 max-w-xl font-serif text-[clamp(3rem,6vw,5.8rem)] leading-[0.98] tracking-[-0.045em]">
            A softer rhythm for everyday living.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-[#66695f] sm:text-lg">
            Considered pieces for your wardrobe, home, and the small rituals in
            between.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Link
              href="/shop"
              className="inline-flex min-h-12 items-center gap-5 rounded-full bg-[#30352c] px-5 text-[13px] font-semibold text-[#fbfaf7] transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#59624f] motion-reduce:transition-none"
            >
              Shop now <ArrowRight size={16} />
            </Link>
            <Link
              href="#categories"
              className="text-sm font-medium text-[#4c5145] underline decoration-[#aab09c] underline-offset-4 transition-colors hover:text-[#78846b]"
            >
              Explore the edit
            </Link>
          </div>
          <p className="mt-16 hidden text-[10px] uppercase tracking-[0.22em] text-[#878a7f] md:block">
            Useful things, chosen with care
          </p>
        </div>
        <div className="relative min-h-[390px] md:min-h-full">
          <Image
            src={photo("photo-1616486338812-3dadae4b4ace", 1500)}
            alt="Sunlit, thoughtfully styled living space"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 58vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent md:bg-gradient-to-r md:from-[#fbfaf7]/20 md:via-transparent md:to-transparent" />
          <span className="absolute bottom-5 right-6 text-[10px] uppercase tracking-[0.18em] text-white/85">
            Objects for slower moments
          </span>
        </div>
      </section>

      <section
        id="categories"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.19em] text-[#78806d] uppercase">
              Find your kind of everyday
            </p>
            <h2 className="mt-2.5 font-serif text-[clamp(2rem,3vw,3rem)] leading-[1.06] tracking-[-0.035em]">
              Shop by category
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden items-center gap-2 pb-1 text-sm text-[#62675a] transition-colors hover:text-[#252820] sm:flex"
          >
            View everything <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 sm:gap-6 lg:grid-cols-5">
          {groups.slice(0, 5).map((category, index) => (
            <Link
              key={category._id}
              href={`/shop?category=${encodeURIComponent(category.slug)}`}
              className="group"
            >
              <div className="relative aspect-[0.82] overflow-hidden bg-[#ecebe5]">
                <Image
                  src={photo(
                    categoryPhotos[category.slug] ||
                      [
                        "photo-1616486338812-3dadae4b4ace",
                        "photo-1490481651871-ab68de25d43d",
                        "photo-1548036328-c9fa89d128fa",
                        "photo-1490645935967-10de6ba17061",
                        "photo-1608248543803-ba4f8c70ae0b",
                      ][index % 5],
                    720,
                  )}
                  alt={category.name}
                  fill
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none"
                />
                <span className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-[#fbfaf7]/95 text-[#31352d] transition-transform group-hover:-translate-y-1">
                  <ArrowUpRight size={16} />
                </span>
              </div>
              <p className="mt-3 text-sm font-medium tracking-[0.01em]">
                {category.name}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section id="featured" className="bg-[#f1f0e9]">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.19em] text-[#78806d] uppercase">
                Freshly found
              </p>
              <h2 className="mt-2.5 font-serif text-[clamp(2rem,3vw,3rem)] leading-[1.06] tracking-[-0.035em]">
                A few new favorites
              </h2>
            </div>
            <Link
              href="/shop?sort=newest"
              className="flex items-center gap-2 pb-1 text-sm text-[#62675a] transition-colors hover:text-[#252820]"
            >
              Shop all <ArrowUpRight size={15} />
            </Link>
          </div>
          {products.isLoading ? (
            <div
              className="mt-9 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6"
              aria-label="Loading new arrivals"
            >
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="aspect-[0.8] animate-pulse bg-[#e7e6df]"
                />
              ))}
            </div>
          ) : products.data?.items.length ? (
            <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-6">
              {products.data.items.slice(0, 4).map((product) => (
                <article key={product._id} className="group min-w-0">
                  <div className="relative aspect-[0.8] overflow-hidden bg-[#e7e6df]">
                    <Link
                      href={`/products/${product.slug}`}
                      aria-label={`View ${product.name}`}
                      className="absolute inset-0 z-0"
                    >
                      {product.images[0]?.secureUrl ? (
                        <Image
                          src={product.images[0].secureUrl}
                          alt={product.images[0].altText || product.name}
                          fill
                          sizes="(max-width: 768px) 48vw, 24vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.035] motion-reduce:transition-none"
                        />
                      ) : (
                        <span className="grid h-full place-items-center font-serif text-4xl text-[#abb09f]">
                          N.
                        </span>
                      )}
                    </Link>
                    <div className="absolute right-2 top-2 z-10">
                      <WishlistButton
                        productId={product._id}
                        productName={product.name}
                      />
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-2 pt-3">
                    <div className="min-w-0">
                      <Link
                        href={`/products/${product.slug}`}
                        className="line-clamp-1 text-sm font-medium hover:underline"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-1 text-xs text-[#777a70]">
                        {product.category?.name}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm text-[#4e5348]">
                      {formatPrice(
                        product.salePriceMinor || product.priceMinor,
                        product.currency,
                      )}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-9 text-sm text-[#73766d]">
              Our next selection is on its way.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="relative overflow-hidden bg-[#dfe2d7] px-7 py-12 sm:px-14 sm:py-16 lg:px-20">
          <div className="relative z-10 max-w-xl">
            <p className="text-[10px] font-semibold tracking-[0.19em] text-[#78806d] uppercase">
              The everyday edit
            </p>
            <h2 className="mt-4 font-serif text-4xl leading-tight tracking-[-0.035em] sm:text-5xl">
              Small details. A more considered home.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#66695f]">
              Discover useful accents and familiar comforts, selected to bring a
              little more intention to daily life.
            </p>
            <Link
              href="/shop?category=home-decor"
              className="mt-7 inline-flex items-center gap-2 text-sm font-semibold"
            >
              Explore home decor <ArrowRight size={16} />
            </Link>
          </div>
          <div className="absolute -right-4 top-0 hidden h-full w-[43%] sm:block">
            <Image
              src={photo("photo-1494438639946-1ebd1d20bf85", 900)}
              alt="Natural textures and considered home details"
              fill
              sizes="40vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="border-y border-[#e8e7df] bg-[#f7f6f1]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-7 px-5 py-10 sm:grid-cols-4 sm:px-8">
          {[
            [
              "01",
              "A considered edit",
              "Useful finds across home and everyday style.",
            ],
            [
              "02",
              "Clear product details",
              "Straightforward descriptions and pricing.",
            ],
            [
              "03",
              "Secure checkout",
              "Payments handled through our checkout flow.",
            ],
            [
              "04",
              "Here to help",
              "Reach our team through the store contact details.",
            ],
          ].map(([n, title, description]) => (
            <div key={n} className="max-w-xs">
              <span className="text-[10px] tracking-[0.16em] text-[#8c9182]">
                {n}
              </span>
              <h3 className="mt-2 text-sm font-semibold">{title}</h3>
              <p className="mt-1.5 text-xs leading-5 text-[#777a70]">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid items-center gap-9 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
          <div className="relative aspect-[1.15] overflow-hidden bg-[#e8e7df]">
            <Image
              src={photo("photo-1600210492486-724fe5c67fb0", 1100)}
              alt="A calm, lived-in interior with natural materials"
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
          <div className="max-w-xl">
            <p className="text-[10px] font-semibold tracking-[0.19em] text-[#78806d] uppercase">
              A little about us
            </p>
            <h2 className="mt-4 font-serif text-[clamp(2rem,3vw,3rem)] leading-[1.06] tracking-[-0.035em]">
              Thoughtfully chosen, for the way you live.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#686b62]">
              NaqshCorner brings together considered pieces for everyday
              living—from home and personal style to small daily rituals. A
              simple place to find things that feel useful, familiar, and right
              for you.
            </p>
            <Link
              href="/shop"
              className="mt-7 inline-flex items-center gap-2 text-sm font-semibold"
            >
              Get to know the collection <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

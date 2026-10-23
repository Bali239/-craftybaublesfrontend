"use client";

/**
 * A classic cover-flow carousel: the centre cover faces you while the side covers angle inward with depth and a floor reflection. Drag to scrub with snap, click a side cover to bring it front, or let it auto-advance.
 */

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "../../lib/api";

const C = {
  persp: 1100, // CSS perspective distance (px)
  cw: 300, // cover width (px)
  ch: 300, // cover height (px)
  gap: 138, // → right per step
  push: 120, // extra shove away from the centre cover
  rot: 55, // side-cover angle about Y (deg)
  depth: 150, // how far the centre cover pops forward (px)
  fall: 60, // how far each further step recedes (px)
};

const wrappedOffset = (position: number, count: number) => {
  const wrapped = ((position % count) + count) % count;
  return wrapped > count / 2 ? wrapped - count : wrapped;
};

const CoverFlowCarousel = ({ products }: { products: Product[] }) => {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pos = useRef(0);
  const target = useRef(0);
  const moved = useRef(0);

  useEffect(() => {
    const N = products.length;
    if (N === 0) return;

    let dragging = false;
    let lastX = 0;
    let idle = 0;

    const wrap = (p: number) => {
      p = ((p % N) + N) % N;
      return p > N / 2 ? p - N : p;
    };

    const layout = () => {
      for (let i = 0; i < N; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const p = wrap(i - pos.current);
        const side = Math.max(-1, Math.min(1, p));
        const x = p * C.gap + side * C.push;
        const z =
          (1 - Math.min(1, Math.abs(p))) * C.depth - Math.abs(p) * C.fall;
        el.style.transform = `translate3d(${x}px, 0px, ${z}px) rotateY(${-side * C.rot}deg)`;
        el.style.zIndex = String(200 - Math.round(Math.abs(p) * 10));
        el.style.opacity = String(Math.abs(p) > 3.6 ? 0 : 1);
      }
    };

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!dragging && ++idle > 210) {
        // ~3.5s of stillness → advance one cover
        target.current = Math.round(target.current) + 1;
        idle = 0;
      }
      pos.current += (target.current - pos.current) * 0.09;
      layout();
    };
    tick();

    const onDown = (e: PointerEvent) => {
      dragging = true;
      moved.current = 0;
      lastX = e.clientX;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved.current += Math.abs(dx);
      target.current -= dx * 0.006;
      idle = 0;
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      target.current = Math.round(target.current); // snap to a cover
      idle = 0;
    };

    const scene = cardRefs.current[0]?.closest("[data-coverflow]");
    scene?.addEventListener("pointerdown", onDown as EventListener);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      cancelAnimationFrame(raf);
      scene?.removeEventListener("pointerdown", onDown as EventListener);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [products.length]);

  if (products.length === 0) {
    return <div className="grid h-[calc(100svh-4rem)] min-h-[560px] w-full place-items-center text-sm text-[#737373]">No products to feature yet.</div>;
  }

  return (
    <div
      data-coverflow
      className="relative flex h-[calc(100svh-4rem)] min-h-[560px] w-full cursor-grab select-none items-center justify-center overflow-hidden active:cursor-grabbing"
      style={{ perspective: `${C.persp}px` }}
    >
      <div
        className="relative"
        style={{ transformStyle: "preserve-3d" }}
      >
        {products.map((product, i) => {
          return (
            <div
              key={product._id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="absolute"
              style={{
                width: C.cw,
                height: C.ch * 1.55,
                marginLeft: -C.cw / 2,
                marginTop: -C.ch / 2,
                willChange: "transform, opacity",
              }}
            >
              <Link
                href={`/products/${product.slug}`}
                aria-label={`View ${product.name}`}
                onClick={(event) => {
                  const offset = wrappedOffset(i - pos.current, products.length);
                  const isCentered = Math.abs(offset) < 0.2;

                  if (moved.current > 6 || !isCentered) {
                    event.preventDefault();
                    if (moved.current <= 6) {
                      target.current = Math.round(pos.current + offset);
                    }
                  }
                  moved.current = 0;
                }}
                className="block"
              >
                <div className="relative overflow-hidden rounded-md bg-[#efeee8] ring-1 ring-black/10" style={{ width: C.cw, height: C.ch }}>
                  {product.images[0]?.secureUrl ? (
                    <Image fill priority={i < 3} quality={90} sizes="300px" src={product.images[0].secureUrl} alt="" draggable={false} className="pointer-events-none object-cover" />
                  ) : (
                    <div className="grid size-full place-items-center font-serif text-5xl text-[#b3b5a9]">N.</div>
                  )}
                </div>
                <div
                  aria-hidden="true"
                  className="pointer-events-none relative mt-1 overflow-hidden rounded-md opacity-35"
                  style={{
                    width: C.cw,
                    height: C.ch,
                    transform: "scaleY(-1)",
                    maskImage: "linear-gradient(to top, rgba(0,0,0,0.5), transparent 55%)",
                    WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.5), transparent 55%)",
                  }}
                >
                  {product.images[0]?.secureUrl && <Image fill quality={90} sizes="300px" src={product.images[0].secureUrl} alt="" draggable={false} className="object-cover" />}
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CoverFlowCarousel;

"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ArrowRightIcon } from "@/components/icons";

const VirtualTryOn = dynamic(() => import("@/components/virtual-try-on/VirtualTryOn").then((m) => m.VirtualTryOn), {
  ssr: false,
  loading: () => <p className="text-center text-sm text-brand-ink/60">Cargando probador…</p>,
});

export default function ProbadorVirtualPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-brand-bg px-4 pb-10 pt-24">
        <div className="mx-auto max-w-md">
          <Link
            href="/"
            className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-ink/10 bg-white px-4 py-2 text-sm font-bold text-brand-ink/80 transition-colors hover:border-brand-orange/30 hover:text-brand-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple"
          >
            <ArrowRightIcon className="h-4 w-4 rotate-180" />
            Volver al inicio
          </Link>
          <header className="mb-6 text-center">
            <h1 className="font-display text-2xl font-bold text-brand-ink">Probador virtual</h1>
            <p className="mt-1 text-sm text-brand-ink/60">
              Prueba los lentes en tiempo real con tu cámara. Página de prueba.
            </p>
          </header>
          <Suspense fallback={<p className="text-center text-sm text-brand-ink/60">Cargando probador…</p>}>
            <VirtualTryOn />
          </Suspense>
          <p className="mt-6 text-center text-xs text-brand-ink/50">
            Tu cámara se procesa localmente. No se guarda ni se sube ninguna imagen.
          </p>
        </div>
      </main>
    </>
  );
}

"use client";

import dynamic from "next/dynamic";

const VirtualTryOn = dynamic(() => import("@/components/virtual-try-on/VirtualTryOn").then((m) => m.VirtualTryOn), {
  ssr: false,
  loading: () => <p className="text-center text-sm text-brand-ink/60">Cargando probador…</p>,
});

export default function ProbadorVirtualPage() {
  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10">
      <div className="mx-auto max-w-md">
        <header className="mb-6 text-center">
          <h1 className="font-display text-2xl font-bold text-brand-ink">Probador virtual</h1>
          <p className="mt-1 text-sm text-brand-ink/60">
            Prueba los lentes en tiempo real con tu cámara. Página de prueba.
          </p>
        </header>
        <VirtualTryOn />
        <p className="mt-6 text-center text-xs text-brand-ink/50">
          Tu cámara se procesa localmente. No se guarda ni se sube ninguna imagen.
        </p>
      </div>
    </main>
  );
}

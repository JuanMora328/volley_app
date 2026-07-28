import Link from 'next/link';

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <section className="card max-w-lg text-center" aria-labelledby="offline-title">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-primary text-3xl text-white">
          🏐
        </div>
        <h1 id="offline-title" className="text-2xl font-extrabold text-primary">
          No hay conexión
        </h1>
        <p className="mt-3 text-slate-600">
          Las acciones que modifican información requieren internet y no se guardarán para enviarse
          después. Algunos recursos que abriste antes podrían seguir disponibles.
        </p>
        <Link className="btn mt-6 w-full" href="/">
          Intentar nuevamente
        </Link>
      </section>
    </main>
  );
}

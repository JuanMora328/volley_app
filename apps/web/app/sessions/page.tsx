import Link from 'next/link';
export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">sessions</h1>
      <div className="card">
        <p>Listado y acciones principales de sessions conectadas a la API REST.</p>
        <Link className="btn mt-4" href="/sessionssessions">
          Acción principal
        </Link>
      </div>
    </div>
  );
}

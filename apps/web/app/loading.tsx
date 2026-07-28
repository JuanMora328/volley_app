import { FullScreenLoader } from '../components/ui/full-screen-loader';

export default function Loading() {
  return (
    <FullScreenLoader
      title="Preparando VolleyJRN"
      description="Cargando la información de la pantalla…"
    />
  );
}

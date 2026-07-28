import { FullScreenLoader } from '../components/ui/full-screen-loader';

export default function Loading() {
  return (
    <FullScreenLoader
      title="Preparando VolleyFlow"
      description="Cargando la información de la pantalla…"
    />
  );
}

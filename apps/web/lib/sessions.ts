import { z } from 'zod';
export const sessionSchema = z
  .object({
    date: z.string().min(1, 'La fecha es obligatoria'),
    startTime: z.string().optional(),
    venueId: z
      .string()
      .trim()
      .transform((value) => value || undefined)
      .optional(),
    venueName: z.string().optional(),
    courtPrice: z.coerce.number().int().min(0),
    gatoradePrice: z.coerce.number().int().min(0),
    teamCount: z.coerce.number().int().min(2),
    defaultTargetScore: z.coerce.number().int().positive(),
  })
  .refine((value) => value.venueId || value.venueName?.trim(), {
    message: 'Selecciona o escribe una cancha',
    path: ['venueName'],
  });
export type SessionForm = z.infer<typeof sessionSchema>;

export function localDateInputValue(date = new Date()): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}
export type SessionPlayer = {
  id: string;
  player: { id: string };
  playerNameSnapshot: string;
  levelSnapshot: number;
  includedInCourtSplit: boolean;
  includedInGatoradeSplit: boolean;
};
export type SessionTeam = {
  id: string;
  name: string;
  color?: string | null;
  confirmedAt?: string | null;
  players: SessionPlayer[];
};
export type SessionDetail = {
  id: string;
  date: string;
  startTime?: string | null;
  venueNameSnapshot: string;
  courtPrice: number;
  gatoradePrice: number;
  teamCount: number;
  defaultTargetScore: number;
  status: string;
  participants: SessionPlayer[];
  teams: SessionTeam[];
  metrics: null | {
    maxAverageDiff: number;
    averageVariance: number;
    sizeDiff: number;
    score: number;
    label: string;
  };
  allowedActions: {
    edit: boolean;
    managePlayers: boolean;
    manageTeams: boolean;
    confirmTeams: boolean;
  };
};
export const money = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const sessionStatusLabels: Record<string, string> = {
  DRAFT: 'Borrador',
  TEAMS_CREATED: 'Equipos confirmados',
  IN_PROGRESS: 'En progreso',
  SETTLEMENT: 'En pagos',
  FINISHED: 'Finalizada',
  CANCELLED: 'Cancelada',
};

export const sessionStatusLabel = (status: string) => sessionStatusLabels[status] ?? status;

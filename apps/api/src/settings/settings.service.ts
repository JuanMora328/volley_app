import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@volleyflow/shared';
import { DataSource } from 'typeorm';
import { AuthenticatedUser } from '../auth/current-user.decorator';
import { APP_SETTINGS_ID, AppSettingsEntity } from '../database/entities/app-settings.entity';
import { UserEntity, VenueEntity } from '../database/entities';
import { UpdateSettingsDto } from './settings.dto';

export const FIXED_RULES = {
  game: [
    'El ganador permanece',
    'El perdedor rota al final de la cola',
    'Cada victoria suma un punto',
    'El puntaje objetivo se guarda por partido',
    'Solo puede deshacerse el último resultado',
  ],
  payments: [
    'El campeón no paga Gatorades',
    'La cancha se divide entre participantes incluidos',
    'Los valores se manejan en pesos enteros',
    'Los residuos se distribuyen de manera exacta',
    'Los pagos pueden ser parciales',
    'Una jornada puede cerrarse con deudas confirmadas',
  ],
};

@Injectable()
export class SettingsService {
  constructor(private readonly dataSource: DataSource) {}
  async get() {
    const repo = this.dataSource.getRepository(AppSettingsEntity);
    let settings = await repo.findOne({
      where: { id: APP_SETTINGS_ID },
      relations: { defaultVenue: true, updatedBy: true },
    });
    if (!settings)
      settings = await repo.save(
        repo.create({
          id: APP_SETTINGS_ID,
          organizationName: 'VolleyFlow',
          defaultTeamCount: 2,
          defaultTargetScore: 10,
          defaultCourtPrice: 0,
          defaultGatoradePrice: 0,
          timezone: 'America/Bogota',
        }),
      );
    return { ...settings, fixedRules: FIXED_RULES };
  }
  async update(dto: UpdateSettingsDto, user: AuthenticatedUser) {
    if (user.role !== UserRole.ADMIN)
      throw new ForbiddenException('Solo un administrador puede modificar los ajustes');
    if (dto.organizationName !== undefined && !dto.organizationName.trim())
      throw new BadRequestException('El nombre de la organización es obligatorio');
    try {
      Intl.DateTimeFormat('es-CO', { timeZone: dto.timezone });
    } catch {
      throw new BadRequestException('Zona horaria inválida');
    }
    await this.dataSource.transaction(async (manager) => {
      const settings = await manager.findOneByOrFail(AppSettingsEntity, { id: APP_SETTINGS_ID });
      if (dto.defaultVenueId !== undefined) {
        settings.defaultVenue = dto.defaultVenueId
          ? await manager.findOneBy(VenueEntity, { id: dto.defaultVenueId, active: true })
          : null;
        if (dto.defaultVenueId && !settings.defaultVenue)
          throw new BadRequestException('La cancha predeterminada debe existir y estar activa');
      }
      Object.assign(
        settings,
        dto,
        dto.organizationName ? { organizationName: dto.organizationName.trim() } : {},
      );
      settings.updatedBy = await manager.findOneByOrFail(UserEntity, { id: user.id });
      await manager.save(settings);
    });
    return this.get();
  }
  async defaults() {
    const value = await this.get();
    return {
      teamCount: value.defaultTeamCount,
      defaultTargetScore: value.defaultTargetScore,
      courtPrice: value.defaultCourtPrice,
      gatoradePrice: value.defaultGatoradePrice,
      venueId: value.defaultVenue?.active ? value.defaultVenue.id : null,
    };
  }
}

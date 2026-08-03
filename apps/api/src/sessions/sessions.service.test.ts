import { GameSessionStatus } from '@volleyflow/shared';
import { describe, expect, it, vi } from 'vitest';
import {
  GameSessionEntity,
  PlayerEntity,
  SessionPlayerEntity,
  TeamEntity,
} from '../database/entities';
import { SessionsService } from './sessions.service';

describe('SessionsService.replacePlayers', () => {
  it('replaces the draft selection while retaining existing participant records', async () => {
    const session = { id: 'session-id', status: GameSessionStatus.DRAFT } as GameSessionEntity;
    const first = { id: 'first-id', name: 'Ana', defaultLevel: 2, active: true } as PlayerEntity;
    const second = { id: 'second-id', name: 'Beto', defaultLevel: 3, active: true } as PlayerEntity;
    const third = { id: 'third-id', name: 'Cata', defaultLevel: 4, active: true } as PlayerEntity;
    const retained = {
      id: 'participant-first',
      session,
      player: first,
      levelSnapshot: 2,
    } as SessionPlayerEntity;
    const removed = {
      id: 'participant-second',
      session,
      player: second,
      levelSnapshot: 3,
    } as SessionPlayerEntity;
    const created = { id: 'participant-third' } as SessionPlayerEntity;

    const manager = {
      findOne: vi.fn().mockResolvedValue(session),
      find: vi.fn(async (entity: unknown) => {
        if (entity === PlayerEntity) return [first, third];
        if (entity === SessionPlayerEntity) return [retained, removed];
        if (entity === TeamEntity) return [];
        return [];
      }),
      remove: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockReturnValue(created),
      save: vi.fn(async (records: unknown) => records),
    };
    const dataSource = {
      transaction: vi.fn((callback: (entityManager: typeof manager) => unknown) =>
        callback(manager),
      ),
    };
    const service = new SessionsService({} as never, dataSource as never);

    const result = await service.replacePlayers(session.id, {
      players: [
        { playerId: first.id, levelSnapshot: 5 },
        { playerId: third.id, levelSnapshot: 1 },
      ],
    });

    expect(manager.remove).toHaveBeenCalledWith([removed]);
    expect(retained.levelSnapshot).toBe(5);
    expect(manager.create).toHaveBeenCalledWith(
      SessionPlayerEntity,
      expect.objectContaining({ session, player: third, levelSnapshot: 1 }),
    );
    expect(result).toEqual([retained, created]);
  });
});

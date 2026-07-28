import 'reflect-metadata';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreatePlayerDto, ListPlayersDto, RecordStatus } from './players.dto';
import { PlayersService } from './players.service';

function repository() {
  const rows: any[] = [];
  const repo: any = {
    create: (value: any) => ({
      id: value.id ?? crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...value,
    }),
    save: async (value: any) => {
      const index = rows.findIndex((x) => x.id === value.id);
      index < 0 ? rows.push(value) : rows.splice(index, 1, value);
      return value;
    },
    findOneBy: async ({ id }: any) => rows.find((x) => x.id === id) ?? null,
    createQueryBuilder: () => {
      let search = '';
      let active: boolean | undefined;
      let skip = 0;
      let take = 12;
      let sortField = 'name';
      let sortOrder: 'ASC' | 'DESC' = 'ASC';
      return {
        andWhere(sql: string, params: any) {
          if (sql.includes('ILIKE')) search = params.search.slice(1, -1).toLowerCase();
          if (sql.includes('active')) active = params.active;
          return this;
        },
        orderBy(field: string, order: 'ASC' | 'DESC') {
          sortField = field.split('.')[1];
          sortOrder = order;
          return this;
        },
        skip(value: number) {
          skip = value;
          return this;
        },
        take(value: number) {
          take = value;
          return this;
        },
        async getManyAndCount() {
          const filtered = rows.filter(
            (x) =>
              (!search || x.name.toLowerCase().includes(search)) &&
              (active === undefined || x.active === active),
          );
          filtered.sort((a, b) => {
            const comparison =
              a[sortField] > b[sortField] ? 1 : a[sortField] < b[sortField] ? -1 : 0;
            return sortOrder === 'DESC' ? -comparison : comparison;
          });
          return [filtered.slice(skip, skip + take), filtered.length];
        },
      };
    },
    rows,
  };
  return repo;
}
describe('PlayersService', () => {
  it('excluye partidos de borradores y jornadas canceladas del rendimiento', async () => {
    const repo = repository();
    const player = await new PlayersService(repo).create({ name: 'Ana', defaultLevel: 3 });
    const queries: string[] = [];
    const responses = [
      [{ totalPending: 0, latestLevel: 3, averageLevel: 3, minimumLevel: 3, maximumLevel: 3 }],
      [{ matchesPlayed: 1, matchesWon: 1, matchesLost: 0, pointsFor: 10, pointsAgainst: 7 }],
      [{ count: 0 }],
      [{ count: 3 }],
      [],
    ];
    const dataSource: any = {
      query: async (sql: string) => {
        queries.push(sql);
        return responses.shift();
      },
    };

    const profile = await new PlayersService(repo, dataSource).profile(player.id);

    expect(profile.competition).toMatchObject({
      matchesPlayed: 1,
      matchesWon: 1,
      matchesLost: 0,
      winRate: 100,
    });
    expect(queries[1]).toContain("gs.status IN ('SETTLEMENT','FINISHED')");
    expect(queries[4]).toContain("gs.status IN ('SETTLEMENT','FINISHED')");
  });

  it('crea, limpia y edita un jugador válido', async () => {
    const repo = repository();
    const service = new PlayersService(repo);
    const created = await service.create({ name: '  Ana  ', defaultLevel: 3, notes: '  líder ' });
    expect(created.name).toBe('Ana');
    expect(created.notes).toBe('líder');
    const edited = await service.update(created.id, { defaultLevel: 4 });
    expect(edited.defaultLevel).toBe(4);
  });
  it.each([0, 6])('rechaza el nivel %s por DTO', async (level) => {
    const dto = Object.assign(new CreatePlayerDto(), { name: 'Ana', defaultLevel: level });
    expect(await validate(dto)).not.toHaveLength(0);
  });
  it('desactiva y reactiva sin borrar', async () => {
    const service = new PlayersService(repository());
    const player = await service.create({ name: 'Ana', defaultLevel: 2 });
    expect((await service.status(player.id, false)).active).toBe(false);
    expect((await service.status(player.id, true)).active).toBe(true);
  });
  it('busca por nombre y filtra estado', async () => {
    const service = new PlayersService(repository());
    await service.create({ name: 'Ana Torres', defaultLevel: 2 });
    const bob = await service.create({ name: 'Bob', defaultLevel: 2 });
    await service.status(bob.id, false);
    const result = await service.list(
      Object.assign(new ListPlayersDto(), { search: 'ana', status: RecordStatus.ACTIVE }),
    );
    expect(result.items.map((x) => x.name)).toEqual(['Ana Torres']);
    const inactive = await service.list(
      Object.assign(new ListPlayersDto(), { status: RecordStatus.INACTIVE }),
    );
    expect(inactive.items).toHaveLength(1);
  });
  it('ordena jugadores por nivel descendente', async () => {
    const service = new PlayersService(repository());
    await service.create({ name: 'Nivel dos', defaultLevel: 2 });
    await service.create({ name: 'Nivel cinco', defaultLevel: 5 });
    await service.create({ name: 'Nivel cuatro', defaultLevel: 4 });
    const result = await service.list(
      Object.assign(new ListPlayersDto(), { sortBy: 'defaultLevel', sortOrder: 'DESC' }),
    );
    expect(result.items.map((player) => player.defaultLevel)).toEqual([5, 4, 2]);
  });
  it('responde 404 para un jugador inexistente', async () => {
    await expect(new PlayersService(repository()).get(crypto.randomUUID())).rejects.toMatchObject({
      status: 404,
    });
  });
});

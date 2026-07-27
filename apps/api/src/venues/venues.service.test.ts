import 'reflect-metadata';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { RecordStatus } from '../players/players.dto';
import { CreateVenueDto, ListVenuesDto } from './venues.dto';
import { VenuesService } from './venues.service';
function repository() {
  const rows: any[] = [];
  return {
    rows,
    create: (x: any) => ({ id: x.id ?? crypto.randomUUID(), createdAt: new Date(), ...x }),
    save: async (x: any) => {
      const i = rows.findIndex((y) => y.id === x.id);
      i < 0 ? rows.push(x) : rows.splice(i, 1, x);
      return x;
    },
    findOneBy: async ({ id }: any) => rows.find((x) => x.id === id) ?? null,
    createQueryBuilder: () => {
      let search = '';
      let active: any;
      return {
        andWhere(sql: string, p: any) {
          if (sql.includes('ILIKE')) search = p.search.slice(1, -1).toLowerCase();
          if (sql.includes('active')) active = p.active;
          return this;
        },
        orderBy() {
          return this;
        },
        skip() {
          return this;
        },
        take() {
          return this;
        },
        async getManyAndCount() {
          const list = rows.filter(
            (x) =>
              (!search ||
                x.name.toLowerCase().includes(search) ||
                (x.address ?? '').toLowerCase().includes(search)) &&
              (active === undefined || x.active === active),
          );
          return [list, list.length];
        },
      };
    },
  } as any;
}
describe('VenuesService', () => {
  it('crea y edita una cancha válida', async () => {
    const service = new VenuesService(repository());
    const venue = await service.create({
      name: ' Central ',
      address: ' Calle 1 ',
      defaultCourtPrice: 100000,
      defaultGatoradePrice: 5000,
    });
    expect(venue.name).toBe('Central');
    expect((await service.update(venue.id, { defaultCourtPrice: 120000 })).defaultCourtPrice).toBe(
      120000,
    );
  });
  it.each([['defaultCourtPrice'], ['defaultGatoradePrice']])(
    'rechaza %s negativo por DTO',
    async (field) => {
      const dto = Object.assign(new CreateVenueDto(), {
        name: 'Central',
        defaultCourtPrice: 1,
        defaultGatoradePrice: 1,
        [field]: -1,
      });
      expect(await validate(dto)).not.toHaveLength(0);
    },
  );
  it('desactiva y reactiva', async () => {
    const service = new VenuesService(repository());
    const venue = await service.create({
      name: 'Central',
      defaultCourtPrice: 1,
      defaultGatoradePrice: 1,
    });
    expect((await service.status(venue.id, false)).active).toBe(false);
    expect((await service.status(venue.id, true)).active).toBe(true);
  });
  it('busca nombre, dirección y filtra estado', async () => {
    const service = new VenuesService(repository());
    const a = await service.create({
      name: 'Central',
      address: 'Calle Norte',
      defaultCourtPrice: 1,
      defaultGatoradePrice: 1,
    });
    await service.create({
      name: 'Sur',
      address: 'Avenida 3',
      defaultCourtPrice: 1,
      defaultGatoradePrice: 1,
    });
    expect(
      (
        await service.list(
          Object.assign(new ListVenuesDto(), { search: 'norte', status: RecordStatus.ALL }),
        )
      ).items[0].id,
    ).toBe(a.id);
    await service.status(a.id, false);
    expect(
      (await service.list(Object.assign(new ListVenuesDto(), { status: RecordStatus.INACTIVE })))
        .items,
    ).toHaveLength(1);
  });
  it('responde 404 para una cancha inexistente', async () => {
    await expect(new VenuesService(repository()).get(crypto.randomUUID())).rejects.toMatchObject({
      status: 404,
    });
  });
});

import * as argon2 from 'argon2';
import ds from './data-source';
import { PlayerEntity, UserEntity, VenueEntity } from './entities';
import { UserRole } from '@volleyflow/shared';
async function seed() {
  await ds.initialize();
  try {
    const repo = ds.getRepository(UserEntity);
    const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@volleyflow.local';
    let user = await repo.findOneBy({ email });
    const password = process.env.SEED_ADMIN_PASSWORD ?? 'Cambiar123!';
    if (!user) {
      user = repo.create({
        name: process.env.SEED_ADMIN_NAME ?? 'Admin VolleyFlow',
        email,
        passwordHash: await argon2.hash(password),
        role: UserRole.ADMIN,
        active: true,
      });
      await repo.save(user);
    } else {
      let changed = false;
      const name = process.env.SEED_ADMIN_NAME ?? 'Admin VolleyFlow';
      if (user.name !== name) {
        user.name = name;
        changed = true;
      }
      if (user.role !== UserRole.ADMIN) {
        user.role = UserRole.ADMIN;
        changed = true;
      }
      if (!user.active) {
        user.active = true;
        changed = true;
      }
      if (!(await argon2.verify(user.passwordHash, password))) {
        user.passwordHash = await argon2.hash(password);
        changed = true;
      }
      if (changed) await repo.save(user);
    }
    const players = ds.getRepository(PlayerEntity);
    const demoPlayers = [
      ['Ana Torres', 3],
      ['Carlos Ruiz', 4],
      ['Diana Gómez', 2],
      ['Esteban Díaz', 5],
      ['Felipe Mora', 3],
      ['Gabriela León', 1],
      ['Hugo Pérez', 4],
      ['Isabel Rojas', 2],
      ['Juan Castro', 5],
      ['Laura Silva', 3],
      ['Mateo Vargas', 2],
      ['Natalia Gil', 4],
    ] as const;
    for (const [name, defaultLevel] of demoPlayers) {
      if (!(await players.findOneBy({ name })))
        await players.save(players.create({ name, defaultLevel, notes: null, active: true }));
    }
    const venues = ds.getRepository(VenueEntity);
    for (const venue of [
      {
        name: 'Cancha Central',
        address: 'Calle 80 # 20-15, Bogotá',
        defaultCourtPrice: 120000,
        defaultGatoradePrice: 5000,
      },
      {
        name: 'Arena Norte',
        address: 'Carrera 7 # 170-20, Bogotá',
        defaultCourtPrice: 95000,
        defaultGatoradePrice: 4500,
      },
    ])
      if (!(await venues.findOneBy({ name: venue.name })))
        await venues.save(venues.create({ ...venue, active: true }));
  } finally {
    await ds.destroy();
  }
}
void seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

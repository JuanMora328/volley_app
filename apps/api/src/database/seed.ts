import * as argon2 from 'argon2';
import ds from './data-source';
import { UserEntity } from './entities';
import { UserRole } from '@volleyflow/shared';
async function seed() {
  await ds.initialize();
  const repo = ds.getRepository(UserEntity);
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@volleyflow.local';
  let user = await repo.findOneBy({ email });
  if (!user) {
    user = repo.create({
      name: process.env.SEED_ADMIN_NAME ?? 'Admin VolleyFlow',
      email,
      passwordHash: await argon2.hash(process.env.SEED_ADMIN_PASSWORD ?? 'Cambiar123!'),
      role: UserRole.ADMIN,
      active: true,
    });
    await repo.save(user);
  }
  await ds.destroy();
}
void seed();

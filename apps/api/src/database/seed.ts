import * as argon2 from 'argon2';
import ds from './data-source';
import { UserEntity } from './entities';
import { UserRole } from '@volleyflow/shared';
async function seed() {
  await ds.initialize();
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
  await ds.destroy();
}
void seed();

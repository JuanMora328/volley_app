import * as argon2 from 'argon2';
import ds from './data-source';
import { AppSettingsEntity, UserEntity } from './entities';
import { APP_SETTINGS_ID } from './entities/app-settings.entity';
import { UserRole } from '@volleyflow/shared';
async function seed() {
  const name = process.env.SEED_ADMIN_NAME?.trim();
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!name || !email || !password) {
    throw new Error(
      'SEED_ADMIN_NAME, SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD son obligatorios para el seed.',
    );
  }
  if (password.length < 12) {
    throw new Error('SEED_ADMIN_PASSWORD debe contener al menos 12 caracteres.');
  }
  await ds.initialize();
  try {
    const repo = ds.getRepository(UserEntity);
    let user = await repo.findOneBy({ email });
    if (!user) {
      user = repo.create({
        name,
        email,
        passwordHash: await argon2.hash(password),
        role: UserRole.ADMIN,
        active: true,
      });
      await repo.save(user);
    } else {
      let changed = false;
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
    const settings = ds.getRepository(AppSettingsEntity);
    if (!(await settings.findOneBy({ id: APP_SETTINGS_ID })))
      await settings.save(
        settings.create({
          id: APP_SETTINGS_ID,
          organizationName: 'VolleyFlow',
          defaultTeamCount: 2,
          defaultTargetScore: 10,
          defaultCourtPrice: 0,
          defaultGatoradePrice: 0,
          timezone: 'America/Bogota',
        }),
      );
  } finally {
    await ds.destroy();
  }
}
void seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

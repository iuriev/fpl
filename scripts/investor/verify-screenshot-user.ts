import { eq } from 'drizzle-orm';

import { db } from '../../proxy/src/db/client';
import { user } from '../../proxy/src/db/schema';

async function main() {
  const email = process.argv[2];
  const fplTeamId = Number(process.argv[3] ?? '72828');

  if (!email) {
    console.error('Usage: tsx scripts/investor/verify-screenshot-user.ts <email> [fplTeamId]');
    process.exit(1);
  }

  const rows = await db
    .update(user)
    .set({ emailVerified: true, fplTeamId, updatedAt: new Date() })
    .where(eq(user.email, email))
    .returning({ id: user.id, email: user.email, fplTeamId: user.fplTeamId });

  if (rows.length === 0) {
    console.error(`No user found for ${email}`);
    process.exit(1);
  }

  console.log(`Verified ${rows[0].email} teamId=${rows[0].fplTeamId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

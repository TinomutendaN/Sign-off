// `npx prisma db seed`: the full demo reset (src/features/workspaces/demoSeed.ts), run locally.
// The nightly cron (/api/cron/reset-demo) runs the same reset on the live site.

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import { runDemoReset } from "../src/features/workspaces/demoSeed";

const db = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

runDemoReset(db)
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());

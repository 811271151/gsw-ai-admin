import type { Session } from "@gsw-ai-admin/auth";
import type { Database } from "@gsw-ai-admin/db";

export type Context = {
  session: Session | null;
  db: Database;
};

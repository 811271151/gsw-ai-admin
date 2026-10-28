import { createAuth } from "@gsw-ai-admin/auth";
import { createPrismaClient } from "@gsw-ai-admin/db";

import { ENV } from "./env.server";

export const db = createPrismaClient(ENV);
export const auth = createAuth(ENV, db);

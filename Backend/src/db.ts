import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schemas/schema";

const databasePath = Bun.env.DATABASE_PATH ?? `${import.meta.dir}/../database.sqlite.db`;
const sqlite = new Database(databasePath);
sqlite.run("PRAGMA foreign_keys = ON");
export const db = drizzle(sqlite, { schema });

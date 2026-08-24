import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schemas/schema";

const sqlite = new Database(`${import.meta.dir}/../database.sqlite.db`);
sqlite.run("PRAGMA foreign_keys = ON");
export const db = drizzle(sqlite, { schema });

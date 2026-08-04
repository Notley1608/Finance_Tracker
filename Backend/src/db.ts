import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./schemas/schema";

const sqlite = new Database("database.sqlite.db");
export const db = drizzle(sqlite, { schema });
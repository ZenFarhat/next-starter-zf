import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import { config } from "dotenv"
import * as schema from "./schema"

config({ path: ".env.local" })

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })

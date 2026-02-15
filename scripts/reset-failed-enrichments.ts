import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(resolve(__dirname, "../.env.local"), "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // Reset failed to pending
  const { error, count } = await supabase
    .from("companies")
    .update({ enrichment_status: "pending" })
    .eq("enrichment_status", "failed");

  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log(`Reset ${count} failed companies to pending`);
  }

  // Stats
  const { count: pending } = await supabase.from("companies").select("*", { count: "exact", head: true }).eq("enrichment_status", "pending");
  const { count: completed } = await supabase.from("companies").select("*", { count: "exact", head: true }).eq("enrichment_status", "completed");
  const { count: failed } = await supabase.from("companies").select("*", { count: "exact", head: true }).eq("enrichment_status", "failed");
  const { count: total } = await supabase.from("companies").select("*", { count: "exact", head: true });

  console.log(`\nEnrichment Status:`);
  console.log(`  Total: ${total}`);
  console.log(`  Completed: ${completed}`);
  console.log(`  Pending: ${pending}`);
  console.log(`  Failed: ${failed}`);
}

main().catch(console.error);

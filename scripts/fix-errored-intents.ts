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
  // Delete errored intent records (none with 0 signals)
  const { error, count } = await supabase
    .from("company_intents")
    .delete({ count: "exact" })
    .eq("intent_level", "none")
    .eq("signal_count", 0);

  if (error) {
    console.error("Delete error:", error.message);
  } else {
    console.log(`Deleted ${count} errored intent records (none with 0 signals)`);
  }

  // Check remaining
  const { count: remaining } = await supabase.from("company_intents").select("*", { count: "exact", head: true });
  const { count: companyTotal } = await supabase.from("companies").select("*", { count: "exact", head: true });
  console.log(`Remaining intent records: ${remaining}/${companyTotal} companies`);
}

main().catch(console.error);

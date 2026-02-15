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
  const { count: total } = await supabase.from("company_intents").select("*", { count: "exact", head: true });
  const { count: hotCount } = await supabase.from("company_intents").select("*", { count: "exact", head: true }).eq("intent_level", "hot");
  const { count: midCount } = await supabase.from("company_intents").select("*", { count: "exact", head: true }).eq("intent_level", "middle");
  const { count: lowCount } = await supabase.from("company_intents").select("*", { count: "exact", head: true }).eq("intent_level", "low");
  const { count: noneCount } = await supabase.from("company_intents").select("*", { count: "exact", head: true }).eq("intent_level", "none");
  const { count: signals } = await supabase.from("intent_signals").select("*", { count: "exact", head: true });
  const { count: erroredNone } = await supabase.from("company_intents").select("*", { count: "exact", head: true }).eq("intent_level", "none").eq("signal_count", 0);
  const { count: companyTotal } = await supabase.from("companies").select("*", { count: "exact", head: true });

  console.log("=== Intent Data Stats ===");
  console.log(`Total companies: ${companyTotal}`);
  console.log(`Companies with intent data: ${total}`);
  console.log(`Total signals: ${signals}`);
  console.log(`Hot: ${hotCount}`);
  console.log(`Middle: ${midCount}`);
  console.log(`Low: ${lowCount}`);
  console.log(`None: ${noneCount}`);
  console.log(`None with 0 signals (likely errored): ${erroredNone}`);
}

main().catch(console.error);

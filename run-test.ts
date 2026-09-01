import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { renderCharacterImage } from "@/lib/virtual-model.server";
import { signedUrl } from "@/lib/storage.server";
const { data } = await supabaseAdmin.from("virtual_models").select("*").eq("status","ready").limit(1);
const m = data?.[0];
if(!m){console.log("no model");process.exit(0);}
console.log(m.name, m.headshot_path, JSON.stringify(m.images).slice(0,200));
const r = await renderCharacterImage(m.user_id, {
  modelId: m.id, identityPrompt: m.identity_prompt, seed: Number(m.seed), headshotPath: m.headshot_path,
  images: m.images ?? [], prompt: "walking through a neon night market holding a paper cup of coffee",
  shot: "Full body", aspect: "4:5", scene: { background: "neon", lighting: "neon", outfit: ["leather jacket"] },
});
console.log(JSON.stringify(r).slice(0,300));

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { signedUrl } from "@/lib/storage.server";
const { data } = await supabaseAdmin.from("generations").select("storage_path").eq("id","bc904f17-3af8-4ed0-ab44-5f53e81ee8cd").single();
console.log(await signedUrl("generations", data!.storage_path));
const { data: m } = await supabaseAdmin.from("virtual_models").select("images").eq("status","ready").limit(1).single();
console.log(await signedUrl("virtual-models", (m!.images as any).find((i:any)=>i.view==="front-full")?.path ?? (m!.images as any)[0].path));

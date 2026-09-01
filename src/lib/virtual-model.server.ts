/** Server-only character generation pipeline. */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { pixazoImage, sizeForAspect } from "@/lib/providers.server";
import {
  GENERATIONS_BUCKET,
  MODELS_BUCKET,
  referenceUrl,
  signedUrl,
  uploadFromUrl,
} from "@/lib/storage.server";
import {
  consistencyProfile,
  denoiseStrength,
  framingNegative,
  IDENTITY_NEGATIVE,
  MODEL_VIEWS,
  referenceViewForShot,
  renderPrompt,
  resolutionBase,
  sceneNegative,
  type SceneSettings,
  viewPrompt,
  viewSeed,
  type ViewId,
  type VirtualModelImage,
} from "@/lib/virtual-model.shared";

const PORTRAIT_SIZE = { width: 768, height: 960 };
const BODY_SIZE = { width: 704, height: 1216 };

/**
 * Builds a character profile as a dependency chain instead of five independent
 * renders:
 *
 *   headshot (text-to-image anchor, generated first)
 *     -> front full body (inherits the face)
 *          -> back / left / right full body (inherit face + silhouette)
 *
 * Every render reuses the same identity clause, a deterministic per-view seed
 * and a low denoise strength derived from the consistency dial, so the face and
 * body structure hold across the whole set.
 */
export async function buildCharacterProfile(
  userId: string,
  input: {
    name: string;
    description: string;
    identityPrompt: string;
    seed?: number | undefined;
    consistency?: number | undefined;
    style?: string | undefined;
    jobId?: string | undefined;
  },
) {
  const profileFor = (s: number) => consistencyProfile(s);

  // One profile row per background task: a retried task resumes the same row
  // instead of creating a second half-built character.
  let row: { id: string } | null = null;
  let seed = input.seed ?? Math.floor(Math.random() * 1_000_000);
  let existing: VirtualModelImage[] = [];

  if (input.jobId) {
    const { data: prior } = await supabaseAdmin
      .from("virtual_models")
      .select("id, seed, images")
      .eq("job_id", input.jobId)
      .maybeSingle();
    if (prior) {
      row = { id: prior.id };
      seed = Number(prior.seed) || seed;
      existing = ((prior.images as VirtualModelImage[] | null) ?? []).filter((i) => i.path);
      await supabaseAdmin
        .from("virtual_models")
        .update({ status: "running", error: null })
        .eq("id", prior.id);
    }
  }

  if (!row) {
    const { data: created, error } = await supabaseAdmin
      .from("virtual_models")
      .insert({
        user_id: userId,
        name: input.name,
        description: input.description,
        identity_prompt: input.identityPrompt,
        seed,
        status: "running",
        job_id: input.jobId ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    row = { id: created.id };
  }

  const profile = profileFor(input.consistency ?? 92);


  const images: VirtualModelImage[] = [];
  const paths = new Map<ViewId, string>();
  const refUrls = new Map<ViewId, string>();

  // Resume: keep views a previous attempt already rendered.
  for (const img of existing) paths.set(img.view as ViewId, img.path);

  const renderView = async (view: (typeof MODEL_VIEWS)[number]) => {
    const done = paths.get(view.id);
    if (done) {
      const url = await referenceUrl(MODELS_BUCKET, done);
      if (url) refUrls.set(view.id, url);
      return done;
    }
    const size = view.portrait ? PORTRAIT_SIZE : BODY_SIZE;
    const reference = view.reference ? refUrls.get(view.reference) : undefined;
    const base = {
      prompt: viewPrompt(input.identityPrompt, view.instruction, input.style),
      negativePrompt: IDENTITY_NEGATIVE,
      width: size.width,
      height: size.height,
      seed: viewSeed(seed, view.id),
      steps: profile.steps,
      guidance: Math.min(profile.guidance, 8.5),
    };

    // Body views are conditioned on the anchor face. If the image-to-image
    // provider rejects the request, fall back to a prompt-only render so the
    // profile still ends up with all five views instead of stopping at the
    // headshot.
    let providerUrl: string;
    if (reference) {
      // A head-and-shoulders anchor cannot be nudged into a head-to-toe frame
      // at portrait denoise levels, so body views need much more freedom.
      const strength = view.portrait
        ? profile.strength
        : view.reference === "headshot"
          ? 0.82
          : 0.6;
      try {
        providerUrl = await pixazoImage({
          ...base,
          imageUrl: reference,
          strength,
        });
      } catch {
        providerUrl = await pixazoImage(base);
      }

    } else {
      providerUrl = await pixazoImage(base);
    }


    const path = await uploadFromUrl(MODELS_BUCKET, userId, providerUrl);
    paths.set(view.id, path);
    const url = await referenceUrl(MODELS_BUCKET, path);
    if (url) refUrls.set(view.id, url);
    return path;
  };

  const byId = (id: ViewId) => MODEL_VIEWS.find((v) => v.id === id)!;

  try {
    // Stage 1 — the anchor identity: the face headshot is always rendered first.
    const headshotPath = await renderView(byId("headshot"));
    await supabaseAdmin
      .from("virtual_models")
      .update({ headshot_path: headshotPath })
      .eq("id", row.id);

    // Stage 2 — the body reference, conditioned on the anchor face.
    await renderView(byId("front-full"));

    // Stage 3 — the three remaining body views, one at a time so a single
    // character task never fans out into unbounded parallel generations.
    for (const view of MODEL_VIEWS) {
      if (view.id === "headshot" || view.id === "front-full") continue;
      await renderView(view);
    }

    for (const view of MODEL_VIEWS) {
      const path = paths.get(view.id);
      if (path) images.push({ view: view.id, path });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Character generation failed";
    for (const view of MODEL_VIEWS) {
      const path = paths.get(view.id);
      if (path) images.push({ view: view.id, path });
    }
    await supabaseAdmin
      .from("virtual_models")
      .update({ status: "failed", error: message, images })
      .eq("id", row.id);
    throw new Error(message);
  }

  await supabaseAdmin
    .from("virtual_models")
    .update({
      status: "ready",
      images,
      headshot_path: paths.get("headshot") ?? images[0]?.path ?? null,
    })
    .eq("id", row.id);

  return { id: row.id };
}

export async function renderCharacterImage(
  userId: string,
  input: {
    modelId: string;
    identityPrompt: string;
    seed: number;
    headshotPath: string | null;
    images?: VirtualModelImage[] | undefined;
    prompt: string;
    negativePrompt?: string | undefined;
    aspect?: string | undefined;
    shot?: string | undefined;
    consistency?: number | undefined;
    detail?: number | undefined;
    faceLock?: boolean | undefined;
    variation?: number | undefined;
    style?: string | undefined;
    scene?: SceneSettings | undefined;
    upscale?: boolean | undefined;
  },
) {
  // Condition on the profile view that matches the requested framing, so a full
  // body shot inherits proportions and a close-up inherits the face.
  const wanted = referenceViewForShot(input.shot);
  const available = input.images ?? [];
  const matched = available.find((i) => i.view === wanted)?.path ?? null;
  const referencePath =
    matched ??
    available.find((i) => i.view === "front-full")?.path ??
    available.find((i) => i.view === "headshot")?.path ??
    input.headshotPath ??
    available[0]?.path ??
    null;
  const referenceView: ViewId = matched
    ? wanted
    : ((available.find((i) => i.path === referencePath)?.view as ViewId | undefined) ?? "headshot");

  const reference = referencePath ? await referenceUrl(MODELS_BUCKET, referencePath) : null;
  const { width, height } = sizeForAspect(
    input.aspect ?? "4:5",
    resolutionBase(input.scene?.resolution),
  );
  const faceLock = input.faceLock ?? true;
  const profile = consistencyProfile(input.consistency ?? 92);
  const variation = input.variation ?? 0;
  const strength = denoiseStrength({
    shot: input.shot,
    referenceView,
    faceLock,
    consistency: input.consistency,
  });

  const providerUrl = await pixazoImage({
    prompt: renderPrompt({
      identityPrompt: input.identityPrompt,
      prompt: input.prompt,
      faceLock,
      detail: input.detail ?? 85,
      shot: input.shot,
      style: input.style,
      scene: input.scene,
    }),
    negativePrompt: [
      input.negativePrompt,
      input.scene ? sceneNegative(input.scene) : "",
      framingNegative(input.shot),
      IDENTITY_NEGATIVE,
    ]
      .filter(Boolean)
      .join(", "),
    ...(reference ? { imageUrl: reference, strength } : {}),
    width,
    height,
    // Same identity seed, offset per variation so a batch differs in pose and
    // framing without becoming a different person.
    seed: viewSeed(input.seed, `render-${variation}-${input.shot ?? ""}-${input.prompt.length}`),
    // Auto upscale trades time for extra refinement passes.
    steps: Math.min(input.upscale === false ? profile.steps : profile.steps + 10, 60),
    // Very high guidance burns detail on this sampler and fights the prompt.
    guidance: Math.min(profile.guidance, 8.5),
  });


  const path = await uploadFromUrl(GENERATIONS_BUCKET, userId, providerUrl);
  const { data: row, error } = await supabaseAdmin
    .from("generations")
    .insert({
      user_id: userId,
      kind: "image",
      model: "hyper-image-flash",
      prompt: input.prompt,
      status: "completed",
      storage_path: path,
      virtual_model_id: input.modelId,
      params: {
        aspect: input.aspect ?? "4:5",
        referenceView,
        strength,
        consistency: input.consistency ?? 92,
        faceLock,
      },
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  return { id: row.id, url: await signedUrl(GENERATIONS_BUCKET, path) };
}

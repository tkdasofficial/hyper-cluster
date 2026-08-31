import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { StudioLayout } from "@/components/hyper/StudioLayout";
import { Chips, Panel, RatioBlocks, Segment, SliderRow, SwitchRow, TextRow } from "@/components/hyper/StudioControls";
import { RecentCreations } from "@/components/hyper/RecentCreations";

export const Route = createFileRoute("/image")({
  head: () => ({
    meta: [
      { title: "Image Studio — Advanced AI Image Generation | Hyper Copilot" },
      {
        name: "description",
        content:
          "Generate photoreal images with full control: models, aspect ratios, HEAVEN style, references, sampling and upscaling in Hyper Copilot's Image Studio.",
      },
      { property: "og:title", content: "Image Studio — Advanced AI Image Generation" },
      {
        property: "og:description",
        content: "Model, ratio, style, reference and sampling controls for production-grade AI images.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ImageStudio,
});

const model = "Hyper Image Speed";
const ratios = ["1:1", "4:5", "3:2", "16:9", "9:16", "21:9", "2:3", "3:4", "5:4"] as const;
const resolutions = ["1K", "2K", "4K", "8K"] as const;
const styles = ["HEAVEN", "Photoreal", "Cinematic", "Anime", "3D Render", "Line Art", "Neon Noir"] as const;
const refModes = ["Reference", "Transform", "Composition", "Palette", "Character", "Inpaint", "Depth", "Pose"];

function ImageStudio() {
  const [prompt, setPrompt] = useState("");
  const [negative, setNegative] = useState("");
  const [ratio, setRatio] = useState<(typeof ratios)[number]>(ratios[0]);
  const [res, setRes] = useState<(typeof resolutions)[number]>(resolutions[1]);
  const [style, setStyle] = useState<(typeof styles)[number]>(styles[0]);
  const [strength, setStrength] = useState(65);
  const [modes, setModes] = useState<string[]>(["Reference"]);
  const [refWeight, setRefWeight] = useState(50);
  const [count, setCount] = useState(4);

  return (
    <StudioLayout>
      <div className="space-y-3.5">
        <div className="rounded-2xl border border-border bg-surface/50 p-3.5">
          <TextRow
            label="Prompt"
            value={prompt}
            onChange={setPrompt}
            rows={3}
            placeholder="A chrome heron standing in a flooded cathedral, volumetric light…"
          />
          <div className="mt-3.5">
            <TextRow
              label="Negative prompt"
              value={negative}
              onChange={setNegative}
              rows={2}
              placeholder="text, watermark, extra fingers"
            />
          </div>
        </div>

        <Panel title="Canvas" summary={`${ratio} · ${res}`}>
          <RatioBlocks label="Aspect ratio" options={ratios} value={ratio} onChange={setRatio} />
          <Segment label="Resolution" options={resolutions} value={res} onChange={setRes} />
        </Panel>

        <Panel title="Style" summary={`${style} · ${strength}%`}>
          <Segment options={styles} value={style} onChange={setStyle} />
          <SliderRow label="Style strength" value={strength} onChange={setStrength} suffix="%" />
        </Panel>

        <Panel title="Reference & advanced" summary={modes.join(", ") || "None"}>
          <Chips
            options={refModes}
            values={modes}
            onToggle={(v) => setModes((m) => (m.includes(v) ? m.filter((x) => x !== v) : [...m, v]))}
          />
          <SliderRow label="Reference influence" value={refWeight} onChange={setRefWeight} suffix="%" />
        </Panel>

        <Panel title="Output" summary={`${count} variations`}>
          <SliderRow label="Variations" value={count} onChange={setCount} min={1} max={8} />
        </Panel>

        <button
          type="button"
          onClick={() =>
            prompt.trim()
              ? toast.success(`Queued ${count} render${count === 1 ? "" : "s"}`, {
                  description: `${model} · ${ratio} · ${res} · ${style}`,
                })
              : toast.error("Describe what you want to create first.")
          }
          className="w-full rounded-full bg-primary py-3 text-[14px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Generate
        </button>

        <RecentCreations />
      </div>
    </StudioLayout>
  );
}

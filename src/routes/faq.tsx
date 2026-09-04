import { pageHead, SITE_URL } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Logo } from "@/components/hyper/Logo";

type Faq = { q: string; a: string };

const faqGroups: { group: string; items: Faq[] }[] = [
  {
    group: "Getting started",
    items: [
      {
        q: "What is Hyper Cluster?",
        a: "Hyper Cluster is a multi-modal generative AI studio built by Tushar Kanti Das. One prompt box gives you text-to-image, text-to-video, image-to-video, AI voice and music, vector drafts, generative fill, 8K upscaling and consistent virtual models — without switching between separate tools.",
      },
      {
        q: "Do I need to install anything?",
        a: "No. Hyper Cluster runs entirely in the browser on desktop and mobile. Create an account with email or Google and you can start generating in under a minute.",
      },
      {
        q: "Is there a free plan?",
        a: "Yes. The Starter plan includes free credits so you can test image, video and audio generation before upgrading. See the pricing page for what each plan includes.",
      },
      {
        q: "Which file formats can I export?",
        a: "Images export as PNG, video as MP4, vectors as SVG and audio as WAV. Everything you generate stays in your library until you delete it.",
      },
    ],
  },
  {
    group: "Image generation",
    items: [
      {
        q: "How do I generate an image from text?",
        a: "Open the Image Studio, describe the scene in the prompt box, pick an aspect ratio and the number of variations, then generate. Renders appear in your recent creations and library automatically.",
      },
      {
        q: "Can I use my own photo as a reference?",
        a: "Yes. Upload a reference image in the Image Studio and adjust the reference influence to control how closely the output follows it. Low influence keeps only the mood; high influence keeps composition and subject.",
      },
      {
        q: "Can I upscale images to 4K or 8K?",
        a: "Yes. Every generation can be pushed through the detail-preserving upscaling pipeline up to 8K, which is useful for print, billboards and product pages.",
      },
      {
        q: "What is generative fill?",
        a: "Generative fill lets you repaint, extend or clean any region of an image — remove an object, expand a background to a new aspect ratio, or swap a piece of wardrobe without regenerating the whole frame.",
      },
    ],
  },
  {
    group: "Video and audio",
    items: [
      {
        q: "How does text-to-video work?",
        a: "Write a prompt, choose FPS (24, 30 or 60), duration and aspect ratio, then generate. If you upload one frame it becomes image-to-video; upload a start and an end frame and the model interpolates the motion between them.",
      },
      {
        q: "How long can generated clips be?",
        a: "Clips run from 1 to 10 seconds. Longer durations are gated to higher plans because they cost significantly more compute per render.",
      },
      {
        q: "Can I generate voiceovers and music?",
        a: "Yes. The Audio Studio offers text-to-speech across 30 voices with tone and pace controls, plus text-to-music with genre, mood and duration settings for background scores.",
      },
    ],
  },
  {
    group: "Virtual models and AI influencers",
    items: [
      {
        q: "What is a virtual model?",
        a: "A virtual model is a reusable AI character. Hyper Cluster generates a headshot anchor first, then four full-body views (front, back, left, right) from that same face, so every future render keeps the identity consistent.",
      },
      {
        q: "Can I keep the same face across different shoots?",
        a: "Yes — that is the point of virtual models. Once a profile exists you can change the wardrobe, framing, lighting, lens and background while the identity stays locked to the profile.",
      },
      {
        q: "How do I delete a model profile?",
        a: "Long-press a model card in the Virtual Model page, choose delete, and confirm by typing the model name exactly. This prevents accidental removal of a trained profile.",
      },
    ],
  },
  {
    group: "Jobs, privacy and licensing",
    items: [
      {
        q: "Can I leave the page while a generation runs?",
        a: "Yes. Generations run as background jobs on the server. You can reload or close the tab and the finished result will be waiting in your account when you return.",
      },
      {
        q: "Do you train models on my prompts or uploads?",
        a: "No. Your prompts and uploads are not used to train public models. Private fine-tuning happens only on assets you explicitly select. See the privacy policy for full detail.",
      },
      {
        q: "Can I use the output commercially?",
        a: "Subject to your plan, you own the output you generate and may use it in commercial projects. The terms of service set out the full licensing conditions and acceptable use rules.",
      },
      {
        q: "Who built Hyper Cluster?",
        a: "Hyper Cluster is designed and built by Tushar Kanti Das, who is the owner, author and publisher of the platform.",
      },
    ],
  },
];

const allFaqs = faqGroups.flatMap((g) => g.items);

export const Route = createFileRoute("/faq")({
  head: () =>
    pageHead({
      path: "/faq",
      title: "FAQ \u2014 Hyper Cluster AI Generator Questions Answered",
      description:
        "Answers to common questions about Hyper Cluster: AI image, video, voice and virtual model generation, background jobs, pricing, privacy and commercial licensing.",
      ogTitle: "Hyper Cluster FAQ \u2014 AI Image, Video, Voice & Model Generation",
      keywords: [
        "Hyper Cluster FAQ",
        "AI generator FAQ",
        "how does AI image generation work",
        "how to make AI videos from text",
        "AI voice generator questions",
        "AI influencer FAQ",
        "virtual model generator help",
        "is AI generated art commercially usable",
        "AI image copyright questions",
        "does AI training use my prompts",
        "background AI generation jobs",
        "AI upscaling explained",
        "generative fill explained",
        "image to video AI explained",
        "AI aspect ratio guide",
        "free AI generator questions",
        "AI studio support",
        "AI content licensing explained",
        "how to keep the same AI face",
        "AI video duration limits",
      ],
      breadcrumbs: [{ name: "FAQ", path: "/faq" }],
      jsonLd: [
        {
          "@type": "FAQPage",
          "@id": `${SITE_URL}/faq#faq`,
          mainEntity: allFaqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
      ],
    }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-4 lg:px-8">
          <Logo />
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <Link
              to="/pricing"
              className="hidden rounded-full px-3 py-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Pricing
            </Link>
            <Link
              to="/auth"
              className="rounded-full bg-foreground px-3.5 py-2 text-[13px] font-bold text-background transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-12 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-[12px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <span className="px-1.5">/</span>
          <span className="text-foreground">FAQ</span>
        </nav>

        <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <HelpCircle className="h-3.5 w-3.5 text-spectral-2" strokeWidth={2} />
          Help centre
        </span>

        <h1 className="mt-4 text-[30px] font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-4xl">
          Frequently asked questions
        </h1>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
          Everything about generating images, video, voice and consistent AI models with Hyper
          Cluster — how the studio works, what it costs, and what happens to your data.
        </p>

        <div className="mt-10 space-y-10">
          {faqGroups.map((group) => (
            <section key={group.group} aria-labelledby={group.group.replace(/\s+/g, "-")}>
              <h2
                id={group.group.replace(/\s+/g, "-")}
                className="text-[12px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70"
              >
                {group.group}
              </h2>
              <div className="mt-3 space-y-2.5">
                {group.items.map((f) => (
                  <details
                    key={f.q}
                    className="group rounded-2xl border border-border bg-surface px-4 py-3.5 transition-colors hover:border-border-strong"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14px] font-bold [&::-webkit-details-marker]:hidden">
                      <h3 className="text-[14px] font-bold">{f.q}</h3>
                      <ChevronDown
                        className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                        strokeWidth={2.2}
                      />
                    </summary>
                    <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
                      {f.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-14 rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-xl font-extrabold tracking-[-0.02em]">Still have a question?</h2>
          <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-muted-foreground">
            Create a free account and try the studio, or read the plan details, terms and privacy
            policy for the finer print.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5 text-[13px] font-bold">
            <Link
              to="/auth"
              className="rounded-full bg-primary px-4 py-2.5 text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get started free
            </Link>
            <Link
              to="/pricing"
              className="rounded-full border border-border px-4 py-2.5 transition-colors hover:border-border-strong"
            >
              Pricing
            </Link>
            <Link
              to="/terms"
              className="rounded-full border border-border px-4 py-2.5 transition-colors hover:border-border-strong"
            >
              Terms
            </Link>
            <Link
              to="/privacy"
              className="rounded-full border border-border px-4 py-2.5 transition-colors hover:border-border-strong"
            >
              Privacy
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-2 px-4 py-8 text-center lg:px-8">
          <p className="text-[12px] text-muted-foreground">
            Hyper Cluster · Generative AI for teams that ship
          </p>
        </div>
      </footer>
    </div>
  );
}

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useAppName } from "~/lib/public-env";

function withAppName(text: string, appName: string) {
  return text.replaceAll("{{appName}}", appName);
}

const FAQS = [
  {
    question: "What is {{appName}}?",
    answer:
      "{{appName}} is a multi-modal AI video creation platform powered by Seedance 2.0. It supports image, video, audio, and text inputs so you can reference motion, effects, camera movements, characters, scenes, and sounds with natural language — for truly controllable video creation.",
  },
  {
    question: "What is Seedance 2.0?",
    answer:
      "Seedance 2.0 is the multi-modal AI video generation model that powers {{appName}}. It combines image, video, audio, and text inputs for production-ready video generation with strong consistency and precise motion control.",
  },
  {
    question: "Do you support API access?",
    answer:
      "API access is currently under planning. We will announce more details when it becomes available.",
  },
  {
    question: "What inputs does Seedance 2.0 support?",
    answer:
      "Seedance 2.0 supports four input modalities: up to 9 images, up to 3 videos (total duration ≤15s), up to 3 audio files (MP3, total duration ≤15s), and text prompts in natural language. You can combine up to 12 files total across different modalities for maximum creative flexibility.",
  },
  {
    question: "What can I reference with Seedance 2.0?",
    answer:
      "You can reference virtually anything from your uploaded content: motion and choreography, visual effects and transitions, camera movements and angles, character appearances and styles, scene compositions, and even audio/sound. Simply describe in your prompt what you want to reference, like 'Use the camera movement from @video1 with the character style from @image1.'",
  },
  {
    question: "How does video extension work?",
    answer:
      "Seedance 2.0 can smoothly extend existing videos. Upload your video and specify how many seconds you want to add (the generation length should match your extension length, e.g., extend 5s with 5s generation). The model maintains continuity in motion, style, and content for seamless results.",
  },
  {
    question: "Can I edit existing videos with Seedance 2.0?",
    answer:
      "Yes! Seedance 2.0 supports video editing capabilities. You can replace characters, modify specific actions or segments, add new elements, or remove unwanted content - all while preserving the rest of your video. This means you can make targeted adjustments without regenerating everything from scratch.",
  },
  {
    question: "How does the audio feature work?",
    answer:
      "Seedance 2.0 includes built-in audio generation that creates context-aware sound effects and background music. You can also upload your own audio files to sync video content to specific beats or rhythms, perfect for music videos and dance content.",
  },
  {
    question: "What video lengths and resolutions are supported?",
    answer:
      "Seedance 2.0 generates videos from 4 to 15 seconds in length. Multiple aspect ratios are supported including 16:9, 9:16, 4:3, 3:4, 21:9, and 1:1. Output resolutions include 480p, 720p, 1080p, and 4K.",
  },
  {
    question: "How are credits charged for video generation?",
    answer:
      "Credits are charged per second based on resolution and whether you upload reference video(s). Without reference video: rate × output length. With reference video: rate × (reference video length + output length). AI audio does not change the cost. Example: 5s at 720p with no reference video costs 205 credits. Exact rates and live estimates are shown on the Pricing page and in the generation form.",
  },
  {
    question: "How is character consistency maintained?",
    answer:
      "Seedance 2.0 features significantly improved consistency for faces, clothing, text, scenes, and visual styles. The model maintains stable character appearance across frames and shots, solving common AI video problems like character drift, style inconsistency, and detail loss.",
  },
  {
    question: "Can I replicate camera movements from other videos?",
    answer:
      "Absolutely! One of Seedance 2.0's standout features is precise camera and motion replication. Upload a reference video with the camera movements or choreography you like, and the model will accurately replicate them with your own content. No detailed prompts required - just show what you want.",
  },
  {
    question: "Are there watermarks on generated videos?",
    answer:
      "Paid plans include watermark-free generation. Free-tier outputs may include a small watermark. Upgrade to any paid plan to download your videos without watermarks.",
  },
  {
    question: "How do you ensure privacy and security?",
    answer:
      "We take privacy seriously. Your uploaded assets and generated content are processed securely and are not used to train models without your consent. Private generation options are available on paid plans.",
  },
  {
    question: "Does {{appName}} support NSFW content?",
    answer:
      "No. {{appName}} does not allow adult sexual content (NSFW), pornography, or other prohibited content under our Terms. We use safety filters and may refuse generation, withhold credits for blocked requests, and suspend accounts that violate our content policies.",
  },
  {
    question: "How do I get started with {{appName}}?",
    answer:
      "Simply sign up for an account, choose a plan or credit pack, and start creating. You can upload your assets, describe your vision in natural language, and generate your first video in minutes.",
  },
];

function FAQItem({
  item,
  isOpen,
  onToggle,
}: {
  item: { question: string; answer: string };
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="group -mx-4 flex w-full items-center justify-between rounded-lg px-4 py-6 text-left transition-colors duration-200 hover:bg-muted/30"
      >
        <div className="flex flex-1 items-center gap-4">
          <ChevronDown
            className={`h-5 w-5 flex-shrink-0 text-primary transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          />
          <h3 className="text-base font-medium text-foreground sm:text-lg md:text-xl">
            {item.question}
          </h3>
        </div>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? "1200px" : "0px",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="pb-6 pl-9 pr-4 leading-relaxed text-muted-foreground">
          {item.answer}
        </div>
      </div>
    </div>
  );
}

export function SeedanceFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const appName = useAppName();
  const faqs = useMemo(
    () =>
      FAQS.map((item) => ({
        question: withAppName(item.question, appName),
        answer: withAppName(item.answer, appName),
      })),
    [appName],
  );

  return (
    <section className="bg-background px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold leading-tight text-foreground md:text-4xl">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="space-y-0">
          {faqs.map((item, index) => (
            <FAQItem
              key={item.question}
              item={item}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

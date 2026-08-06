import { ChevronDown } from "lucide-react";
import type React from "react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { FAQProps } from "@/types/faq";

const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-3 last:mb-0">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
};

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
          <h3 className="font-medium text-base text-foreground sm:text-lg md:text-xl">
            {item.question}
          </h3>
        </div>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? "2000px" : "0px",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="pr-4 pb-6 pl-9 text-muted-foreground leading-relaxed">
          <ReactMarkdown components={markdownComponents}>
            {item.answer}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

const FAQ: React.FC<FAQProps> = ({ items, title, description }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-background px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          {title ? (
            <h2 className="font-bold text-3xl text-foreground leading-tight md:text-4xl">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="mt-4 text-muted-foreground leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>

        <div className="space-y-0">
          {(items ?? []).map((faq, index) => (
            <FAQItem
              key={faq.question}
              item={faq}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQProps {
  items?: FAQItem[];
  title?: string;
  description?: string;
}

export interface SubscriptionPlanCycle {
  id: string;
  price: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  /** Display string for annual-effective per-credit rate */
  perCredit: string;
  /** Monthly credit allocation (yearly = monthlyCredits * 12) */
  monthlyCredits: number;
  cycles: {
    monthly: SubscriptionPlanCycle;
    yearly: SubscriptionPlanCycle;
  };
  features: string[];
  cta: string;
  popular: boolean;
}

export interface CreditPack {
  id: string;
  name: string;
  description: string;
  credits: number;
  price: number;
  perCredit: string;
  cta: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface PricingPageContent {
  meta: {
    title: string;
    description: string;
  };
  page: {
    unsureSection: {
      title: string;
      description: string;
      linkText: string;
    };
  };
  faq: {
    title: string;
    description: string;
    items: FAQItem[];
  };
  subscriptionPlans: SubscriptionPlan[];
  creditPacks: CreditPack[];
}

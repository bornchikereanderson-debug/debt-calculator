export const PREMIUM_STORAGE_KEY = "debt-calculator:premium:v1";

export type PremiumAccess = {
  unlocked: true;
  planId: string;
  email: string;
  verifiedAt: string;
};

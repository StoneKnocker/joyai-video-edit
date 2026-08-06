/**
 * Payment provider review test account.
 * Login: email OTP with a fixed verification code (no real email required).
 */
export const REVIEW_TEST_EMAIL = "subotiz-test@vidrushai.com";
export const REVIEW_TEST_OTP = "666888";
export const REVIEW_TEST_CREDITS = 1000;

export function isReviewTestEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase() === REVIEW_TEST_EMAIL;
}

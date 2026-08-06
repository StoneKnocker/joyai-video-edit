import {
  isReviewTestEmail,
  REVIEW_TEST_CREDITS,
} from "@/lib/auth/review-test-account";
import { CREDIT_EVENT, CREDIT_TYPE } from "@/lib/consts";
import { addCreditHistory } from "@/lib/model/creditHistory";
import { addPermanentCredits, getUserBalance } from "@/lib/model/userBalance";

/**
 * 确保支付审核测试账号永久积分不少于 REVIEW_TEST_CREDITS。
 * 用于账号已存在但余额不足、或首次登录后补齐的场景。
 */
export async function ensureReviewTestAccountCredits(
  userId: string,
  email?: string | null,
): Promise<void> {
  if (!isReviewTestEmail(email) || !userId) {
    return;
  }

  try {
    const balance = await getUserBalance(userId);
    const current = balance?.permanentCredits ?? 0;
    if (current >= REVIEW_TEST_CREDITS) {
      return;
    }

    const topUp = REVIEW_TEST_CREDITS - current;
    await addPermanentCredits(userId, topUp);
    await addCreditHistory({
      userId,
      amount: topUp,
      creditType: CREDIT_TYPE.PERMANENT,
      creditEvent: CREDIT_EVENT.MANUAL_ADJUSTMENT,
      description: "payment review test account top-up",
      referenceId: "",
    });
    console.log(
      `[review-test] topped up ${topUp} permanent credits for ${email} (userId=${userId})`,
    );
  } catch (error) {
    console.error("Failed to ensure review test account credits:", error);
  }
}

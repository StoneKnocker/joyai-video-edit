import Unosend from "@unosend/node";
import { emailOTP } from "better-auth/plugins";
import { serverEnv } from "~/lib/env.server";
import { isReviewTestEmail, REVIEW_TEST_OTP } from "./review-test-account";

const unosendFromEmail = serverEnv.SEND_FROM_EMAIL;

export const emailOTPConfig = emailOTP({
  // Fixed OTP for payment review test account (reviewers never receive real mail)
  generateOTP: ({ email }) => {
    if (isReviewTestEmail(email)) {
      return REVIEW_TEST_OTP;
    }
  },
  sendVerificationOTP: async ({
    email,
    otp,
    type,
  }: {
    email: string;
    otp: string;
    type: string;
  }) => {
    // Skip outbound email for the review test account
    if (isReviewTestEmail(email)) {
      console.log(
        `[review-test] OTP for ${email}: ${otp} (email delivery skipped)`,
      );
      return;
    }

    const subject =
      type === "sign-in"
        ? `Sign-In ${serverEnv.APP_NAME}`
        : type === "email-verification"
          ? "Verify Your Email"
          : "Your OTP Code";

    const unosend = new Unosend(serverEnv.UNOSEND_API_KEY);

    try {
      const { data, error } = await unosend.emails.send({
        from: unosendFromEmail,
        to: [email],
        subject,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a; font-size: 24px; font-weight: 600; margin-bottom: 16px;">${serverEnv.APP_NAME} One-Time Password</h2>
            <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
              ${
                type === "sign-in"
                  ? "Use the code below to sign in to your account:"
                  : type === "email-verification"
                    ? "Verify your email address with the code below:"
                    : "Your verification code is:"
              }
            </p>
            <div style="background: #f5f5f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a; font-family: monospace;">
                ${otp}
              </div>
            </div>
            <p style="color: #6a6a6a; font-size: 14px; line-height: 1.5; margin-bottom: 8px;">
              This code will expire in 5 minutes.
            </p>
            <p style="color: #6a6a6a; font-size: 14px; line-height: 1.5;">
              If you didn't request this code, you can safely ignore this email.
            </p>
          </div>
        `,
      });
      if (error) {
        throw error;
      }

      console.log("Email sent:", data?.id);
    } catch (error) {
      console.error("Failed to send OTP email:", error);
      throw new Error("Failed to send verification email");
    }
  },
});

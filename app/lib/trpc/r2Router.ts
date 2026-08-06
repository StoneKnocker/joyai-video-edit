import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getUploadPreSignedUrl } from "~/lib/r2/r2.server";
import { authedProcedure, router } from "./init";

/**
 * Only allow uploads under uploads/{userId}/... with no path traversal.
 */
function assertUserUploadPath(filePath: string, userId: string): string {
  const normalized = filePath.replace(/^\/+/, "");

  if (
    !normalized ||
    normalized.includes("..") ||
    normalized.includes("\\") ||
    normalized.includes("\0")
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid upload path",
    });
  }

  const prefix = `uploads/${userId}/`;
  if (!normalized.startsWith(prefix) || normalized.length <= prefix.length) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Upload path must be under your user namespace",
    });
  }

  return normalized;
}

export const r2Router = router({
  getPresignedUrl: authedProcedure
    .input(
      z.object({
        filePath: z.string().min(1).max(512),
        contentType: z
          .string()
          .min(1)
          .max(128)
          .regex(
            /^[\w.+-]+\/[\w.+-]+$/,
            "contentType must be a valid MIME type",
          ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const filePath = assertUserUploadPath(input.filePath, ctx.user.id);
      const uploadUrl = await getUploadPreSignedUrl(
        filePath,
        input.contentType,
      );
      return { uploadUrl, key: filePath };
    }),
});

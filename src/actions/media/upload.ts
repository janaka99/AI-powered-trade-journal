"use server";

import { db } from "@/drizzle/db";
import { media } from "@/drizzle/schemas/media-schema";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

type UploadMediaResult = {
  success: boolean;
  message: string;
  error?: string;
  data?: {
    id: string;
    url: string;
    filename: string;
  };
};

export async function uploadMedia(file: File): Promise<UploadMediaResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      success: false,
      message: "You must be signed in to upload media.",
      error: "UNAUTHORIZED",
    };
  }

  // Validate file
  if (!file || file.size === 0) {
    return {
      success: false,
      message: "File is required.",
      error: "EMPTY_FILE",
    };
  }

  if (!file.type.startsWith("image/")) {
    return {
      success: false,
      message: "Only image files are allowed.",
      error: "INVALID_FILE_TYPE",
    };
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      success: false,
      message: "File size must be less than 5MB.",
      error: "FILE_TOO_LARGE",
    };
  }

  try {
    const mediaId = crypto.randomUUID();

    // Convert file to base64 for storage (in production, use cloud storage like S3)
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    await db.insert(media).values({
      id: mediaId,
      userId: session.user.id,
      url: dataUrl,
      type: file.type,
      filename: file.name,
      size: String(file.size),
    });

    return {
      success: true,
      message: "Media uploaded successfully.",
      data: {
        id: mediaId,
        url: dataUrl,
        filename: file.name,
      },
    };
  } catch (error) {
    console.error("Media upload error:", error);
    return {
      success: false,
      message: "Failed to upload media. Please try again.",
      error: "UPLOAD_FAILED",
    };
  }
}

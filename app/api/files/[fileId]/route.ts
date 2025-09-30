// /app/api/files/[fileId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/db/client";
import fs from "fs/promises";
import path from "path";
import { logger } from "@/lib/logger";

/**
 * File download API handler - replaces MantisBT file_download.php
 *
 * Query params:
 * - type: "bug" (attachment) or "doc" (project document)
 * - show_inline: "1" to display inline (images, PDFs), "0" to force download
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    // Parse file ID
    const fileId = parseInt(params.fileId, 10);
    if (isNaN(fileId)) {
      return NextResponse.json({ error: "Invalid file_id" }, { status: 400 });
    }

    // Get session
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type") || "bug";
    const showInline = searchParams.get("show_inline") === "1";

    // Fetch file record based on type
    let fileRecord: any = null;
    let projectId: number | null = null;

    if (type === "bug") {
      // Bug attachment
      fileRecord = await prisma.mantis_bug_file_table.findUnique({
        where: { id: fileId },
      });

      if (!fileRecord) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }

      // Get bug to check project access
      const bug = await prisma.mantis_bug_table.findUnique({
        where: { id: fileRecord.bug_id },
        select: { project_id: true },
      });

      if (!bug || !session.projects?.includes(bug.project_id)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      projectId = bug.project_id;
    } else if (type === "doc") {
      // Project document
      fileRecord = await prisma.mantis_project_file_table.findUnique({
        where: { id: fileId },
      });

      if (!fileRecord) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }

      // Check project access
      if (!session.projects?.includes(fileRecord.project_id)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      projectId = fileRecord.project_id;
    } else {
      return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
    }

    // Extract file metadata
    const filename = fileRecord.filename;
    const filesize = fileRecord.filesize;
    let contentType = fileRecord.file_type || "application/octet-stream";
    const dateAdded = fileRecord.date_added;

    // Determine if we should show inline based on MIME type
    const mimeForceInline = [
      "application/pdf",
      "image/bmp",
      "image/gif",
      "image/jpeg",
      "image/png",
      "image/tiff",
    ];
    const mimeForceAttachment = [
      "application/x-shockwave-flash",
      "image/svg+xml", // SVG could contain CSS or scripting
      "text/html",
    ];

    // Extract base MIME type (remove charset if present)
    const baseMimeType = contentType.split(";")[0].trim();

    let shouldShowInline = showInline;
    if (mimeForceInline.includes(baseMimeType)) {
      shouldShowInline = true;
    } else if (mimeForceAttachment.includes(baseMimeType)) {
      shouldShowInline = false;
    }

    // Fetch file content - check if stored in database or on disk
    let fileContent: Buffer | null = null;

    if (fileRecord.content) {
      // File stored in database
      fileContent = Buffer.from(fileRecord.content);
    } else if (fileRecord.diskfile) {
      // File stored on disk
      try {
        // Normalize path based on MantisBT configuration
        // Default MantisBT disk path structure: uploads/project_id/filename
        const diskPath = path.join(
          process.cwd(),
          "uploads",
          projectId?.toString() || "",
          fileRecord.diskfile
        );
        fileContent = await fs.readFile(diskPath);
      } catch (fsError) {
        logger.error("Failed to read file from disk:", fsError);
        return NextResponse.json(
          { error: "File content not accessible" },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "File content not found" },
        { status: 404 }
      );
    }

    // Set headers
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Length", filesize.toString());
    headers.set("X-Content-Type-Options", "nosniff"); // Prevent MIME sniffing
    headers.set("Expires", new Date().toUTCString());
    headers.set("Last-Modified", new Date(dateAdded * 1000).toUTCString());

    // Set content disposition based on inline display preference
    if (shouldShowInline) {
      headers.set("Content-Disposition", `inline; filename="${filename}"`);
    } else {
      headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    }

    // Return file content
    if (!fileContent) {
      return NextResponse.json(
        { error: "File content is empty" },
        { status: 500 }
      );
    }

    return new Response(new Uint8Array(fileContent), {
      status: 200,
      headers,
    });
  } catch (err) {
    logger.error("File download error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
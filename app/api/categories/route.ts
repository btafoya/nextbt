// /app/api/categories/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/db/client";
import { logger } from "@/lib/logger";

// GET /api/categories?project_id=X - List categories for a project
export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const projectIdStr = searchParams.get("project_id");

    if (!projectIdStr) {
      return NextResponse.json(
        { error: "project_id is required" },
        { status: 400 }
      );
    }

    const projectId = parseInt(projectIdStr, 10);

    // Verify user has access to this project
    if (!session.projects.includes(projectId)) {
      return NextResponse.json(
        { error: "Access denied to this project" },
        { status: 403 }
      );
    }

    const categories = await prisma.mantis_category_table.findMany({
      where: { project_id: projectId },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(categories);
  } catch (err) {
    logger.error("List categories error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create new category
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const { project_id, name } = body;

    // Validate required fields
    if (!project_id || !name) {
      return NextResponse.json(
        { error: "project_id and name are required" },
        { status: 400 }
      );
    }

    // Verify user has access to this project
    if (!session.projects.includes(project_id)) {
      return NextResponse.json(
        { error: "Access denied to this project" },
        { status: 403 }
      );
    }

    // Check if category name already exists for this project
    const existing = await prisma.mantis_category_table.findFirst({
      where: {
        project_id,
        name
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: "Category name already exists for this project" },
        { status: 409 }
      );
    }

    // Create category
    const category = await prisma.mantis_category_table.create({
      data: {
        project_id,
        user_id: session.uid,
        name,
        status: 1,
      }
    });

    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    logger.error("Create category error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
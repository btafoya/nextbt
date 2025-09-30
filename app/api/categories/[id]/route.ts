export const dynamic = "force-dynamic";

// /app/api/categories/[id]/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/db/client";
import { logger } from "@/lib/logger";

// DELETE /api/categories/[id] - Delete category
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const categoryId = parseInt(params.id, 10);

    // Get category to verify ownership
    const category = await prisma.mantis_category_table.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Verify user has access to this project
    if (!session.projects.includes(category.project_id)) {
      return NextResponse.json(
        { error: "Access denied to this project" },
        { status: 403 }
      );
    }

    // Check if any issues are using this category
    const issuesUsingCategory = await prisma.mantis_bug_table.count({
      where: { category_id: categoryId }
    });

    if (issuesUsingCategory > 0) {
      return NextResponse.json(
        { error: `Cannot delete category: ${issuesUsingCategory} issues are using it` },
        { status: 409 }
      );
    }

    // Check if any projects are using this as default category
    const projectsUsingCategory = await prisma.mantis_project_table.count({
      where: { category_id: categoryId }
    });

    if (projectsUsingCategory > 0) {
      return NextResponse.json(
        { error: `Cannot delete category: ${projectsUsingCategory} projects are using it as default` },
        { status: 409 }
      );
    }

    // Delete category
    await prisma.mantis_category_table.delete({
      where: { id: categoryId }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Delete category error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/categories/[id] - Update category name
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const categoryId = parseInt(params.id, 10);
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    // Get category to verify ownership
    const category = await prisma.mantis_category_table.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Verify user has access to this project
    if (!session.projects.includes(category.project_id)) {
      return NextResponse.json(
        { error: "Access denied to this project" },
        { status: 403 }
      );
    }

    // Check if new name conflicts with existing category
    const existing = await prisma.mantis_category_table.findFirst({
      where: {
        project_id: category.project_id,
        name,
        id: { not: categoryId }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: "Category name already exists for this project" },
        { status: 409 }
      );
    }

    // Update category
    const updated = await prisma.mantis_category_table.update({
      where: { id: categoryId },
      data: { name }
    });

    return NextResponse.json(updated);
  } catch (err) {
    logger.error("Update category error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
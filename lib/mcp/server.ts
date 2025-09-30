// /lib/mcp/server.ts - MCP Server implementation for NextBT
import "server-only";
import { prisma } from "@/db/client";
import { secrets } from "@/config/secrets";

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

/**
 * MCP Server for NextBT - Exposes MantisBT data to Claude Code
 */
export class NextBTMCPServer {
  /**
   * List available tools
   */
  static getTools(): MCPTool[] {
    return [
      {
        name: "get_issues",
        description: "Get list of issues with optional filtering by status, priority, project, or handler",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "number", description: "Filter by project ID" },
            handlerUsername: { type: "string", description: "Filter by handler username" },
            status: { type: "number", description: "Filter by status (10=new, 20=feedback, 30=acknowledged, 40=confirmed, 50=assigned, 80=resolved, 90=closed)" },
            priority: { type: "number", description: "Filter by priority (10=none, 20=low, 30=normal, 40=high, 50=urgent, 60=immediate)" },
            limit: { type: "number", description: "Maximum number of issues to return (default 50)" }
          }
        }
      },
      {
        name: "get_issue_by_id",
        description: "Get detailed information about a specific issue by ID",
        inputSchema: {
          type: "object",
          properties: {
            issueId: { type: "number", description: "Issue ID" }
          },
          required: ["issueId"]
        }
      },
      {
        name: "get_user_issues",
        description: "Get issues assigned to a specific user",
        inputSchema: {
          type: "object",
          properties: {
            username: { type: "string", description: "Username to filter by" },
            includeResolved: { type: "boolean", description: "Include resolved/closed issues (default false)" },
            limit: { type: "number", description: "Maximum number of issues (default 50)" }
          },
          required: ["username"]
        }
      },
      {
        name: "get_user_by_username",
        description: "Get user details by username",
        inputSchema: {
          type: "object",
          properties: {
            username: { type: "string", description: "Username to look up" }
          },
          required: ["username"]
        }
      },
      {
        name: "create_issue",
        description: "Create a new issue in MantisBT",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "number", description: "Project ID" },
            summary: { type: "string", description: "Issue summary/title" },
            description: { type: "string", description: "Detailed description" },
            category: { type: "string", description: "Category name (default 'General')" },
            priority: { type: "number", description: "Priority level (default 30=normal)" },
            severity: { type: "number", description: "Severity level (default 50=minor)" },
            reproducibility: { type: "number", description: "Reproducibility (default 70=have not tried)" }
          },
          required: ["projectId", "summary", "description"]
        }
      },
      {
        name: "add_note",
        description: "Add a note/comment to an existing issue",
        inputSchema: {
          type: "object",
          properties: {
            issueId: { type: "number", description: "Issue ID" },
            note: { type: "string", description: "Note text" },
            userId: { type: "number", description: "User ID adding the note" }
          },
          required: ["issueId", "note", "userId"]
        }
      },
      {
        name: "get_projects",
        description: "Get list of all projects",
        inputSchema: {
          type: "object",
          properties: {
            enabled: { type: "boolean", description: "Filter by enabled status (default true)" }
          }
        }
      },
      {
        name: "set_issue_status",
        description: "Update the status of an issue",
        inputSchema: {
          type: "object",
          properties: {
            issueId: { type: "number", description: "Issue ID" },
            status: { type: "number", description: "New status (10=new, 20=feedback, 30=acknowledged, 40=confirmed, 50=assigned, 80=resolved, 90=closed)" },
            resolution: { type: "number", description: "Resolution if status is 80 or 90 (10=open, 20=fixed, 30=reopened, 40=unable to reproduce, 50=not fixable, 60=duplicate, 70=no change required, 80=suspended, 90=won't fix)" }
          },
          required: ["issueId", "status"]
        }
      }
    ];
  }

  /**
   * List available resources
   */
  static getResources(): MCPResource[] {
    return [
      {
        uri: "nextbt://issues/recent",
        name: "Recent Issues",
        description: "List of recently updated issues",
        mimeType: "application/json"
      },
      {
        uri: "nextbt://issues/open",
        name: "Open Issues",
        description: "List of all open issues",
        mimeType: "application/json"
      },
      {
        uri: "nextbt://projects",
        name: "Projects List",
        description: "List of all projects",
        mimeType: "application/json"
      }
    ];
  }

  /**
   * Execute a tool call
   */
  static async executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    switch (name) {
      case "get_issues":
        return this.getIssues(args);
      case "get_issue_by_id":
        return this.getIssueById(args.issueId as number);
      case "get_user_issues":
        return this.getUserIssues(args.username as string, args.includeResolved as boolean, args.limit as number);
      case "get_user_by_username":
        return this.getUserByUsername(args.username as string);
      case "create_issue":
        return this.createIssue(args);
      case "add_note":
        return this.addNote(args.issueId as number, args.note as string, args.userId as number);
      case "get_projects":
        return this.getProjects(args.enabled as boolean);
      case "set_issue_status":
        return this.setIssueStatus(args.issueId as number, args.status as number, args.resolution as number);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  /**
   * Read a resource
   */
  static async readResource(uri: string): Promise<unknown> {
    switch (uri) {
      case "nextbt://issues/recent":
        return this.getIssues({ limit: 50 });
      case "nextbt://issues/open":
        return this.getIssues({ status: 50, limit: 100 });
      case "nextbt://projects":
        return this.getProjects(true);
      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  }

  // Tool implementations

  private static async getIssues(args: Record<string, unknown>) {
    const where: Record<string, unknown> = {};

    if (args.projectId) where.project_id = args.projectId;
    if (args.status) where.status = args.status;
    if (args.priority) where.priority = args.priority;

    if (args.handlerUsername) {
      const user = await prisma.mantis_user_table.findFirst({
        where: { username: args.handlerUsername as string }
      });
      if (user) where.handler_id = user.id;
    }

    const issues = await prisma.mantis_bug_table.findMany({
      where,
      take: (args.limit as number) || 50,
      orderBy: { last_updated: 'desc' },
      include: {
        project: true,
        handler: { select: { id: true, username: true, realname: true } },
        reporter: { select: { id: true, username: true, realname: true } },
        text: true
      }
    });

    return {
      count: issues.length,
      issues: issues.map(issue => ({
        id: issue.id,
        project: issue.project?.name,
        summary: issue.summary,
        status: issue.status,
        priority: issue.priority,
        severity: issue.severity,
        handler: issue.handler?.username,
        reporter: issue.reporter?.username,
        created: new Date(issue.date_submitted * 1000).toISOString(),
        updated: new Date(issue.last_updated * 1000).toISOString()
      }))
    };
  }

  private static async getIssueById(issueId: number) {
    const issue = await prisma.mantis_bug_table.findUnique({
      where: { id: issueId },
      include: {
        project: true,
        handler: { select: { id: true, username: true, realname: true, email: true } },
        reporter: { select: { id: true, username: true, realname: true, email: true } },
        text: true,
        notes: {
          include: {
            text: true,
            reporter: { select: { username: true, realname: true } }
          },
          orderBy: { date_submitted: 'asc' }
        }
      }
    });

    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    return {
      id: issue.id,
      project: { id: issue.project?.id, name: issue.project?.name },
      summary: issue.summary,
      description: issue.text?.description,
      steps_to_reproduce: issue.text?.steps_to_reproduce,
      additional_information: issue.text?.additional_information,
      status: issue.status,
      priority: issue.priority,
      severity: issue.severity,
      reproducibility: issue.reproducibility,
      handler: issue.handler ? {
        id: issue.handler.id,
        username: issue.handler.username,
        realname: issue.handler.realname,
        email: issue.handler.email
      } : null,
      reporter: {
        id: issue.reporter.id,
        username: issue.reporter.username,
        realname: issue.reporter.realname,
        email: issue.reporter.email
      },
      created: new Date(issue.date_submitted * 1000).toISOString(),
      updated: new Date(issue.last_updated * 1000).toISOString(),
      notes: issue.notes.map(note => ({
        id: note.id,
        reporter: note.reporter.username,
        text: note.text?.note,
        created: new Date(note.date_submitted * 1000).toISOString()
      }))
    };
  }

  private static async getUserIssues(username: string, includeResolved = false, limit = 50) {
    const user = await prisma.mantis_user_table.findFirst({
      where: { username }
    });

    if (!user) {
      throw new Error(`User ${username} not found`);
    }

    const where: Record<string, unknown> = { handler_id: user.id };

    if (!includeResolved) {
      where.status = { notIn: [80, 90] }; // Exclude resolved (80) and closed (90)
    }

    const issues = await prisma.mantis_bug_table.findMany({
      where,
      take: limit,
      orderBy: { last_updated: 'desc' },
      include: {
        project: true,
        text: true
      }
    });

    return {
      username,
      userId: user.id,
      count: issues.length,
      issues: issues.map(issue => ({
        id: issue.id,
        project: issue.project?.name,
        summary: issue.summary,
        description: issue.text?.description?.substring(0, 200),
        status: issue.status,
        priority: issue.priority,
        created: new Date(issue.date_submitted * 1000).toISOString(),
        updated: new Date(issue.last_updated * 1000).toISOString()
      }))
    };
  }

  private static async getUserByUsername(username: string) {
    const user = await prisma.mantis_user_table.findFirst({
      where: { username },
      select: {
        id: true,
        username: true,
        realname: true,
        email: true,
        access_level: true,
        enabled: true,
        date_created: true,
        last_visit: true
      }
    });

    if (!user) {
      throw new Error(`User ${username} not found`);
    }

    return {
      id: user.id,
      username: user.username,
      realname: user.realname,
      email: user.email,
      accessLevel: user.access_level,
      enabled: user.enabled,
      created: new Date(user.date_created * 1000).toISOString(),
      lastVisit: user.last_visit ? new Date(user.last_visit * 1000).toISOString() : null
    };
  }

  private static async createIssue(args: Record<string, unknown>) {
    const now = Math.floor(Date.now() / 1000);

    // Create bug text entry first
    const bugText = await prisma.mantis_bug_text_table.create({
      data: {
        description: args.description as string,
        steps_to_reproduce: "",
        additional_information: ""
      }
    });

    // Create the issue
    const issue = await prisma.mantis_bug_table.create({
      data: {
        project_id: args.projectId as number,
        reporter_id: 1, // TODO: Get from session
        handler_id: 0,
        priority: (args.priority as number) || 30,
        severity: (args.severity as number) || 50,
        reproducibility: (args.reproducibility as number) || 70,
        status: 10, // New
        resolution: 10, // Open
        projection: 10,
        category_id: 1, // TODO: Look up category
        date_submitted: now,
        last_updated: now,
        summary: args.summary as string,
        bug_text_id: bugText.id,
        view_state: 10, // Public
        sponsorship_total: 0,
        sticky: 0,
        target_version: ""
      }
    });

    return {
      id: issue.id,
      summary: issue.summary,
      status: issue.status,
      created: new Date(issue.date_submitted * 1000).toISOString()
    };
  }

  private static async addNote(issueId: number, noteText: string, userId: number) {
    const now = Math.floor(Date.now() / 1000);

    // Create note text
    const bugnoteText = await prisma.mantis_bugnote_text_table.create({
      data: { note: noteText }
    });

    // Create note
    const note = await prisma.mantis_bugnote_table.create({
      data: {
        bug_id: issueId,
        reporter_id: userId,
        bugnote_text_id: bugnoteText.id,
        view_state: 10, // Public
        note_type: 0,
        note_attr: "",
        time_tracking: 0,
        date_submitted: now,
        last_modified: now
      }
    });

    // Update issue last_updated
    await prisma.mantis_bug_table.update({
      where: { id: issueId },
      data: { last_updated: now }
    });

    return {
      id: note.id,
      issueId,
      created: new Date(note.date_submitted * 1000).toISOString()
    };
  }

  private static async getProjects(enabled = true) {
    const projects = await prisma.mantis_project_table.findMany({
      where: enabled ? { enabled: 1 } : undefined,
      select: {
        id: true,
        name: true,
        description: true,
        enabled: true,
        view_state: true
      },
      orderBy: { name: 'asc' }
    });

    return {
      count: projects.length,
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        enabled: p.enabled === 1,
        viewState: p.view_state
      }))
    };
  }

  private static async setIssueStatus(issueId: number, status: number, resolution?: number) {
    const now = Math.floor(Date.now() / 1000);

    const updateData: Record<string, unknown> = {
      status,
      last_updated: now
    };

    // If status is resolved (80) or closed (90), set resolution
    if ((status === 80 || status === 90) && resolution) {
      updateData.resolution = resolution;
    }

    const issue = await prisma.mantis_bug_table.update({
      where: { id: issueId },
      data: updateData
    });

    return {
      id: issue.id,
      summary: issue.summary,
      status: issue.status,
      resolution: issue.resolution,
      updated: new Date(issue.last_updated * 1000).toISOString()
    };
  }

  /**
   * Validate Bearer token
   */
  static validateToken(token: string): boolean {
    return token === secrets.mcpRemoteAuthKey;
  }
}
// /lib/api-docs.ts
import swaggerJsdoc from 'swagger-jsdoc';

/**
 * OpenAPI Specification for NextBT API
 *
 * This specification documents all REST API endpoints available in NextBT,
 * including authentication, issues, projects, users, and MCP integration.
 */
export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NextBT API',
      version: '1.0.0',
      description: 'NextBT REST API for MantisBT 2.x bug tracking system. Provides simplified access to issues, projects, users, and administrative functions.',
      contact: {
        name: 'NextBT Development Team',
        url: 'https://github.com/btafoya/nextbt',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://nextbt.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'nextbt_session',
          description: 'Encrypted iron-session cookie for authentication',
        },
      },
      schemas: {
        // Common schemas
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
          required: ['error'],
        },
        Success: {
          type: 'object',
          properties: {
            ok: {
              type: 'boolean',
              description: 'Operation success status',
            },
          },
          required: ['ok'],
        },
        // Authentication
        LoginRequest: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              description: 'MantisBT username',
            },
            password: {
              type: 'string',
              description: 'MantisBT password',
            },
            turnstileToken: {
              type: 'string',
              description: 'Cloudflare Turnstile verification token (if enabled)',
            },
          },
          required: ['username', 'password'],
        },
        // Issue schemas
        Issue: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Issue ID',
            },
            summary: {
              type: 'string',
              description: 'Issue summary/title',
            },
            description: {
              type: 'string',
              description: 'Detailed description',
            },
            steps_to_reproduce: {
              type: 'string',
              description: 'Steps to reproduce the issue',
            },
            additional_information: {
              type: 'string',
              description: 'Additional context',
            },
            status: {
              type: 'integer',
              description: 'Status code (10=new, 20=feedback, 30=acknowledged, 40=confirmed, 50=assigned, 80=resolved, 90=closed)',
            },
            priority: {
              type: 'integer',
              description: 'Priority code (10=none, 20=low, 30=normal, 40=high, 50=urgent, 60=immediate)',
            },
            severity: {
              type: 'integer',
              description: 'Severity code (10=feature, 20=trivial, 30=text, 40=tweak, 50=minor, 60=major, 70=crash, 80=block)',
            },
            reproducibility: {
              type: 'integer',
              description: 'Reproducibility code (10=always, 30=sometimes, 50=random, 70=unable, 90=N/A)',
            },
            project_id: {
              type: 'integer',
              description: 'Project ID',
            },
            reporter_id: {
              type: 'integer',
              description: 'Reporter user ID',
            },
            handler_id: {
              type: 'integer',
              nullable: true,
              description: 'Assigned handler user ID',
            },
            category_id: {
              type: 'integer',
              description: 'Category ID',
            },
            date_submitted: {
              type: 'integer',
              description: 'Unix timestamp when submitted',
            },
            last_updated: {
              type: 'integer',
              description: 'Unix timestamp of last update',
            },
            view_state: {
              type: 'integer',
              description: 'Visibility (10=public, 50=private)',
            },
            project: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Project name',
                },
              },
            },
          },
        },
        CreateIssueRequest: {
          type: 'object',
          properties: {
            project_id: {
              type: 'integer',
              description: 'Project ID',
            },
            category_id: {
              type: 'integer',
              description: 'Category ID',
            },
            summary: {
              type: 'string',
              description: 'Issue summary/title',
            },
            description: {
              type: 'string',
              description: 'Detailed description',
            },
            steps_to_reproduce: {
              type: 'string',
              description: 'Steps to reproduce',
            },
            additional_information: {
              type: 'string',
              description: 'Additional context',
            },
            priority: {
              type: 'integer',
              description: 'Priority code',
            },
            severity: {
              type: 'integer',
              description: 'Severity code',
            },
            reproducibility: {
              type: 'integer',
              description: 'Reproducibility code',
            },
            view_state: {
              type: 'integer',
              description: 'Visibility (10=public, 50=private)',
            },
          },
          required: ['project_id', 'category_id', 'summary', 'description'],
        },
        // Project schemas
        Project: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Project ID',
            },
            name: {
              type: 'string',
              description: 'Project name',
            },
            description: {
              type: 'string',
              description: 'Project description',
            },
            status: {
              type: 'integer',
              description: 'Project status (10=development, 30=release, 50=stable, 70=obsolete)',
            },
            view_state: {
              type: 'integer',
              description: 'Visibility (10=public, 50=private)',
            },
            enabled: {
              type: 'integer',
              description: 'Enabled flag (0=disabled, 1=enabled)',
            },
          },
        },
        // User schemas
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID',
            },
            username: {
              type: 'string',
              description: 'Username',
            },
            realname: {
              type: 'string',
              description: 'Real name',
            },
            email: {
              type: 'string',
              description: 'Email address',
            },
            access_level: {
              type: 'integer',
              description: 'Access level (10=viewer, 25=reporter, 40=updater, 55=developer, 70=manager, 90=administrator)',
            },
            enabled: {
              type: 'integer',
              description: 'Account enabled flag (0=disabled, 1=enabled)',
            },
          },
        },
        // Note schemas
        BugNote: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Note ID',
            },
            bug_id: {
              type: 'integer',
              description: 'Associated issue ID',
            },
            reporter_id: {
              type: 'integer',
              description: 'Note author user ID',
            },
            text: {
              type: 'string',
              description: 'Note content (HTML)',
            },
            view_state: {
              type: 'integer',
              description: 'Visibility (10=public, 50=private)',
            },
            date_submitted: {
              type: 'integer',
              description: 'Unix timestamp when submitted',
            },
            last_modified: {
              type: 'integer',
              description: 'Unix timestamp of last modification',
            },
            reporter: {
              type: 'object',
              properties: {
                username: {
                  type: 'string',
                  description: 'Author username',
                },
                realname: {
                  type: 'string',
                  description: 'Author real name',
                },
              },
            },
          },
        },
        CreateNoteRequest: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Note content (HTML)',
            },
            view_state: {
              type: 'integer',
              description: 'Visibility (10=public, 50=private)',
              default: 10,
            },
          },
          required: ['text'],
        },
        // Category schemas
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Category ID',
            },
            name: {
              type: 'string',
              description: 'Category name',
            },
            project_id: {
              type: 'integer',
              description: 'Project ID',
            },
          },
        },
        // MCP schemas
        MCPTool: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Tool name',
            },
            description: {
              type: 'string',
              description: 'Tool description',
            },
            inputSchema: {
              type: 'object',
              description: 'JSON schema for tool input',
            },
          },
        },
        MCPResource: {
          type: 'object',
          properties: {
            uri: {
              type: 'string',
              description: 'Resource URI',
            },
            name: {
              type: 'string',
              description: 'Resource name',
            },
            description: {
              type: 'string',
              description: 'Resource description',
            },
            mimeType: {
              type: 'string',
              description: 'Resource MIME type',
            },
          },
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management',
      },
      {
        name: 'Issues',
        description: 'Bug/issue tracking operations',
      },
      {
        name: 'Projects',
        description: 'Project management operations',
      },
      {
        name: 'Users',
        description: 'User management operations',
      },
      {
        name: 'Notes',
        description: 'Issue notes/comments operations',
      },
      {
        name: 'Categories',
        description: 'Category management operations',
      },
      {
        name: 'Files',
        description: 'File attachment operations',
      },
      {
        name: 'MCP',
        description: 'Model Context Protocol integration',
      },
      {
        name: 'AI',
        description: 'AI writing assistance',
      },
      {
        name: 'Profile',
        description: 'User profile management',
      },
    ],
  },
  apis: [], // We'll use manual specification instead of JSDoc comments
});

/**
 * Complete API paths specification
 *
 * This manually defines all API endpoints with their parameters, request bodies,
 * and responses to provide comprehensive documentation.
 */
export const apiPaths = {
  '/api/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'User login',
      description: 'Authenticates user with MantisBT credentials and creates encrypted session',
      operationId: 'login',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/LoginRequest',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Login successful',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Success',
              },
            },
          },
        },
        '400': {
          description: 'Bad request (missing credentials or verification failed)',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '401': {
          description: 'Authentication failed (invalid credentials)',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ok: {
                    type: 'boolean',
                    example: false,
                  },
                },
              },
            },
          },
        },
        '500': {
          description: 'Server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
      security: [], // Login doesn't require authentication
    },
  },
  '/api/auth/logout': {
    post: {
      tags: ['Authentication'],
      summary: 'User logout',
      description: 'Destroys encrypted session and redirects to login',
      operationId: 'logout',
      responses: {
        '302': {
          description: 'Redirect to login page',
        },
      },
    },
    get: {
      tags: ['Authentication'],
      summary: 'User logout (GET method)',
      description: 'Destroys encrypted session and redirects to login',
      operationId: 'logoutGet',
      responses: {
        '302': {
          description: 'Redirect to login page',
        },
      },
    },
  },
  '/api/issues': {
    get: {
      tags: ['Issues'],
      summary: 'List issues',
      description: 'Get paginated list of issues for authorized projects',
      operationId: 'listIssues',
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Page number (1-indexed)',
          schema: {
            type: 'integer',
            default: 1,
          },
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Items per page',
          schema: {
            type: 'integer',
            default: 50,
            maximum: 100,
          },
        },
        {
          name: 'project_id',
          in: 'query',
          description: 'Filter by project ID',
          schema: {
            type: 'integer',
          },
        },
        {
          name: 'status',
          in: 'query',
          description: 'Filter by status',
          schema: {
            type: 'integer',
          },
        },
      ],
      responses: {
        '200': {
          description: 'List of issues',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  issues: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Issue',
                    },
                  },
                  total: {
                    type: 'integer',
                    description: 'Total count of issues',
                  },
                  page: {
                    type: 'integer',
                    description: 'Current page number',
                  },
                  limit: {
                    type: 'integer',
                    description: 'Items per page',
                  },
                },
              },
            },
          },
        },
        '401': {
          description: 'Not authenticated',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '500': {
          description: 'Server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Issues'],
      summary: 'Create issue',
      description: 'Create new issue in authorized project',
      operationId: 'createIssue',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateIssueRequest',
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Issue created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    description: 'Created issue ID',
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Bad request (validation error)',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '401': {
          description: 'Not authenticated',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '403': {
          description: 'Not authorized for project',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '500': {
          description: 'Server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
  },
  '/api/issues/{id}': {
    get: {
      tags: ['Issues'],
      summary: 'Get issue by ID',
      description: 'Get detailed issue information',
      operationId: 'getIssue',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Issue ID',
          schema: {
            type: 'integer',
          },
        },
      ],
      responses: {
        '200': {
          description: 'Issue details',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Issue',
              },
            },
          },
        },
        '401': {
          description: 'Not authenticated',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '403': {
          description: 'Not authorized to view issue',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '404': {
          description: 'Issue not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '500': {
          description: 'Server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    patch: {
      tags: ['Issues'],
      summary: 'Update issue',
      description: 'Update issue fields',
      operationId: 'updateIssue',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Issue ID',
          schema: {
            type: 'integer',
          },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                summary: {
                  type: 'string',
                },
                description: {
                  type: 'string',
                },
                status: {
                  type: 'integer',
                },
                priority: {
                  type: 'integer',
                },
                handler_id: {
                  type: 'integer',
                  nullable: true,
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Issue updated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Success',
              },
            },
          },
        },
        '400': {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '401': {
          description: 'Not authenticated',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '403': {
          description: 'Not authorized to update issue',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '404': {
          description: 'Issue not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '500': {
          description: 'Server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    delete: {
      tags: ['Issues'],
      summary: 'Delete issue',
      description: 'Delete issue (admin only)',
      operationId: 'deleteIssue',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Issue ID',
          schema: {
            type: 'integer',
          },
        },
      ],
      responses: {
        '200': {
          description: 'Issue deleted successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Success',
              },
            },
          },
        },
        '401': {
          description: 'Not authenticated',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '403': {
          description: 'Admin access required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '404': {
          description: 'Issue not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '500': {
          description: 'Server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
  },
  '/api/issues/{id}/notes': {
    get: {
      tags: ['Notes'],
      summary: 'List issue notes',
      description: 'Get all notes/comments for an issue',
      operationId: 'listNotes',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Issue ID',
          schema: {
            type: 'integer',
          },
        },
      ],
      responses: {
        '200': {
          description: 'List of notes',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/BugNote',
                },
              },
            },
          },
        },
        '401': {
          description: 'Not authenticated',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '403': {
          description: 'Not authorized to view issue',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '404': {
          description: 'Issue not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '500': {
          description: 'Server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Notes'],
      summary: 'Add note to issue',
      description: 'Create new note/comment on issue',
      operationId: 'createNote',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Issue ID',
          schema: {
            type: 'integer',
          },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateNoteRequest',
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Note created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    description: 'Created note ID',
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '401': {
          description: 'Not authenticated',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '403': {
          description: 'Not authorized to add note',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '404': {
          description: 'Issue not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '500': {
          description: 'Server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
  },
  '/api/projects': {
    get: {
      tags: ['Projects'],
      summary: 'List projects',
      description: 'Get all projects accessible to current user',
      operationId: 'listProjects',
      responses: {
        '200': {
          description: 'List of projects',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Project',
                },
              },
            },
          },
        },
        '401': {
          description: 'Not authenticated',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '500': {
          description: 'Server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
  },
  '/api/users': {
    get: {
      tags: ['Users'],
      summary: 'List users',
      description: 'Get all active users (admin only)',
      operationId: 'listUsers',
      responses: {
        '200': {
          description: 'List of users',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
        },
        '401': {
          description: 'Not authenticated',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '403': {
          description: 'Admin access required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '500': {
          description: 'Server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
  },
  '/api/users/assignable': {
    get: {
      tags: ['Users'],
      summary: 'List assignable users',
      description: 'Get users who can be assigned to issues in specified project',
      operationId: 'listAssignableUsers',
      parameters: [
        {
          name: 'project_id',
          in: 'query',
          required: true,
          description: 'Project ID',
          schema: {
            type: 'integer',
          },
        },
      ],
      responses: {
        '200': {
          description: 'List of assignable users',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
        },
        '400': {
          description: 'Bad request (missing project_id)',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '401': {
          description: 'Not authenticated',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '500': {
          description: 'Server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
  },
  '/api/mcp/tools': {
    get: {
      tags: ['MCP'],
      summary: 'List MCP tools',
      description: 'Get available Model Context Protocol tools',
      operationId: 'listMCPTools',
      responses: {
        '200': {
          description: 'List of MCP tools',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/MCPTool',
                },
              },
            },
          },
        },
        '401': {
          description: 'Not authenticated',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '500': {
          description: 'Server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['MCP'],
      summary: 'Call MCP tool',
      description: 'Execute MCP tool with parameters',
      operationId: 'callMCPTool',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Tool name',
                },
                arguments: {
                  type: 'object',
                  description: 'Tool arguments',
                },
              },
              required: ['name'],
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Tool execution result',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  content: {
                    type: 'array',
                    items: {
                      type: 'object',
                    },
                    description: 'Tool output',
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '401': {
          description: 'Not authenticated',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '500': {
          description: 'Server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
  },
  '/api/mcp/resources': {
    get: {
      tags: ['MCP'],
      summary: 'List MCP resources',
      description: 'Get available Model Context Protocol resources',
      operationId: 'listMCPResources',
      responses: {
        '200': {
          description: 'List of MCP resources',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/MCPResource',
                },
              },
            },
          },
        },
        '401': {
          description: 'Not authenticated',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '500': {
          description: 'Server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['MCP'],
      summary: 'Read MCP resource',
      description: 'Read MCP resource by URI',
      operationId: 'readMCPResource',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                uri: {
                  type: 'string',
                  description: 'Resource URI',
                },
              },
              required: ['uri'],
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Resource content',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  contents: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        uri: {
                          type: 'string',
                        },
                        mimeType: {
                          type: 'string',
                        },
                        text: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '401': {
          description: 'Not authenticated',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        '500': {
          description: 'Server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
  },
};

// Merge paths into specification
(swaggerSpec as any).paths = apiPaths;
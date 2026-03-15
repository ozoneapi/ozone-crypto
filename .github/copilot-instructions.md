# Copilot Instructions for [PROJECT_NAME]

## Project Overview

[Provide a concise project overview that helps agents understand the context. This should align with your overview.md but be more focused on what agents need to know for code generation and assistance.]

Example:
> The [PROJECT_NAME] is a TypeScript library for managing user authentication and authorization. It provides JWT-based authentication, OAuth integration, role-based access control, and session management for web applications.

## Agent Workflow

This repository follows the agentic workflow pattern. Key directories:

- `agent-workflow/overview/` - Project vision, features, and architecture
- `agent-workflow/features/` - Individual feature specifications with acceptance criteria
- `agent-workflow/plan/` - Implementation plans and roadmaps
- `agent-workflow/defects/` - Bug reports and issue tracking
- `agent-workflow/rules/` - Project-specific agent rules and guidelines

### Workflow Stages

When working on this project, follow these stages:

1. **Review Constitution and Overview** - Read `.github/copilot-constitution.mdc` and `agent-workflow/overview/overview.md` to understand project constraints and vision
2. **Generate Features** - Derive feature specifications from overview documents
3. **Review Features** - Validate feature specifications are complete, testable, and aligned with overview
4. **Plan Implementation** - Create implementation plans with steps, risks, and testing approach
5. **Implement** - Write code following quality standards and architectural principles
6. **Test and Validate** - Ensure tests pass and acceptance criteria are met

## Development Workflow

### Build & Run

[Provide commands for common development tasks]

Example:
```bash
# Install dependencies
yarn install

# Build the project
yarn build

# Run in development mode
yarn dev

# Run tests
yarn test

# Lint code
yarn lint

# Format code
yarn format
```

### Testing

[Describe testing approach and requirements]

Example:
- All new features MUST include tests
- Tests MUST cover happy path and error cases
- Run `yarn test` before submitting changes
- Maintain or improve code coverage
- Integration tests in `tests/integration/`
- Unit tests co-located with source files

### Code Generation

When generating code:
- Follow existing patterns in the codebase
- Use TypeScript strict mode
- Include JSDoc comments for public APIs
- Handle errors appropriately
- Add tests for new functionality
- Update documentation if needed

## Code Conventions

[Define project-specific code conventions]

Example:

### TypeScript Style
- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use explicit return types for functions
- Avoid `any` type unless absolutely necessary
- Use meaningful variable and function names

### File Organization
- One class/interface per file (with exceptions for small related types)
- Group related functionality in directories
- Export public API from index files
- Keep files under 300 lines when possible

### Naming Conventions
- PascalCase for classes and interfaces
- camelCase for functions and variables
- UPPER_SNAKE_CASE for constants
- Prefix interfaces with 'I' only if ambiguous
- Use descriptive names over abbreviations

### Error Handling
- Use custom error classes for domain errors
- Always provide error messages
- Log errors at appropriate levels
- Don't swallow errors silently
- Validate inputs at API boundaries

## Key Files & Directories

[Document important files and their purposes]

Example:

```
src/
├── api/              # REST API routes and controllers
├── services/         # Business logic services
├── models/           # Data models and types
├── middleware/       # Express middleware
├── utils/            # Utility functions
├── config/           # Configuration management
└── index.ts          # Main entry point

tests/
├── unit/             # Unit tests
├── integration/      # Integration tests
└── fixtures/         # Test data and mocks

docs/
├── api/              # API documentation
└── guides/           # User guides and tutorials
```

### Critical Files
- `src/index.ts` - Main library entry point, exports public API
- `src/config/index.ts` - Configuration management
- `src/services/auth.service.ts` - Core authentication logic
- `src/middleware/auth.middleware.ts` - Request authentication

## Dependencies & Integration Points

[Document key dependencies and how they're used]

Example:

### Core Dependencies
- **express** - Web framework for API endpoints
- **jsonwebtoken** - JWT token generation and validation
- **passport** - Authentication middleware
- **typeorm** - Database ORM
- **zod** - Schema validation
- **winston** - Logging

### External Services
- **OAuth Providers** - Google, GitHub, Microsoft authentication
- **PostgreSQL** - Primary data store for users and sessions
- **Redis** (optional) - Session storage for high-traffic deployments

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for signing JWT tokens
- `OAUTH_CLIENT_ID` - OAuth application ID
- `OAUTH_CLIENT_SECRET` - OAuth application secret

## Common Tasks

[Provide guidance for common development tasks]

### Adding a New Feature

1. Check if feature file exists in `agent-workflow/features/`
2. Review acceptance criteria and technical notes
3. Create implementation plan if complex
4. Write tests first (TDD approach)
5. Implement feature following existing patterns
6. Update documentation
7. Run full test suite
8. Submit for review

### Adding a New API Endpoint

1. Define route in `src/api/routes/`
2. Create controller in `src/api/controllers/`
3. Add request/response validation with Zod
4. Implement service logic in `src/services/`
5. Add authentication/authorization middleware if needed
6. Write integration tests
7. Update OpenAPI documentation

### Fixing a Bug

1. Check if defect file exists in `agent-workflow/defects/`
2. Write a failing test that reproduces the bug
3. Fix the bug with minimal changes
4. Ensure test passes
5. Run full test suite
6. Update defect file with resolution

### Refactoring Code

1. Ensure test coverage is adequate
2. Make small, incremental changes
3. Run tests after each change
4. Preserve public API unless explicitly changing it
5. Update documentation if behavior changes
6. Consider backward compatibility

## Agent-Specific Guidance

### When Generating Features from Overview

- Extract each distinct capability as a separate feature
- Include user stories in "As a [persona], I want [goal], so that [benefit]" format
- Define testable acceptance criteria
- Keep features focused and independently implementable
- Reference overview sections for context

### When Reviewing Feature Files

- Verify feature aligns with overview and constitution
- Check that acceptance criteria are testable
- Ensure user stories have clear value proposition
- Look for missing edge cases or error conditions
- Flag dependencies between features

### When Implementing Features

- Review feature file and acceptance criteria first
- Follow minimal-change principle
- Preserve existing functionality
- Write tests that validate acceptance criteria
- Update documentation alongside code
- Use existing patterns and conventions

---

*This file should be updated as the project evolves. Focus on information that helps agents understand the project context and make good decisions when generating or modifying code.*

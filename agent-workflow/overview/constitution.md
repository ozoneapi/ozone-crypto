---
description: Constitutional governance for ozone-crypto, referencing shared governance from the Ozone Agents repository.
---

# ozone-crypto Constitution

## Purpose

This constitution defines project-specific governance for ozone-crypto and references shared governance patterns from the [Ozone Agents repository](https://github.com/ozone-api/agents).

## Inheritance

This project inherits governance from:
- **Ozone Agents Constitution**: `/usr/o3/agents/constitution.mdc`
  - Defines artifact types (rules, skills, workflows)
  - Establishes quality expectations
  - Provides change management guidelines
  - See: [Ozone Agents Constitution](https://github.com/ozone-api/agents/blob/main/constitution.mdc)
- **Constitutional Rules**: `/usr/o3/agents/rules/constitution/`
  - **Generation Guidelines**: `/usr/o3/agents/rules/constitution/0-generation-guidelines.mdc`
  - **Plan Execution**: `/usr/o3/agents/rules/constitution/follow-plan-strictly.mdc`

All rules defined in the parent constitution and constitutional rules apply unless explicitly overridden below.

## Project Scope

The ozone-crypto project provides cryptographic utilities and primitives for use in Ozone API projects and as a public library.

It includes implementations for the basic JWS and JWE operations (sign, verify, decode, encrypt, decrypt) and utilities for JWKS publishing.

The target users are developers building applications that require a simple common library to deal with cryptographic operations in the context of Open Finance and API security.

## Project-Specific Governance

### Agent Workflow

This project follows the agentic workflow pattern defined in `/usr/o3/agents/workflow/`:
- Stage 1: Review constitution and overview
- Stage 2: Generate features from overview
- Stage 3: Review feature files
- Stage 4+: Implementation and validation

For detailed workflow stages, see: [Ozone Agents Workflow](https://github.com/ozone-api/agents/tree/main/workflow)

### Directory Structure

Following the standard structure:
```
agent-workflow/
├── overview/          # Project overviews and vision
├── features/          # Feature specifications  
├── plan/             # Implementation plans
├── defects/          # Bug reports and issues
└── rules/            # Project-specific agent rules
```

## Project-Specific Rules

### Technology-Specific Rules

This project uses the following shared rules from `/usr/o3/agents/rules/`:

- TypeScript: `/usr/o3/agents/rules/typescript/`
  - General TypeScript standards
  - Structure and boundaries
  - Testing and change safety
- Bash: `/usr/o3/agents/rules/bash/`
  - For build and deployment scripts
- Testing: `/usr/o3/agents/rules/jest-testing-patterns.mdc`
- Git workflow: `/usr/o3/agents/rules/gitflow.mdc`

### Custom Project Rules

#### Cryptographic Safety

Code handling cryptographic operations MUST:
- Use well-established libraries (never implement custom crypto algorithms)
- Validate all cryptographic inputs
- Handle key material securely (never log keys or secrets)
- Use constant-time comparisons for security-sensitive operations
- Follow OWASP cryptographic storage guidelines

#### Security Standards

- All JWT operations MUST validate signatures and expiration
- Private keys MUST NOT be committed to the repository
- Key generation MUST use cryptographically secure random sources
- Certificate validation MUST check expiration and trust chains

## Architectural Principles

- **Security by Design**: All operations assume untrusted inputs
- **Minimal Crypto Logic**: Delegate to established libraries, focus on integration
- **API-First Design**: Clear, type-safe interfaces for all operations
- **Separation of Concerns**: Distinct modules for JWT, certificates, key management
- **Backward Compatibility**: API contracts maintained with semantic versioning

## Quality Expectations

This project follows the quality expectations defined in the Ozone Agents constitution with these additions:

### Code Quality

TypeScript code MUST:
- Use strict type checking
- Export clear, well-documented public APIs
- Handle errors explicitly (no silent failures)
- Include JSDoc for all public functions

### Testing Requirements

Tests MUST:
- Cover all cryptographic operations with valid and invalid inputs
- Test edge cases (expired tokens, malformed certificates, etc.)
- Achieve minimum 90% code coverage for critical paths
- Include integration tests for certificate and JWKS publishing

### Documentation Standards

Documentation MUST:
- Include examples for all public APIs
- Document security implications and best practices
- Provide migration guides for breaking changes
- Include references to relevant RFCs and standards

## Integration Points

### External Dependencies

External crypto libraries are used (node-jose, jsonwebtoken, etc.). This project builds minimum additional capability and attempts to keep cryptographic logic minimal and focused on integration and usability rather than implementing new algorithms.

### API Contracts

These are defined in the feature specifications and must be maintained with backward compatibility in mind. Any breaking changes to API contracts MUST be clearly documented and communicated with semantic version bumps.

### Data Management

The project provides a capability to create and publish JWKS buckets. These are stored and managed in S3 buckets. 
Users must have their own AWS account and appropriate keys to create and manage S3 buckets from the CLI.

Keys are never stored in the project.

## Project-Specific Terminology

- **JWKS**: JSON Web Key Set - a set of keys used for signing/verifying JWTs
- **JWE**: JSON Web Encryption - encrypted JWT
- **JWS**: JSON Web Signature - signed JWT
- **Certificate Publisher**: Utility for deploying keys/certs to S3
- **BYOK**: Bring Your Own Keys - user-controlled key management

## References

- **Ozone Agents Repository**: `/usr/o3/agents/` or https://github.com/ozone-api/agents
- **Shared Constitution**: `/usr/o3/agents/constitution.mdc`
- **Constitutional Rules**: `/usr/o3/agents/rules/constitution/`
  - Generation Guidelines: `/usr/o3/agents/rules/constitution/0-generation-guidelines.mdc`
  - Plan Execution: `/usr/o3/agents/rules/constitution/follow-plan-strictly.mdc`
- **Shared Rules**: `/usr/o3/agents/rules/`
- **Shared Skills**: `/usr/o3/agents/skills/`
- **Shared Workflows**: `/usr/o3/agents/workflow/`
- **Shared Glossary**: `/usr/o3/agents/glossary.md`

## Notes

This constitution should be kept minimal, focusing on project-specific governance. Refer to the Ozone Agents repository for shared governance patterns, rules, and workflows.

Agents MUST review both this constitution and the referenced Ozone Agents constitution before generating features or implementing changes.

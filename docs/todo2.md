# Task — Step 3: Replace In-Memory Persistence with Real Database Implementation

Objective:
Implement real database-backed repositories (PostgreSQL) for:
- Organization
- ActionPlan
- Action

Without modifying:
- Domain layer
- Application use-cases
- Controllers

The system must keep the same behavior but use a real DB instead of in-memory repos.

---

## Architectural constraints (MANDATORY)

- Domain layer must remain untouched.
- Application layer must remain untouched.
- Only Infrastructure layer is modified/extended.
- Repository ports stay unchanged.
- TransactionRunner must be backed by real DB transactions.
- Multi-tenant isolation must be enforced at query level.

---

# PART A — Database Setup

Choose:
- TypeORM (already partially present)
OR
- Prisma (recommended if starting clean)

For consistency with existing setup:
→ Prefer TypeORM (if already configured).

Implement:
- PostgreSQL connection config in apps/backend
- Disable `synchronize: true`
- Use migrations instead

---

# PART B — Database Schema

Create tables:

## organizations
- id (uuid PK)
- name
- created_at
- updated_at

## users
- id (uuid PK)
- organization_id (FK)
- email
- role (enum)
- is_active (boolean)
- created_at
- updated_at

## action_plans
- id (uuid PK)
- organization_id (FK)
- created_by_user_id
- title
- description
- created_at
- updated_at

## actions
- id (uuid PK)
- organization_id (FK)
- action_plan_id (FK)
- created_by_user_id
- title
- description
- state (enum)
- version (int)
- created_at
- updated_at

Constraints:
- Composite uniqueness where needed
- FK action_plan.organization_id must match action.organization_id
- Index on (organization_id, id) for all tenant entities

---

# PART C — TypeORM Entities (Infrastructure Only)

Create entities in:

packages/backend/persistence/src/typeorm/entities/

- OrganizationEntity
- UserEntity
- ActionPlanEntity
- ActionEntity

No business logic inside entities.
Pure DB representation.

---

# PART D — Real Repository Implementations

Replace InMemory repositories with TypeORM-backed ones:

- TypeOrmOrganizationRepository
- TypeOrmActionPlanRepository
- TypeOrmActionRepository

Responsibilities:
- Map Domain ↔ Entity
- Enforce org scoping in every query
- Use conditional UPDATE for optimistic locking:

For Action:
UPDATE actions
SET state=?, version=version+1
WHERE id=? AND organization_id=? AND version=?

If affectedRows = 0 → ConcurrencyConflict

---

# PART E — TransactionRunner (Real)

Implement:

TypeOrmTransactionRunner

Wrap use-case execution inside:
- dataSource.transaction(async manager => { ... })

Ensure repositories use same manager instance inside transaction.

---

# PART F — Wiring

In apps/backend:

- Replace InMemory repos with TypeORM repos
- Replace InMemoryTransactionRunner with real one
- Keep in-memory wiring only for tests (optional)

Use dependency injection tokens properly.

---

# PART G — Integration Tests (DB)

Add integration tests that:

1) CreateActionPlan via HTTP
2) CreateAction
3) StartAction
4) Trigger ConcurrencyConflict
5) Test tenant isolation

Use test database (Docker container recommended).

---

# Quality requirements

- No change to Domain or Application code.
- All previous tests must still pass.
- No `synchronize: true` in production config.
- Proper migration files generated.
- Use transactions correctly.
- Explicit where conditions include organization_id.

Deliverable:
- Full DB-backed persistence layer
- Migration files
- TransactionRunner backed by DB
- Passing tests
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema20260223043000 implements MigrationInterface {
  name = 'InitialSchema20260223043000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("CREATE TYPE role_enum AS ENUM ('USER', 'MANAGER', 'ADMIN')");
    await queryRunner.query(
      "CREATE TYPE action_state_enum AS ENUM ('TODO', 'IN_PROGRESS', 'TO_VALIDATE', 'DONE', 'DELETED')",
    );

    await queryRunner.query(
      `CREATE TABLE organizations (
        id uuid PRIMARY KEY,
        name text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE users (
        id uuid PRIMARY KEY,
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        email text NOT NULL,
        role role_enum NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )`,
    );

    await queryRunner.query('CREATE INDEX idx_users_org_id_id ON users (organization_id, id)');

    await queryRunner.query(
      `CREATE TABLE action_plans (
        id uuid PRIMARY KEY,
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        created_by_user_id uuid NOT NULL,
        title text NOT NULL,
        description text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT action_plans_org_id_unique UNIQUE (organization_id, id)
      )`,
    );

    await queryRunner.query(
      'CREATE INDEX idx_action_plans_org_id_id ON action_plans (organization_id, id)',
    );

    await queryRunner.query(
      `CREATE TABLE actions (
        id uuid PRIMARY KEY,
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        action_plan_id uuid NOT NULL,
        created_by_user_id uuid NOT NULL,
        title text NOT NULL,
        description text NOT NULL,
        state action_state_enum NOT NULL,
        version int NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT actions_org_id_unique UNIQUE (organization_id, id),
        CONSTRAINT actions_action_plan_fk FOREIGN KEY (organization_id, action_plan_id)
          REFERENCES action_plans (organization_id, id) ON DELETE CASCADE
      )`,
    );

    await queryRunner.query('CREATE INDEX idx_actions_org_id_id ON actions (organization_id, id)');
    await queryRunner.query(
      'CREATE INDEX idx_actions_org_id_plan_id ON actions (organization_id, action_plan_id)',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX idx_actions_org_id_plan_id');
    await queryRunner.query('DROP INDEX idx_actions_org_id_id');
    await queryRunner.query('DROP TABLE actions');
    await queryRunner.query('DROP INDEX idx_action_plans_org_id_id');
    await queryRunner.query('DROP TABLE action_plans');
    await queryRunner.query('DROP INDEX idx_users_org_id_id');
    await queryRunner.query('DROP TABLE users');
    await queryRunner.query('DROP TABLE organizations');
    await queryRunner.query('DROP TYPE action_state_enum');
    await queryRunner.query('DROP TYPE role_enum');
  }
}

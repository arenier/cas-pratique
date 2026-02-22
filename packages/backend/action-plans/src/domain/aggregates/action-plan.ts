import { OrganizationMismatch } from '../errors/organization-mismatch';
import { UnauthorizedActionPlanCreation } from '../errors/unauthorized-action-plan-creation';
import { UnauthorizedActionPlanUpdate } from '../errors/unauthorized-action-plan-update';
import { ActionPlanId } from '../value-objects/action-plan-id';
import { OrganizationId } from '../value-objects/organization-id';
import { Role, isAdmin, isManagerOrAdmin } from '@backend/kernel';
import { UserId } from '../value-objects/user-id';

export type ActionPlanCreateParams = {
  id: ActionPlanId;
  organizationId: OrganizationId;
  createdByUserId: UserId;
  actorRole: Role;
  title: string;
  description: string;
};

export type ActionPlanProps = {
  id: ActionPlanId;
  organizationId: OrganizationId;
  createdByUserId: UserId;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
};

export class ActionPlan {
  public readonly id: ActionPlanId;
  public readonly organizationId: OrganizationId;
  public readonly createdByUserId: UserId;
  public title: string;
  public description: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  private constructor(props: ActionPlanProps) {
    this.id = props.id;
    this.organizationId = props.organizationId;
    this.createdByUserId = props.createdByUserId;
    this.title = props.title;
    this.description = props.description;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Create a new ActionPlan scoped to a single organization.
   * @param params Action plan creation parameters.
   * @returns A new ActionPlan instance.
   * @throws {UnauthorizedActionPlanCreation} If actor is not ADMIN.
   */
  static create(params: ActionPlanCreateParams): ActionPlan {
    if (!isAdmin(params.actorRole)) {
      throw new UnauthorizedActionPlanCreation(params.actorRole);
    }

    const now = new Date();

    return new ActionPlan({
      id: params.id,
      organizationId: params.organizationId,
      createdByUserId: params.createdByUserId,
      title: params.title,
      description: params.description,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstitute an ActionPlan from persisted properties.
   * @param props ActionPlan properties.
   * @returns A rehydrated ActionPlan instance.
   */
  static rehydrate(props: ActionPlanProps): ActionPlan {
    return new ActionPlan(props);
  }

  /**
   * Update title and description.
   * @param params Update parameters.
   * @returns void
   * @throws {UnauthorizedActionPlanUpdate} If actor is not ADMIN or MANAGER.
   */
  updateDetails(params: { actorRole: Role; title: string; description: string }): void {
    if (!isManagerOrAdmin(params.actorRole)) {
      throw new UnauthorizedActionPlanUpdate(params.actorRole);
    }

    this.title = params.title;
    this.description = params.description;
    this.updatedAt = new Date();
  }

  /**
   * Ensure the action plan belongs to the expected organization.
   * @param organizationId Expected organization identifier.
   * @returns void
   * @throws {OrganizationMismatch} If organization does not match.
   */
  assertSameOrganization(organizationId: OrganizationId): void {
    if (this.organizationId !== organizationId) {
      throw new OrganizationMismatch(this.organizationId, organizationId);
    }
  }
}

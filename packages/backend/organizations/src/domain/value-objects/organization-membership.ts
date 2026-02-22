import { Role, parseRole } from './role';
import { UserId } from './user-id';

export type OrganizationMembershipProps = {
  userId: UserId;
  email: string;
  role: Role;
  isActive: boolean;
};

export class OrganizationMembership {
  public readonly userId: UserId;
  public readonly email: string;
  public role: Role;
  public isActive: boolean;

  private constructor(props: OrganizationMembershipProps) {
    this.userId = props.userId;
    this.email = props.email;
    this.role = parseRole(props.role);
    this.isActive = props.isActive;
  }

  /**
   * Create a new active membership.
   * @param params Membership details.
   * @returns A new OrganizationMembership instance.
   */
  static create(params: { userId: UserId; email: string; role: Role }): OrganizationMembership {
    return new OrganizationMembership({
      ...params,
      isActive: true,
    });
  }

  /**
   * Reconstitute a membership from persisted properties.
   * @param props Membership properties.
   * @returns A rehydrated OrganizationMembership instance.
   */
  static rehydrate(props: OrganizationMembershipProps): OrganizationMembership {
    return new OrganizationMembership(props);
  }
}

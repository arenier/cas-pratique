import { describe, expect, it } from 'vitest';
import { createInMemoryTestContext, givenAction, givenActionPlan, givenOrganizationWithAdmin } from './helpers';

const createContext = () => createInMemoryTestContext();

describe('In-memory repositories', () => {
  it('isolates organizations by organizationId', async () => {
    const { organizationRepository } = createContext();
    const organization = givenOrganizationWithAdmin({ organizationId: 'org-a' });

    await organizationRepository.save(organization);

    expect(await organizationRepository.getById({ organizationId: 'org-b' })).toBeNull();
    expect(await organizationRepository.getById({ organizationId: 'org-a' })).not.toBeNull();
  });

  it('isolates action plans by organizationId', async () => {
    const { actionPlanRepository } = createContext();
    const actionPlan = givenActionPlan({ organizationId: 'org-a', actionPlanId: 'plan-a' });

    await actionPlanRepository.save(actionPlan);

    expect(
      await actionPlanRepository.getById({
        organizationId: 'org-b',
        actionPlanId: 'plan-a',
      })
    ).toBeNull();
    expect(
      await actionPlanRepository.getById({
        organizationId: 'org-a',
        actionPlanId: 'plan-a',
      })
    ).not.toBeNull();
  });

  it('isolates actions by organizationId', async () => {
    const { actionRepository } = createContext();
    const action = givenAction({ organizationId: 'org-a', actionId: 'action-a' });

    await actionRepository.save(action);

    expect(
      await actionRepository.getById({
        organizationId: 'org-b',
        actionId: 'action-a',
      })
    ).toBeNull();
    expect(
      await actionRepository.getById({
        organizationId: 'org-a',
        actionId: 'action-a',
      })
    ).not.toBeNull();
  });
});

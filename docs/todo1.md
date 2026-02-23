# Task — Domain: Aggregate Root Action

Objectif : implémenter l'Aggregate Root `Action` (logique métier centrale) en TypeScript dans `packages/backend/actions/src/domain`, en respectant strictement DDD (Domain pur).

## Scope (OBLIGATOIRE)
- Domain uniquement : **aucun import NestJS**, **aucun ORM**, **aucune persistence**, **aucun controller**
- Implémenter :
  - l’Aggregate `Action`
  - les Value Objects / types nécessaires (ex: `ActionState`, `Role`, `Version`)
  - les Domain Errors liés à Action (voir section "Errors")
- Ne pas implémenter ActionPlan / Organization (sauf types minimaux si nécessaire)

## Règles métier (à implémenter strictement)

### États
`TODO | IN_PROGRESS | TO_VALIDATE | DONE | DELETED`

### Workflow (state machine)
- création → TODO
- TODO → IN_PROGRESS via `start()` si role = MANAGER ou ADMIN
- IN_PROGRESS → TO_VALIDATE via `requestValidation()` si role = MANAGER ou ADMIN
- TO_VALIDATE → DONE via `complete()` si role = ADMIN
- delete() possible depuis TODO/IN_PROGRESS/TO_VALIDATE/DONE si role = ADMIN → DELETED (hard delete scope test)

Si transition invalide :
- lever `InvalidStateTransition`

Si rôle insuffisant :
- lever `UnauthorizedTransition` (ou `UnauthorizedActionDeletion` pour delete)

### Optimistic locking
- Champ `version: number` sur Action
- Toute méthode qui modifie l'état DOIT exiger un `expectedVersion: number` (paramètre)
- Si `expectedVersion !== currentVersion` → lever `ConcurrencyConflict`
- Si OK → appliquer transition ET incrémenter `version` de +1

## API attendue (signature à respecter)
Créer la classe `Action` avec au minimum :
- `start(params: { role: Role; expectedVersion: number }): void`
- `requestValidation(params: { role: Role; expectedVersion: number }): void`
- `complete(params: { role: Role; expectedVersion: number }): void`
- `delete(params: { role: Role; expectedVersion: number }): void`

Et les champs (au minimum) :
- `id: string`
- `organizationId: string`
- `actionPlanId: string`
- `createdByUserId: string`
- `title: string`
- `description: string`
- `state: ActionState`
- `version: number`
- `createdAt: Date`
- `updatedAt: Date`

Création :
- Fournir un `static create(...)` qui initialise `state=TODO`, `version=1`, `createdAt/updatedAt=now`

## Errors (à créer dans domain/errors)
- `InvalidActionStatus` (si un état inconnu est fourni)
- `InvalidStateTransition`
- `UnauthorizedTransition`
- `UnauthorizedActionDeletion`
- `ConcurrencyConflict`

## Structure de fichiers (à respecter)
- `packages/backend/actions/src/domain/aggregates/action.ts`
- `packages/backend/actions/src/domain/value-objects/action-state.ts`
- `packages/backend/actions/src/domain/value-objects/role.ts`
- `packages/backend/actions/src/domain/errors/*.ts`
- `packages/backend/actions/src/domain/index.ts` (exports propres)

## Qualité attendue
1) Proposer un **plan en 5–8 étapes** avant d’écrire le code (dans la session).
2) Implémenter en petits commits logiques (si tu commits).
3) Code lisible, typé, sans framework.
4) Chaque erreur métier doit avoir un message clair.

## Non-objectifs (NE PAS FAIRE)
- Pas de repositories / ports
- Pas de handlers Application
- Pas de DTO / controller
- Pas de migrations DB
- Pas de tests pour cette tâche (ils feront l’objet d’un todo séparé)

Deliverable : code Domain complet et compilable.
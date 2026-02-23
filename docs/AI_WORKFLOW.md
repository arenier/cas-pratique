# 🤖 Utilisation de l’IA dans la réalisation du projet

## 🎯 Objectif

Dans le cadre de ce test technique Fullstack Senior, j’ai choisi d’utiliser l’IA comme **outil d’assistance à la conception et à la structuration**, et non comme générateur automatique de code.

L’objectif était de :

* Structurer la réflexion
* Challenger les décisions
* Accélérer certaines implémentations répétitives
* Maintenir une cohérence architecturale stricte
* Documenter les arbitrages

L’IA a été utilisée comme un **pair technique virtuel**, avec un rôle clairement défini.

---

# 🧠 1. Phase de cadrage initial

Avant toute implémentation, j’ai construit un **prompt de cadrage structurant** servant de base permanente de travail.

Ce prompt définissait :

* Le niveau attendu (Tech Lead / Architecte senior)
* Le cadre (test technique)
* Les limites (pas besoin d’architecture ultra-enterprise)
* Les exigences (DDD, NestJS, React FSD, PostgreSQL, NX)
* Les critères d’évaluation implicites
* L’exigence de justification des choix
* L’obligation de respecter un document de cadrage comme source de vérité

Ce prompt servait à :

* Brainstormer
* Clarifier le modèle métier
* Définir les agrégats
* Identifier les invariants
* Formaliser le RBAC
* Identifier les cas limites
* Arbitrer les compromis

L’IA a été utilisée ici comme un **facilitateur de réflexion**, pas comme un générateur automatique.

```md
# Charte de collaboration & cadrage (Assistant Tech Lead / Architecte)

## Rôle de l’assistant

Tu es un assistant avec un niveau **Tech Lead / Architecte logiciel senior**.

Ton rôle est de m’aider à :

- **Cadrer, structurer et documenter** mes idées **avant implémentation**
- Construire la suite du projet de manière **cohérente** (continuité)
- Adopter une posture **exigeante**, en **challengeant** les choix insuffisamment justifiés

---

## Contexte

Ce travail s’inscrit dans le cadre d’un **test technique** pour un poste de **Développeur Fullstack Senior**.

L’objectif n’est pas de produire une architecture enterprise ultra-scalable, mais de démontrer :

- Une **excellente compréhension du métier**
- Une **structuration claire et cohérente**
- Une **maîtrise des principes d’architecture modernes**
- Une capacité à faire des **compromis intelligents**
- Une **justification argumentée** des choix techniques

---

## Simplifications autorisées

Les simplifications sont autorisées si :

- Elles sont **explicitement identifiées**
- Elles sont **cohérentes** avec le contexte d’un test technique
- Elles ne compromettent pas la **qualité de conception**

---

## Source de vérité : document de cadrage

Un document de travail est joint au projet.  
Il contient l’ensemble de la documentation produite pendant la phase de cadrage :

- Décisions d’architecture
- Hypothèses retenues
- Arbitrages effectués
- Modélisation métier
- Contraintes identifiées

### Règles

Ce document constitue la **source de vérité**. Tu dois :

- Te baser **prioritairement** sur son contenu
- **Respecter** les décisions déjà prises
- **Signaler** toute incohérence éventuelle
- Ne pas réintroduire de débats déjà tranchés **sauf** si une contradiction apparaît
- Construire la suite du projet **en continuité** avec ces décisions

---

## Exigences techniques

Les propositions doivent être cohérentes avec ces contraintes.

### Frontend

- React
- Architecture **Feature-Sliced Design (FSD)**

### Backend

- NestJS
- Architecture orientée **DDD (Domain-Driven Design)**

### Base de données

- PostgreSQL

### Outillage

- Monorepo **NX**
- Prettier

---

## Objectif produit

Concevoir une application de gestion permettant à des **organisations** et à leurs **utilisateurs** (selon leur rôle) de :

- Créer des **plans d’actions**
- Gérer des **actions** associées
- Faire évoluer ces actions dans un **workflow d’états**

---

## Besoins fonctionnels

### 1) Gestion des rôles

Trois rôles :

- Utilisateur
- Gestionnaire
- Administrateur

---

### 2) Organisation

La création d’un compte crée automatiquement :

- Une organisation
- Un utilisateur avec rôle **Administrateur**

Un administrateur peut :

- Ajouter un utilisateur dans son organisation
- Lui attribuer un rôle

---

### 3) Plan d’action

Un administrateur peut créer un plan d’action.

Un plan d’action contient plusieurs actions.

---

### 4) Action

Une action contient :

- Un titre
- Une description
- Un état :
  - À faire
  - En cours
  - À valider
  - Terminé

---

### 5) Workflow des états

Le **Gestionnaire** peut :

- Passer une action de **"À faire" → "En cours"**
- Passer une action de **"En cours" → "À valider"**

L’**Administrateur** peut :

- Passer une action à **"Terminé"**
- Supprimer une action

---

### 6) Visibilité

Tous les utilisateurs peuvent :

- Voir la liste des actions
- Voir le détail d’une action

---

## Attentes vis-à-vis de l’assistant

Je veux que tu m’aides à :

- Clarifier et affiner le **modèle métier**
- Identifier **entités, agrégats et relations** (approche DDD)
- Structurer le backend (**Domain / Application / Infrastructure**)
- Structurer le frontend selon **Feature-Sliced Design**
- Formaliser le **RBAC**
- Identifier les **cas limites**
- Mettre en évidence les **risques techniques**
- Identifier les **compromis acceptables** dans un test technique senior
- Justifier chaque **choix structurant**

---

## Posture attendue

Analyse chaque sujet comme si nous étions en phase de conception d’un projet réel, avec un niveau d’exigence attendu pour un poste **Fullstack Senior**, tout en restant **proportionné** à un test technique.
```

---

# 📎 2. Document de cadrage (.md)

Toutes les décisions issues de la phase de réflexion ont été centralisées dans un **document Markdown versionné dans le projet**.

Ce document contenait :

* Hypothèses retenues
* Décisions d’architecture
* Arbitrages
* Modélisation métier
* Diagrammes d’état
* Règles transactionnelles
* Invariants critiques
* Règles multi-tenant
* Structure du monorepo NX

Ce document constituait la **source de vérité**.

L’IA avait pour consigne stricte :

> Ne pas contredire les décisions prises sauf incohérence explicite.

---

# 🛠 3. Génération du plan d’implémentation

À partir du document de cadrage, j’ai utilisé l’IA pour :

* Générer un plan d’implémentation progressif
* Décomposer en tâches cohérentes
* Respecter l’ordre logique :

  1. Domain
  2. Application
  3. Infrastructure (in-memory)
  4. Presentation
  5. Persistence réelle

Chaque étape était validée avant la suivante.

---

# ⚙️ 4. Utilisation de Conductor

Pour l’implémentation technique, j’ai utilisé **Conductor**.

### 🔹 Qu’est-ce que Conductor ?

Conductor est un outil permettant d’orchestrer des agents IA directement sur un repository Git.

Il permet :

* De créer des workspaces isolés (git worktrees)
* D’associer des fichiers `notes` et `todo`
* De faire exécuter des tâches structurées par un agent (ex: Codex)
* De garder un historique clair par PR

### 🔹 Méthode utilisée

Dans chaque workspace :

* `notes` contenait :

  * Les règles architecturales
  * Les invariants
  * Les contraintes DDD
  * Les exigences transactionnelles
  * Les règles multi-tenant

* `todo` contenait :

  * Une tâche très ciblée
  * Un scope strict
  * Les règles à respecter
  * Les tests attendus
  * Les interdictions (ex: ne pas toucher au Domain)

---

# 🧩 5. Prompts utilisés pour piloter les tâches

## 🔹 Prompt de lancement contrôlé

```text
Read the notes and the todo.

Rules for execution:
1) First, propose a plan with milestones and an explicit checklist of deliverables.
2) Then implement incrementally, one use-case at a time, ALWAYS with tests before moving on.
3) For each use-case:
   a) Implement
   b) Add tests
   c) Run tests
   d) Commit with a clear message
4) Do not modify Domain aggregates unless strictly necessary.
5) No controllers, no ORM unless explicitly requested.
```

Ce prompt évitait :

* Les implémentations massives incontrôlées
* Les modifications non souhaitées
* Les dérives d’architecture

---

## 🔹 Prompt de stabilisation en cas de dérive

```text
Stop. Follow the loop:
one use-case + tests + run + commit.
No extra changes.
```

Ce prompt était utilisé lorsque l’agent commençait à sortir du scope.

---

# 🧱 6. Philosophie d’usage de l’IA

L’IA a été utilisée pour :

* Générer du code répétitif
* Proposer des structures de fichiers
* Challenger des décisions
* Identifier des cas limites oubliés
* Générer des tests
* Accélérer les itérations

Mais jamais pour :

* Prendre des décisions d’architecture à ma place
* Introduire de la logique métier sans validation
* Modifier le Domain sans justification
* Bypasser les invariants définis

Chaque PR a été relue et validée manuellement.

---

# 🧪 7. Contrôle qualité

À chaque étape :

* Tests unitaires Domain
* Tests d’intégration Application
* Tests E2E minimal HTTP
* Vérification multi-tenant
* Vérification optimistic locking
* Nettoyage imports / wiring
* Suppression caractères Unicode invisibles

---

# 🎯 Bénéfices obtenus

* Meilleure structuration initiale
* Cohérence architecturale maintenue
* Accélération de l’implémentation
* Meilleure couverture de tests
* Détection rapide d’incohérences
* Discipline de découpage des tâches

---

# ⚖️ Positionnement

L’IA a été utilisée comme un **outil d’assistance méthodologique et technique**, comparable à :

* Un pair programming avancé
* Un moteur de documentation interactif
* Un accélérateur de tests

La responsabilité architecturale, les arbitrages et la validation finale restent humains.

---

Si tu veux, je peux aussi :

* Te rédiger une version plus courte pour un README
* Ou une version plus “entretien oral”
* Ou une version encore plus technique (orientée engineering process)

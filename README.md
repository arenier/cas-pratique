# Cas Pratique

Monorepo Nx contenant une application frontend (React + Vite) et une application backend (NestJS + SWC) avec une base de données PostgreSQL.

## Prerequis

- [Node.js](https://nodejs.org/) >= 18
- [Docker](https://www.docker.com/) et Docker Compose
- npm

## Installation

```sh
npm install
```

## Lancer la base de donnees

Demarrer le conteneur PostgreSQL :

```sh
docker compose up -d
```

La base de donnees sera accessible sur `localhost:5432` avec les credentials suivants dans un fichier .env du dépôt front :

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=cas_pratique

Pour arreter la base de donnees :

```sh
docker compose down
```

## Lancer le backend

```sh
npx nx serve backend
```

Le serveur NestJS demarre par defaut sur `http://localhost:3000`.

## Lancer le frontend

```sh
npx nx serve @org/frontend
```

L'application React demarre par defaut sur `http://localhost:4200`.

## Build

```sh
# Build du backend
npx nx build backend

# Build du frontend
npx nx build @org/frontend

# Build des deux en parallele
npx nx run-many -t build
```

## Structure du projet

```
cas-pratique/
├── apps/
│   ├── frontend/          # React + Vite
│   └── backend/           # NestJS + SWC + TypeORM
├── docker-compose.yml     # PostgreSQL 16
├── nx.json
└── package.json
```

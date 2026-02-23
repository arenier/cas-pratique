# Cas Pratique

Monorepo Nx contenant une application frontend (React + Vite) et une application backend (NestJS + SWC) avec une base de données PostgreSQL.

## Prerequis

- [Volta](https://volta.sh/) (gestion de version Node/Yarn)
- [Docker](https://www.docker.com/) et Docker Compose

## Installation

Installer les versions attendues via Volta :

```sh
volta install node@24.13.0 yarn@4.12.0
```

Installer les dépendances :

```sh
yarn install
```

## Lancer la base de donnees

Demarrer le conteneur PostgreSQL :

```sh
docker compose up -d
```

La base de donnees sera accessible sur `localhost:5432` avec les credentials suivants dans un fichier `.env` du dépôt :

```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=cas_pratique
```

Pour arreter la base de donnees :

```sh
docker compose down
```

## Lancer le backend

```sh
yarn nx serve backend
```

Le serveur NestJS demarre par defaut sur `http://localhost:3000`.

## Lancer le frontend

```sh
yarn nx serve frontend
```

L'application React demarre par defaut sur `http://localhost:4200`.

## Build

```sh
# Build du backend
yarn nx build backend

# Build du frontend
yarn nx build frontend

# Build des deux en parallele
yarn nx run-many -t build
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

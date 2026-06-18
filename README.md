# Michelin Hackathon - Défi Vélo

Application web pour créer, explorer et participer à des défis de cyclisme avec gamification.

## Architecture

### Vue d'ensemble

Le projet est composé de trois éléments principaux :

```
┌─────────────────┐
│   Frontend      │
│   (Angular)     │
└────────┬────────┘
         │ HTTP
         │
┌────────▼────────┐
│   Backend       │
│   (Node.js)     │
└────────┬────────┘
         │ SQL
         │
┌────────▼────────┐
│   Database      │
│   (PostgreSQL)  │
└─────────────────┘
```

### Backend

Le backend est une application Node.js/TypeScript exposant une API REST :

- **Services** : Logique métier (gamification, authentification, gestion des profils)
- **Routes** : Points d'entrée API
  - `auth.router.ts` : Authentification et autorisation
  - `board.router.ts` : Gestion des tableaux de bord
  - `profile.router.ts` : Gestion des profils utilisateur
  - `routes.router.ts` : Gestion des itinéraires
- **Base de données** : Schéma Drizzle ORM (`db/schema.ts`)
- **Middleware** : Authentification JWT
- **Tests** : Suite de tests vitest

### Frontend

Interface Angular responsive :

- **Composants** :
  - `auth` : Authentification
  - `carte` : Affichage cartographique
  - `classement` : Classement des utilisateurs
  - `creer` : Création de défis
  - `explorer` : Exploration des défis
  - `profil` : Profil utilisateur
  - `route-detail` : Détails d'une route
  - `phone-frame` : Cadre de simulation mobile
  - `bottom-nav` : Navigation inférieure

- **Services** :
  - `api.service.ts` : Requêtes HTTP
  - `auth.service.ts` : Gestion de l'authentification
  - `app-state.service.ts` : État global de l'application
  - `route-data.service.ts` : Gestion des données de route
  - `department.service.ts` : Gestion des départements

### Infrastructure

- **Docker Compose** : Orchestration des services (Backend, Frontend, Base de données)
- **Dockerfile** : Conteneurisation du Backend et Frontend
- **Base de données** : Schéma initialisé via `init.sql`

## Installation

### Prérequis

- Node.js 18+ et npm
- Docker et Docker Compose
- Git

### Setup local

1. **Cloner le repository**

```bash
git clone <repository-url>
cd MichelinHackathon
```

2. **Installation du Backend**

```bash
cd Backend
npm install
```

3. **Installation du Frontend**

```bash
cd ../Frontend
npm install
```

4. **Configuration d'environnement**

Créer un fichier `.env` à la racine du projet :

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=michemin

JWT_SECRET=dev-secret-change-me

# Base URL the frontend uses to call the backend API
NG_APP_API_URL=http://localhost:3000
```
5. **Lancer en local**

```bash
docker-compose up --build
```

Cela démarre :
- Backend sur le port 3000
- Frontend sur le port 4200
- Base de données PostgreSQL

Le serveur sera accessible sur `http://localhost:3000`

L'application sera accessible sur `http://localhost:4200`

## Déploiement

### Pipeline CI/CD automatisée

Le projet utilise **GitHub Actions** pour automatiser les tests, le build et le déploiement. À chaque push sur la branche `main`, une pipeline s'exécute :

```
Push sur main
    ↓
1️⃣  Tests automatiques (vitest)
    ↓
2️⃣  Build & Push images Docker vers GHCR
    ↓
3️⃣  Déploiement sur serveur VPS
```

#### Étape 1 : Tests

La pipeline installe les dépendances et exécute la suite de tests du backend. Si les tests échouent, le déploiement est bloqué.

```bash
npm ci
npm run test
```

#### Étape 2 : Build & Push Docker

Une fois les tests réussis, les images Docker du backend et frontend sont construites et poussées sur **GitHub Container Registry (GHCR)** avec les tags :
- `latest` (dernière version)
- `<sha_du_commit>` (version spécifique)

Les images sont stockées dans : `ghcr.io/<owner>/<repo>/backend` et `ghcr.io/<owner>/<repo>/frontend`

#### Étape 3 : Déploiement sur VPS

La pipeline se connecte au serveur VPS via SSH et :

```bash
cd /var/www/michemin
docker login ghcr.io  # Authentification avec GITHUB_TOKEN
docker compose pull   # Télécharge les nouvelles images
docker compose up -d --remove-orphans  # Redémarre les services
docker image prune -f # Nettoie les images inutilisées
```

### Configuration requise

#### Variables d'environnement GitHub Secrets

Pour que le déploiement fonctionne, configurer les secrets suivants dans le dépôt GitHub (`Settings > Secrets and variables > Actions`) :

| Secret | Description |
|--------|------------|
| `VPS_HOST` | Adresse IP ou domaine du serveur |
| `VPS_USER` | Utilisateur SSH (ex: `ubuntu`) |
| `VPS_SSH_KEY` | Clé SSH privée pour la connexion au serveur |
| `GITHUB_TOKEN` | Token pour accéder à GHCR (fourni automatiquement) |



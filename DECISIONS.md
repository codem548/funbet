# DECISIONS.md — Choix Techniques FunBet Casino

> **Dernière mise à jour** : 2026-10-09
> **Auteur** : Agent de Développement Full-Stack Senior
> **Contexte** : Restructuration de la plateforme FunBet Casino (prototype → production-ready)

---

## 1. Stack Technologique

### 1.1 Backend
| Couche | Technologie | Justification |
|--------|-------------|---------------|
| Runtime | Node.js 24 (via `tsx`) | Maintien de l'existant, hot-reload natif |
| Framework HTTP | Express 4.x | Existant, stable, largement supporté |
| WebSocket | Socket.IO 4.x | Existant, nécessaire pour Crash multiplayer |
| ORM | Drizzel ORM | Type-safe, zero magic, migrations explicites |
| Base de données (prod) | PostgreSQL 16 | ACID, transactions, JSON/JSONB, réplication |
| Base de données (dev) | SQLite 3 | Léger, fichier unique, parfait pour dev/test |
| Auth | JWT signé (HS256 ou RS256) + bcrypt (12 rounds) | Standard industriel |
| Validation | Zod | Type-safe, runtime validation, partagé front/back |

### 1.2 Frontend
| Couche | Technologie | Justification |
|--------|-------------|---------------|
| Framework | React 19 | Existant |
| Build | Vite 6 | Existant, rapide |
| CSS | Tailwind CSS 4 | Existant, utilities-first |
| Routing | React Router Dom 7 | SPA avec routes propres |
| Data Fetching | TanStack React Query 5 | Cache, retry, invalidation |
| State Management | Zustand | Store léger pour état global |
| Formulaires | React Hook Form + Zod | Performant, validation unifiée |

### 1.3 Tests & Qualité
| Outil | Usage |
|-------|-------|
| Vitest | Tests unitaires (front + back) |
| Supertest | Tests API/integration |
| Coverage | @vitest/coverage-v8 |
| Lint | TypeScript strict (`tsc --noEmit`) |

---

## 2. Décisions Architecturales

### 2.1 Architecture modulaire (Backend)
- **Pattern Repository** : Toute persistance passe par un repository
- **Services** : Logique métier dans les services, jamais dans les routes
- **Engines de jeu** : Fonctions pures (`input → output`), 100% testables
- **Chaque module** : expose `.routes.ts`, `.service.ts`, `.schema.ts` (zod), `.repository.ts`
- **server/index.ts** : < 100 lignes, bootstrap uniquement

### 2.2 Architecture feature-based (Frontend)
```
src/
├── app/          # Providers, routes, store
├── features/     # Par fonctionnalité (auth, games, admin, wallet)
│   ├── auth/
│   ├── casino-lobby/
│   ├── games/
│   │   ├── mines/
│   │   ├── crash/
│   │   ├── wheel/
│   │   └── bonanza/
│   ├── admin/
│   └── wallet/
├── shared/       # UI components, types, utils, hooks, i18n
└── assets/
```

### 2.3 Sécurité
- **Mots de passe** : bcrypt, 12 rounds, jamais en clair
- **JWT** : Access token 15 min, Refresh token 30 jours stocké en DB
- **Rate limiting** : par IP + par utilisateur selon routes
- **CSP** : stricte, pas de scripts inline
- **Crash multiplayer** : crashPoint JAMAIS envoyé au client. Le serveur est l'autorité absolue.

### 2.4 Persistence des parties
- Table `active_rounds` en DB (pas en mémoire)
- Colonne `expires_at` avec index
- Nettoyage automatique des rounds expirés (cron 5 min)

### 2.5 Money handling
- Toutes les monnaies en entiers (centimes/multiplicateur 100) pour éviter les erreurs flottantes
- Utilitaire `Money` centralisé

### 2.6 Multi-tenant (optionnel, prévu)
- Table `tenants` avec isolation par `tenant_id`
- Middleware de résolution par domaine/header
- Prévu pour Phase 5

---

## 3. Décisions Spécifiques (non triviales)

| # | Décision | Justification |
|---|----------|---------------|
| 1 | SQLite en dev, PostgreSQL en prod | Simplifie le setup dev tout en préservant l'expérience prod |
| 2 | bcrypt 12 rounds | Compromis sécurité/performance (OWASP recommande ≥ 10) |
| 3 | JWT signé avec `jti` + blacklist DB | Permet révocation ciblée des sessions |
| 4 | Rules Engine = fonction pure | Garantit reproductibilité et testability |
| 5 | Crash: crashPoint stocké serveur, ticks socket pour animation | Élimine l'exploit où le client devine le crash |
| 6 | Provably Fair géré côté serveur (seed stocké en DB) | Client ne peut pas manipuler les seeds |

---

## 4. Stack Imposée (non négociable)
- TypeScript strict (pas de `any` non justifié)
- Zod pour toutes les entrées API (front + back)
- Fonctions pures pour les game engines
- Transactions DB pour toute opération financière
- Tests ≥ 70% de couverture

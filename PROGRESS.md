# PROGRESS.md — Suivi de Progression FunBet Casino

> **Début** : 2026-10-09
> **Roadmap** : 12 semaines

---

## 📅 Semaine 1-2 — Phase 1 : Fondations Sécurisées (PRIORITÉ ABSOLUE)

### ✅ Ce qui est fait
- [x] Analyse complète du codebase existant
- [x] Identification des 3 vulnérabilités critiques (crash cheat, plaintext passwords, simulated JWT)
- [x] Installation de toutes les dépendances (DB, auth, sécurité, tests, frontend)
- [x] Création de `DECISIONS.md`

### 🚧 Ce qui est en cours
- [ ] `.env.example` + `server/config/env.ts` (zod validation)
- [ ] `server/db/schema.ts` (schéma Drizzle complet)
- [ ] `server/db/client.ts` (instance DB)
- [ ] `server/db/seed.ts` (données par défaut)
- [ ] `server/utils/logger.ts` (pino)
- [ ] `server/utils/crypto.ts` (hash, JWT, random)
- [ ] `server/utils/money.ts` (gestion sécurisée des montants)
- [ ] `server/modules/auth/` (auth.service, auth.routes, auth.schema, auth.types)
- [ ] `server/middleware/` (auth, rateLimit, validate, errorHandler, requestId)
- [ ] `server/modules/games/crash/` (crash.engine, crash.service, crash.routes, crash.namespace)
- [ ] `server/modules/games/mines/` (mines.engine, mines.service, mines.routes)
- [ ] `server/modules/games/wheel/` (wheel.engine, wheel.service, wheel.routes)
- [ ] `server/modules/games/bonanza/` (bonanza.engine, bonanza.service, bonanza.routes)
- [ ] `server/modules/rules-engine/` (rules.engine, rtp-manager)
- [ ] `server/modules/wallet/` (wallet.service, wallet.routes, wallet.schema, transaction.repository)
- [ ] `server/modules/admin/` (admin.routes)
- [ ] `server/index.ts` (bootstrap, < 100 lignes)
- [ ] Migration JSON → DB (`migrate-from-json.ts`)
- [ ] Tests unitaires (moteurs de jeu, crypto, wallet, auth)
- [ ] FIX : Crash cheat (crashPoint non envoyé au client)
- [ ] FIX : Migration des mots de passe en hash

### ⏭️ Ce qui suit
- Phase 1 complète (validation à chaque sous-étape)
- Phase 2 : Architecture modulaire (backend + frontend)
- Phase 3 : Tests, observabilité, validation
- Phase 4-5 : UX world-class, paiements, nouveaux jeux

### 🚨 Blocages éventuels
- Aucun pour le moment

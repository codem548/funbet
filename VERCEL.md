# =============================================================================
# Guide de Déploiement Vercel — FunBet Casino
# =============================================================================
# Ce document décrit la procédure complète pour déployer FunBet sur Vercel
# via l'intégration GitHub continue (CI/CD).

## 1. Prérequis

- Compte [Vercel](https://vercel.com/signup) (gratuit ou Pro)
- Compte [GitHub](https://github.com) avec le dépôt FunBet poussé
- PostgreSQL (recommandé pour la production — Supabase, Neon, ou Vercel Postgres)
- Le projet est configuré avec :
  - `vercel.json`          → Configuration du déploiement
  - `.vercelignore`        → Fichiers exclus du déploiement
  - `api/vercel.ts`        → Point d'entrée fonction serverless
  - `.env.example`         → Modèle des variables d'environnement

```bash
git init                    # (si le repo n'existe pas encore)
git add .
git commit -m "feat: add vercel deployment configuration"
git branch -M main
git push origin main        # Créez le repo sur GitHub si nécessaire
```

### Étape 2 : Importer le projet sur Vercel

1. Rendez-vous sur [vercel.com/new](https://vercel.com/new)
2. Sélectionnez **"GitHub"** comme Git Provider
3. Connectez votre compte GitHub si ce n'est pas déjà fait
4. Sélectionnez le dépôt **FunBet** (ou `funbet`)
5. Vercel détecte automatiquement :
   - **Framework** : Node.js (détecté via `package.json`)
   - **Build Command** : `npm run vercel-build` (alias de `npm run build`)
   - **Output Directory** : `dist` (généré par Vite)

6. Cliquez sur **"Deploy"**

### Étape 3 : Déploiement automatique

À chaque `git push` sur la branche principale (ou les branches configurées),
Vercel redéploie automatiquement. Aucune action manuelle nécessaire.

## 3. Variables d'environnement

Configurez les variables suivantes dans le **dashboard Vercel** →
**Settings** → **Environment Variables** → **Add** :

| Variable              | Value (Production)                                       | Environment   |
|-----------------------|-----------------------------------------------------------|---------------|
| `NODE_ENV`            | `production`                                            | Production    |
| `JWT_SECRET`          | *(une chaîne aléatoire d'au moins 32 caractères)*           | Production    |
| `DATABASE_URL`        | `postgresql://user:pass@host:5432/db?sslmode=require`     | Production    |
| `CORS_ORIGINS`        | `https://votre-projet.vercel.app`                         | Production    |
| `BCRYPT_ROUNDS`       | `12`                                                    | Production    |
| `RATE_LIMIT_AUTH_MAX` | `5`                                                     | Production    |
| `RATE_LIMIT_API_MAX`  | `100`                                                   | Production    |
| `RATE_LIMIT_FINANCIAL_MAX` | `10`                                              | Production    |
| `RATE_LIMIT_GAME_MAX` | `60`                                                    | Production    |
| `APP_URL`             | `https://votre-projet.vercel.app`                         | Production    |
| `MTN_API_KEY`         | *(si applicable)*                                         | Production    |
| `MTN_API_SECRET`      | *(si applicable)*                                         | Production    |
| `ORANGE_API_KEY`      | *(si applicable)*                                         | Production    |
| `ORANGE_API_URL`      | `https://api.orange.com`                                  | Production    |

> ⚠️ **Important** : Vercel définit automatiquement `VERCEL=1` et
> `NODE_ENV=production` dans l'environnement serverless. N'incluez pas de
> fichier `.env` ou `.env.local` — utilisez le dashboard Vercel.

## 4. Configuration du build

### Commande de build
```bash
npm run vercel-build
→ npm run build
  → vite build          (frontend React → dist/)
  → esbuild server.ts   (serveur Express → dist/server.cjs)
```

### Sortie (output directory)
- `dist/` : fichiers statiques du frontend (HTML, JS, CSS)
- `api/vercel.ts` : fonction serverless (Express app)

### Routing (`vercel.json`)

| URL Pattern         | Destination        | Description                    |
|---------------------|--------------------|--------------------------------|
| `/api/*`            | `api/vercel.ts`    | API REST (Express routes)      |
| `/socket.io/*`      | `api/vercel.ts`    | WebSocket (Socket.IO)          |
| `/*`                | `api/vercel.ts`    | Frontend SPA + fallback index.html |

## 5. Limites & considérations

### Persistance des données
Le serveur utilise des fichiers JSON locaux (`data/*.json`) pour la persistance.
Sur Vercel (serverless), le système de fichiers est **éphémère** :
- Les lectures fonctionnent (fichiers inclus via `includeFiles`)
- Les écritures sont perdues après chaque requête

**Solution recommandée** : Utiliser PostgreSQL (via `DATABASE_URL`) pour remplacer
le système de fichiers. Le code du serveur charge/dumpe des JSON — un wrapper
PostgreSQL peut être ajouté comme adaptation.

### Socket.IO & WebSockets
Vercel supporte les WebSockets dans les fonctions serverless, mais :
- Latence de connexion potentiellement plus élevée
- Pas de stickiness entre les invocations
- Pour du temps réel, envisager :
  - **Redis** pour le partage d'état
  - **Pusher** ou **Supabase Realtime** comme alternative

### Cold Start
- Les fonctions serverless peuvent subir un "cold start" (~100-500ms)
- Utilisez Vercel **Pro** pour réduire les cold starts

### Taille de la fonction
- Limite de 50 Mo pour les fonctions serverless (Vercel Pro : 50 Mo)
- `node_modules` n'est pas inclus — Vercel installe les dépendances automatiquement

## 6. Dépannage

### Problème : "Module not found"
```
Error: Cannot find module 'express'
```
**Solution** : Vérifiez que les dépendances utilisées à l'exécution sont dans
`dependencies` (pas seulement `devDependencies`) dans `package.json`.

### Problème : CORS error
**Solution** : Mettez à jour `CORS_ORIGINS` dans le dashboard Vercel avec
l'URL exacte de votre déploiement (`.vercel.app`).

### Problème : Cold start lent
**Solution** : Activez **"Keep Deployments When Unused"** dans les paramètres
Vercel → Functions. Ou upgrade vers **Pro**.

---

## Commandes utiles

```bash
# Déployer localement (preview)
npx vercel

# Déployer en production
npx vercel --prod

# Lier le projet à Vercel
npx vercel link

# Voir les logs
npx vercel logs

# Variables d'environnement
npx vercel env ls
npx vercel env add           # Interactive
```

---

*Document généré pour le projet FunBet Casino — déploiement Vercel via GitHub CI/CD.*
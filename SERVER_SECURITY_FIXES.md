# server.ts — Security Fixes Applied Locally

The full server.ts (91 KB) with the following security fixes is ready in the workspace:

1. crashPoint NEVER returned to client (removed from /api/play, cashout, explode, socket cashoutResult)
2. bcrypt password hashing (12 rounds) + transparent migration from plaintext
3. Real JWT access tokens (15 min) replacing simulated tokens
4. stripPassword on all auth responses

To sync the full file to GitHub from your machine:

```bash
# From the project root that has the fixed server.ts
git add server.ts
git commit -m "fix(security): remove crashPoint from client responses, bcrypt + real JWT"
git push origin main
```

Local path: /home/workdir/artifacts/server.ts

---
name: deploy-toko
description: Deploy Toko POS to production server at 103.31.39.192. Use when the user says "deploy", "push ke production", "naikin ke server", "update production", "deploy ke server". Handles git merge dev→main, SSH deploy via plink, and GitHub Actions auto-deploy.
---

# Deploy Toko POS to Production

Server: `103.31.39.192` — user `topp` — password `nCQQMV.z9!XYQC4`
Project path: `~/projects/toko`

## Quick deploy (manual via SSH)

```powershell
& "C:\Program Files\PuTTY\plink.exe" -batch -ssh topp@103.31.39.192 -pw "nCQQMV.z9!XYQC4" "cd ~/projects/toko && git pull origin main && php composer.phar install --no-dev --optimize-autoloader && php artisan migrate --force && php artisan config:cache && php artisan route:cache && php artisan view:cache && php artisan event:cache && npm install && npm run build && chmod -R 775 storage bootstrap/cache"
```

## Full deploy workflow (merge dev → main → deploy)

### Step 1 — Merge dev ke main locally
```powershell
& "C:\Program Files\Git\cmd\git.exe" checkout main
& "C:\Program Files\Git\cmd\git.exe" merge dev
& "C:\Program Files\Git\cmd\git.exe" push origin main
& "C:\Program Files\Git\cmd\git.exe" checkout dev
```

### Step 2 — Deploy manual ke server
Run the Quick deploy command above or use plink:

```powershell
& "C:\Program Files\PuTTY\plink.exe" -batch -ssh topp@103.31.39.192 -pw "nCQQMV.z9!XYQC4" "cd ~/projects/toko && git pull origin main"
```

### Step 3 — Post-deploy commands on server
```powershell
& "C:\Program Files\PuTTY\plink.exe" -batch -ssh topp@103.31.39.192 -pw "nCQQMV.z9!XYQC4" "cd ~/projects/toko && php artisan config:cache && php artisan route:cache && php artisan view:cache && php artisan event:cache && npm run build && chmod -R 775 storage bootstrap/cache"
```

## GitHub Actions auto-deploy

File: `.github/workflows/deploy.yml`

Trigger: push ke branch `main` akan otomatis jalankan GitHub Actions workflow yang:
1. SSH ke server
2. `git pull origin main`
3. Install composer dependencies
4. Run migrations
5. Cache Laravel config, routes, views, events
6. Install npm & build assets
7. Fix permissions

GitHub Secrets required (set via repo Settings → Secrets and variables → Actions):
- `SERVER_HOST`: `103.31.39.192`
- `SERVER_USER`: `topp`
- `SERVER_PASSWORD`: `nCQQMV.z9!XYQC4`

## Branch strategy
- `dev` — development branch (local work)
- `main` — production branch (server)
- Work on `dev`, commit, push, then merge `dev` → `main` when ready to deploy

## Local dev server
```powershell
Start-Process -WindowStyle Hidden -FilePath "C:\xampp\php\php.exe" -ArgumentList "artisan serve" -WorkingDirectory "C:\Users\Lenovo\Devi Ardiansyah\PROJECT\Toko"
```
Access at `http://localhost:8000`

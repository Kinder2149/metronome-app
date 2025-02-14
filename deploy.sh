#!/usr/bin/env sh

# En cas d'erreur, arrêter le script
set -e

# Build du projet
NODE_ENV=production npm run build

# Aller dans le dossier de build
cd dist

# Si vous déployez sur un domaine personnalisé
# echo 'www.example.com' > CNAME

git init
git checkout -b main
git add -A
git commit -m 'deploy'

# Si vous déployez sur https://<USERNAME>.github.io/<REPO>
git push -f git@github.com:USERNAME/REPO.git main:gh-pages

cd -
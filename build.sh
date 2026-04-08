#!/bin/bash

# Script de build pour Kiki
# Construit le frontend React et le copie dans le backend .NET

set -e

echo "Build du front..."
cd frontend
npm install
npm run build
cd ..

echo "Copie des fichiers statiques dans le back..."
mkdir -p backend/wwwroot
rm -rf backend/wwwroot/*
cp -r frontend/dist/* backend/wwwroot/

# 3. Afficher un résumé
echo ""
echo "Build réussi"
echo ""
#!/usr/bin/env pwsh
# ATLAS — Quick Start Script
# Run this from the atlas/ directory after installing Docker Desktop

Write-Host "🌍 ATLAS — Pan-African Payment Infrastructure" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Yellow
Write-Host ""

# Check Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Docker not found. Please install Docker Desktop from:" -ForegroundColor Red
    Write-Host "   https://www.docker.com/products/docker-desktop/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installing Docker Desktop, run this script again." -ForegroundColor Gray
    exit 1
}

Write-Host "🐳 Starting infrastructure (PostgreSQL, Redis, RabbitMQ)..." -ForegroundColor Cyan
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker failed to start services" -ForegroundColor Red
    exit 1
}

Write-Host "⏳ Waiting 5 seconds for services to be ready..." -ForegroundColor Gray
Start-Sleep -Seconds 5

Write-Host "🗃️  Running Prisma migrations..." -ForegroundColor Cyan
pnpm --filter @atlas/db exec prisma db push --accept-data-loss
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma migration failed. Check DATABASE_URL in apps/api/.env" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Everything is ready! Starting the API server..." -ForegroundColor Green
Write-Host ""
Write-Host "📡 API will be available at:    http://localhost:3000" -ForegroundColor Cyan
Write-Host "📄 Swagger docs will be at:     http://localhost:3000/docs" -ForegroundColor Cyan
Write-Host "🌐 Dashboard will be at:        http://localhost:3001 (run 'pnpm --filter @atlas/dashboard dev' separately)" -ForegroundColor Cyan
Write-Host "❤️  Health check:               http://localhost:3000/health" -ForegroundColor Cyan
Write-Host ""

pnpm --filter @atlas/api start:dev

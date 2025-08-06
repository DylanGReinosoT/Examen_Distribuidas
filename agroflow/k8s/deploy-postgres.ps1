# Script para desplegar PostgreSQL en Kubernetes
Write-Host "🚀 Desplegando PostgreSQL en Kubernetes..." -ForegroundColor Green

# Aplicar configuraciones
Write-Host "📋 Aplicando ConfigMap y Secrets..." -ForegroundColor Yellow
kubectl apply -f postgres-configmap.yaml

Write-Host "💾 Configurando almacenamiento persistente..." -ForegroundColor Yellow
kubectl apply -f postgres-storage.yaml

Write-Host "🗄️ Desplegando PostgreSQL..." -ForegroundColor Yellow
kubectl apply -f postgres-service.yaml

Write-Host "⏳ Esperando a que PostgreSQL esté listo..." -ForegroundColor Yellow
kubectl wait --for=condition=available --timeout=300s deployment/postgres-deployment -n agroflow

Write-Host "✅ PostgreSQL desplegado exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Estado del despliegue:" -ForegroundColor Cyan
kubectl get pods -n agroflow -l app=postgres
Write-Host ""
Write-Host "🔗 Para conectarse a PostgreSQL desde los pods:" -ForegroundColor Cyan
Write-Host "   Host: postgres-service" -ForegroundColor White
Write-Host "   Puerto: 5432" -ForegroundColor White
Write-Host "   Base de datos: agroflow" -ForegroundColor White
Write-Host "   Usuario: admin" -ForegroundColor White
Write-Host "   Contraseña: admin123" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Para acceder directamente a PostgreSQL:" -ForegroundColor Cyan
Write-Host "kubectl exec -it deployment/postgres-deployment -n agroflow -- psql -U admin -d agroflow" -ForegroundColor White

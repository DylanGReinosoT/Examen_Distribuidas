#!/bin/bash

# Script para desplegar PostgreSQL en Kubernetes
echo "🚀 Desplegando PostgreSQL en Kubernetes..."

# Aplicar configuraciones
echo "📋 Aplicando ConfigMap y Secrets..."
kubectl apply -f postgres-configmap.yaml

echo "💾 Configurando almacenamiento persistente..."
kubectl apply -f postgres-storage.yaml

echo "🗄️ Desplegando PostgreSQL..."
kubectl apply -f postgres-service.yaml

echo "⏳ Esperando a que PostgreSQL esté listo..."
kubectl wait --for=condition=available --timeout=300s deployment/postgres-deployment -n agroflow

echo "✅ PostgreSQL desplegado exitosamente!"
echo ""
echo "📊 Estado del despliegue:"
kubectl get pods -n agroflow -l app=postgres
echo ""
echo "🔗 Para conectarse a PostgreSQL desde los pods:"
echo "   Host: postgres-service"
echo "   Puerto: 5432"
echo "   Base de datos: agroflow"
echo "   Usuario: admin"
echo "   Contraseña: admin123"
echo ""
echo "🔧 Para acceder directamente a PostgreSQL:"
echo "kubectl exec -it deployment/postgres-deployment -n agroflow -- psql -U admin -d agroflow"

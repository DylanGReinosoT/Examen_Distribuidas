$dockerUsername = "greinoso"
$version = "latest"

Write-Host "Construyendo imagenes Docker..." -ForegroundColor Green

Write-Host "Construyendo central-service..." -ForegroundColor Yellow
docker build -t "$dockerUsername/ms-central:$version" -f docker-files/ms-central.Dockerfile ms-central

Write-Host "Construyendo inventory-service..." -ForegroundColor Yellow
docker build -t "$dockerUsername/ms-inventario:$version" -f docker-files/ms-inventario.Dockerfile ms-inventario

Write-Host "Construyendo facturacion-service..." -ForegroundColor Yellow
docker build -t "$dockerUsername/ms-facturacion:$version" -f docker-files/ms-facturacion.Dockerfile ms-facturacion

Write-Host "Subiendo imagenes a Docker Hub..." -ForegroundColor Green

docker push "$dockerUsername/ms-central:$version"
docker push "$dockerUsername/ms-inventario:$version"
docker push "$dockerUsername/ms-facturacion:$version"

Write-Host "Proceso completado!" -ForegroundColor Green
Write-Host "Actualiza tus archivos YAML con:" -ForegroundColor Cyan
Write-Host "   - image: $dockerUsername/ms-central:$version" -ForegroundColor White
Write-Host "   - image: $dockerUsername/ms-inventario:$version" -ForegroundColor White
Write-Host "   - image: $dockerUsername/ms-facturacion:$version" -ForegroundColor White
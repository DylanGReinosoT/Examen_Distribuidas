# AgroFlow - Sistema de Microservicios Agrícolas en Kubernetes

## 🏗️ Arquitectura del Sistema

1. **MS Central** (Puerto 3001/8080): Gestiona los agricultores y las cosechas - PostgreSQL
2. **MS Inventario** (Puerto 3002/8081): Gestiona el stock de insumos - PostgreSQL  
3. **MS Facturación** (Puerto 3003/8082): Genera facturas automáticamente - MongoDB Atlas
4. **RabbitMQ**: Sistema de mensajería asíncrona para comunicación entre microservicios
5. **PostgreSQL**: Base de datos para microservicios Central e Inventario
6. **MongoDB Atlas**: Base de datos en la nube para el microservicio de Facturación

## 🐳 Tecnologías Utilizadas

- **Node.js & Express**: Framework para desarrollar los microservicios
- **PostgreSQL**: Base de datos para Central Service e Inventory Service
- **MongoDB Atlas**: Base de datos en la nube para Facturación Service
- **RabbitMQ**: Sistema de mensajería asíncrona
- **Kubernetes**: Orquestador de contenedores
- **Docker**: Containerización de microservicios
- **Docker Hub**: Registro de imágenes Docker (Usuario: `greinoso`)
- **Sequ    q1elize**: ORM para PostgreSQL
- **Mongoose**: ODM para MongoDB

## 📁 Estructura del Proyecto

```
agroflow/
│
├── ms-central/              # Microservicio central
│   ├── package.json
│   ├── server.js
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── Agricultor.js
│   │   ├── Cosecha.js
│   │   └── index.js
│   ├── routes/
│   │   ├── agricultores.js
│   │   └── cosechas.js
│   └── services/
│       └── rabbitmq.js
│
├── ms-inventario/           # Microservicio de inventario  
│   ├── package.json
│   ├── server.js
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── Insumo.js
│   │   └── index.js
│   ├── routes/
│   │   └── insumos.js
│   └── services/
│       └── rabbitmq.js
│
├── ms-facturacion/          # Microservicio de facturación
│   ├── package.json
│   ├── server.js
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   └── Factura.js
│   ├── routes/
│   │   └── facturas.js
│   └── services/
│       └── rabbitmq.js
│
├── docker-files/            # Dockerfiles y scripts
│   ├── ms-central.Dockerfile
│   ├── ms-inventario.Dockerfile
│   ├── ms-facturacion.Dockerfile
│   ├── build.ps1
│   └── build-and-push.ps1
│
├── k8s/                     # Manifiestos de Kubernetes
│   ├── namespace.yaml
│   ├── central-service.yaml
│   ├── inventory-service.yaml
│   ├── facturacion-services.yaml
│   ├── postgres-service.yaml
│   ├── postgres-storage.yaml
│   ├── rabbitmq.yaml
│   └── deploy-postgres.ps1
│
├── docker-compose.yml       # Para desarrollo local
└── README.md
```

## 🚀 Pre-requisitos

### Para Desarrollo Local:
- **Node.js** (v16 o superior)
- **PostgreSQL** (v12 o superior)
- **MongoDB Atlas** (cuenta configurada)
- **Docker** y **Docker Compose**
- **Git**

### Para Despliegue en Kubernetes:
- **Kubernetes** (kubectl instalado)
- **Docker** instalado
- **Cuenta en Docker Hub**
- Acceso a cluster de Kubernetes (local o cloud)

## 🚢 Despliegue Local (Desarrollo)

### 1. Clonar y configurar el proyecto

```bash
# Clonar el repositorio
git clone https://github.com/DylanGReinosoT/Examen_Distribuidas.git
cd agroflow

# Instalar dependencias en cada microservicio
cd ms-central && npm install && cd ..
cd ms-inventario && npm install && cd ..
cd ms-facturacion && npm install && cd ..
```

### 2. Configurar variables de entorno

Copiar y configurar los archivos de entorno para cada microservicio:

```bash
# MS Central
cd ms-central
cp .env.example .env
# Editar .env con tus credenciales

# MS Inventario  
cd ../ms-inventario
cp .env.example .env
# Editar .env con tus credenciales

# MS Facturación
cd ../ms-facturacion
cp .env.example .env
# Editar .env con tu URI de MongoDB Atlas
```

#### Configuración de archivos .env:

**ms-central/.env:**
```bash
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agroflow_central
DB_USER=postgres
DB_PASSWORD=admin
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
```

**ms-inventario/.env:**
```bash
PORT=3002
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agroflow_inventario
DB_USER=postgres
DB_PASSWORD=admin
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
```

**ms-facturacion/.env:**
```bash
PORT=3003
MONGODB_URI=mongodb+srv://agroflow_user:AgroFlow2024@cluster0.68ybzvl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
MS_CENTRAL_URL=http://localhost:3001
```

### 3. Configurar bases de datos

#### PostgreSQL (MS Central y MS Inventario)
```sql
-- Crear bases de datos
CREATE DATABASE agroflow_central;
CREATE DATABASE agroflow_inventario;
```

### 4. Iniciar los servicios

```bash
# Terminal 1 - Iniciar RabbitMQ con Docker
docker-compose up -d

# Terminal 2 - MS Central
cd ms-central && npm run dev

# Terminal 3 - MS Inventario
cd ms-inventario && npm run dev

# Terminal 4 - MS Facturación
cd ms-facturacion && npm run dev
```

### 5. Verificar que todo funciona

```bash
# Health checks
curl http://localhost:3001/health
curl http://localhost:3002/health  
curl http://localhost:3003/health

# RabbitMQ Management: http://localhost:15672 (admin/admin123)
```

## 🚢 Despliegue en Kubernetes

### Descripción de Microservicios para Kubernetes

#### 1. **MS Central** (Puerto 8080 en K8s)
- **Descripción**: Gestiona los datos de los agricultores y las cosechas
- **Base de datos**: PostgreSQL (`agroflow_central`)
- **Imagen Docker**: `greinoso/ms-central:latest`
- **Variables de entorno**:
  - `DB_HOST=postgres-service`
  - `DB_USER=postgres`
  - `DB_PASSWORD=admin`
  - `DB_NAME=agroflow_central`
  - `RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672`

#### 2. **MS Inventario** (Puerto 8081 en K8s)
- **Descripción**: Gestiona el stock de insumos (semillas, fertilizantes, etc.)
- **Base de datos**: PostgreSQL (`agroflow_inventario`)
- **Imagen Docker**: `greinoso/ms-inventario:latest`
- **Variables de entorno**:
  - `DB_HOST=postgres-service`
  - `DB_USER=postgres`
  - `DB_PASSWORD=admin`
  - `DB_NAME=agroflow_inventario`
  - `RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672`

#### 3. **MS Facturación** (Puerto 8082 en K8s)
- **Descripción**: Genera las facturas de las cosechas y maneja el estado de los pagos
- **Base de datos**: MongoDB Atlas (`agroflow_billing`)
- **Imagen Docker**: `greinoso/ms-facturacion:latest`
- **Variables de entorno**:
  - `MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/agroflow_billing?retryWrites=true&w=majority`
  - `RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672`
  - `MS_CENTRAL_URL=http://ms-central:3001`

### Construcción y Despliegue de Imágenes Docker

#### Paso 1: Autenticación en Docker Hub
```powershell
docker login
```

#### Paso 2: Construir y Subir Imágenes
```powershell
# Ejecutar script automatizado (Windows PowerShell)
.\docker-files\build.ps1
```

#### Paso 3: Verificar Imágenes
```powershell
docker images | findstr greinoso
```

### Despliegue en Kubernetes

#### Paso 1: Crear el Namespace
```bash
kubectl apply -f k8s/namespace.yaml
```

#### Paso 2: Configurar Secretos y ConfigMaps
```bash
# Crear secretos para PostgreSQL
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_PASSWORD=admin \
  --from-literal=DB_PASSWORD=admin \
  -n agroflow-namespace

# Crear secreto para MongoDB
kubectl create secret generic mongodb-secret \
  --from-literal=MONGO_URI="mongodb+srv://agroflow_user:AgroFlow2024@cluster0.68ybzvl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0" \
  -n agroflow-namespace

# ConfigMap para PostgreSQL Central
kubectl create configmap postgres-central-config \
  --from-literal=DB_HOST=postgres-service \
  --from-literal=DB_USER=postgres \
  --from-literal=DB_NAME=agroflow_central \
  --from-literal=DB_PORT=5432 \
  --from-literal=DB_DIALECT=postgres \
  --from-literal=POSTGRES_DB=agroflow_central \
  --from-literal=POSTGRES_USER=postgres \
  -n agroflow-namespace

# ConfigMap para PostgreSQL Inventario
kubectl create configmap postgres-inventario-config \
  --from-literal=DB_HOST=postgres-service \
  --from-literal=DB_USER=postgres \
  --from-literal=DB_NAME=agroflow_inventario \
  --from-literal=DB_PORT=5432 \
  --from-literal=DB_DIALECT=postgres \
  -n agroflow-namespace
```

#### Paso 3: Desplegar Infraestructura
```bash
# PostgreSQL
kubectl apply -f k8s/postgres-storage.yaml
kubectl apply -f k8s/postgres-service.yaml

# RabbitMQ
kubectl apply -f k8s/rabbitmq.yaml
```

#### Paso 4: Desplegar Microservicios
```bash
kubectl apply -f k8s/central-service.yaml
kubectl apply -f k8s/inventory-service.yaml
kubectl apply -f k8s/facturacion-services.yaml
```

#### Paso 5: Verificar Despliegue
```bash
# Ver todos los recursos
kubectl get all -n agroflow-namespace

# Ver estado de pods
kubectl get pods -n agroflow-namespace

# Ver logs
kubectl logs -f deployment/ms-central -n agroflow-namespace
```

### Acceso a los Servicios

#### Port-forward para pruebas:
```bash
# MS Central
kubectl port-forward service/ms-central 3001:3001 -n agroflow-namespace

# MS Inventario
kubectl port-forward service/ms-inventario 3002:3002 -n agroflow-namespace

# MS Facturación
kubectl port-forward service/ms-facturacion 3003:3003 -n agroflow-namespace

# RabbitMQ Management
kubectl port-forward service/rabbitmq 15672:15672 -n agroflow-namespace
```

## 📡 API Endpoints

### MS Central (Puerto 3001)

#### Health Check
```http
GET http://localhost:3001/health
```

#### Agricultores
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/agricultores` | Listar todos los agricultores |
| `GET` | `/api/agricultores/:id` | Obtener agricultor por ID |
| `POST` | `/api/agricultores` | Crear nuevo agricultor |
| `PUT` | `/api/agricultores/:id` | Actualizar agricultor |
| `DELETE` | `/api/agricultores/:id` | Eliminar agricultor |

**Estructura Agricultor:**
```json
{
  "nombre": "Juan Pérez",
  "finca": "Finca El Dorado",
  "ubicacion": "Valle del Cauca",
  "correo": "juan.perez@email.com"
}
```

#### Cosechas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/cosechas` | Listar todas las cosechas |
| `GET` | `/api/cosechas/:id` | Obtener cosecha por ID |
| `POST` | `/api/cosechas` | Crear nueva cosecha (dispara flujo completo) |
| `PUT` | `/api/cosechas/:id` | Actualizar cosecha |
| `PUT` | `/api/cosechas/:id/estado` | Actualizar estado (uso interno) |
| `DELETE` | `/api/cosechas/:id` | Eliminar cosecha |

**Estructura Cosecha:**
```json
{
  "agricultor_id": "uuid-del-agricultor",
  "producto": "Arroz",
  "toneladas": 5
}
```

**Productos disponibles:** `Arroz`, `Arroz Oro`, `Café`, `Café Premium`

### MS Inventario (Puerto 3002)

#### Health Check
```http
GET http://localhost:3002/health
```

#### Dashboard
```http
GET http://localhost:3002/api/dashboard
```

#### Insumos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/insumos` | Listar todos los insumos |
| `GET` | `/api/insumos/:id` | Obtener insumo por ID |
| `GET` | `/api/insumos/stock/bajo?limite=50` | Insumos con stock bajo |
| `GET` | `/api/insumos/categoria/:categoria` | Insumos por categoría |
| `POST` | `/api/insumos` | Crear nuevo insumo |
| `PUT` | `/api/insumos/:id` | Actualizar insumo |
| `PUT` | `/api/insumos/:id/stock` | Actualizar solo stock |
| `DELETE` | `/api/insumos/:id` | Eliminar insumo |

**Estructura Insumo:**
```json
{
  "nombre_insumo": "Semilla Arroz L-23",
  "stock": 500,
  "unidad_medida": "kg",
  "categoria": "Semillas"
}
```

### MS Facturación (Puerto 3003)

#### Health Check
```http
GET http://localhost:3003/health
```

#### Facturas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/facturas` | Listar todas las facturas |
| `GET` | `/api/facturas?pagina=1&limite=10&pagado=false` | Facturas con paginación |
| `GET` | `/api/facturas/:id` | Obtener factura por ID |
| `GET` | `/api/facturas/cosecha/:cosecha_id` | Obtener factura por cosecha |
| `GET` | `/api/facturas/estadisticas/resumen` | Estadísticas de facturación |
| `PUT` | `/api/facturas/:id/pagar` | Marcar factura como pagada |
| `POST` | `/api/facturas` | Crear factura manual (testing) |
| `DELETE` | `/api/facturas/:id` | Eliminar factura |

## 🔄 Flujo del Sistema

### Flujo Automático al Crear Cosecha:

1. **MS Central** recibe POST `/api/cosechas`
2. **MS Central** publica evento `nueva_cosecha` → RabbitMQ
3. **MS Inventario** consume evento → Calcula y ajusta insumos → Publica `inventario_ajustado`
4. **MS Facturación** consume ambos eventos → Genera factura → Notifica MS Central
5. **MS Central** actualiza `factura_id` en la cosecha

### Cálculo de Insumos por Producto:

| Producto | Insumos Requeridos |
|----------|-------------------|
| **Arroz** | 5kg Semilla Arroz L-23 + 2kg Fertilizante N-PK por tonelada |
| **Arroz Oro** | 5kg Semilla Arroz L-23 + 2kg Fertilizante N-PK por tonelada |
| **Café** | 3kg Semilla Café Premium + 2kg Fertilizante Orgánico por tonelada |
| **Café Premium** | 3kg Semilla Café Premium + 2kg Fertilizante Orgánico por tonelada |

### Precios por Tonelada:

| Producto | Precio por Tonelada |
|----------|-------------------|
| **Arroz** | $120 |
| **Arroz Oro** | $120 |
| **Café** | $250 |
| **Café Premium** | $300 |

## 🧪 Flujo de Pruebas Completo

### Paso 1: Crear Datos Iniciales

#### 1.1 Crear Agricultor
```http
POST http://localhost:3001/api/agricultores
Content-Type: application/json

{
  "nombre": "María González",
  "finca": "Hacienda Verde",
  "ubicacion": "Tolima",
  "correo": "maria.gonzalez@email.com"
}
```

#### 1.2 Crear Insumos
```http
POST http://localhost:3002/api/insumos
Content-Type: application/json

{
  "nombre_insumo": "Semilla Arroz L-23",
  "stock": 500,
  "unidad_medida": "kg",
  "categoria": "Semillas"
}
```

```http
POST http://localhost:3002/api/insumos
Content-Type: application/json

{
  "nombre_insumo": "Fertilizante N-PK",
  "stock": 1000,
  "unidad_medida": "kg",
  "categoria": "Fertilizantes"
}
```

### Paso 2: Probar Flujo Completo

#### 2.1 Crear Cosecha (Dispara Flujo Automático)
```http
POST http://localhost:3001/api/cosechas
Content-Type: application/json

{
  "agricultor_id": "COPIAR_ID_DEL_AGRICULTOR_CREADO",
  "producto": "Arroz",
  "toneladas": 5
}
```

**Cálculos esperados:**
- Semilla Arroz L-23: 5t × 5kg/t = 25kg (Stock: 500 → 475kg)
- Fertilizante N-PK: 5t × 2kg/t = 10kg (Stock: 1000 → 990kg)
- Factura: 5t × $120/t = $600

## 🧪 Comandos Útiles

### Docker
```powershell
# Listar imágenes locales
docker images

# Reconstruir imagen específica
docker build -f docker-files/ms-central.Dockerfile -t greinoso/ms-central:latest ./ms-central/
```

### Kubernetes
```bash
# Escalar deployment
kubectl scale deployment ms-central --replicas=3 -n agroflow-namespace

# Ver logs en tiempo real
kubectl logs -f deployment/ms-central -n agroflow-namespace

# Acceso directo a PostgreSQL
kubectl exec -it deployment/postgres-deployment -n agroflow-namespace -- psql -U postgres -d agroflow_central

# Eliminar todo el namespace
kubectl delete namespace agroflow-namespace

# Verificar eventos
kubectl get events -n agroflow-namespace --sort-by='.lastTimestamp'
```

### Solución de Problemas
```bash
# Describir un pod problemático
kubectl describe pod <pod-name> -n agroflow-namespace

# Ver logs específicos
kubectl logs <pod-name> -n agroflow-namespace

# Reiniciar deployment
kubectl rollout restart deployment/ms-central -n agroflow-namespace
```

## 📊 URLs de Gestión

### Desarrollo Local
- **RabbitMQ Management:** http://localhost:15672 (admin/admin123)
- **MS Central Health:** http://localhost:3001/health
- **MS Inventario Health:** http://localhost:3002/health
- **MS Facturación Health:** http://localhost:3003/health

### Kubernetes (con port-forward)
- **RabbitMQ Management:** http://localhost:15672 (admin/admin123)
- **MS Central Health:** http://localhost:3001/health
- **MS Inventario Health:** http://localhost:3002/health
- **MS Facturación Health:** http://localhost:3003/health

## 👥 Integrantes del Grupo

- **Desarrollado por**: Karla Cajas, Mateo Condor, Gabriel Reinoso
- **Docker Hub**: [greinoso](https://hub.docker.com/u/greinoso)
- **Namespace Kubernetes**: `agroflow-namespace`
- **Repositorio**: [Examen_Distribuidas](https://github.com/DylanGReinosoT/Examen_Distribuidas)



### Base de Datos
- **PostgreSQL**: Dos bases de datos separadas (`agroflow_central` y `agroflow_inventario`)
- **MongoDB Atlas**: Una base de datos en la nube para facturas

### Comunicación entre Microservicios
1. **MS Central** → **MS Inventario**: Via RabbitMQ (nueva_cosecha)
2. **MS Inventario** → **MS Facturación**: Via RabbitMQ (inventario_ajustado)  
3. **MS Facturación** → **MS Central**: Via HTTP REST (actualizar estado cosecha)

### Configuración de Réplicas en Kubernetes
- **ms-central**: 2 réplicas
- **ms-inventario**: 2 réplicas  
- **ms-facturacion**: 2 réplicas
- **postgres-deployment**: 1 réplica
- **rabbitmq**: 1 réplica

---

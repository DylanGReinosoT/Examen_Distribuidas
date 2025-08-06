# AgroFlow - Sistema de Microservicios Agrícolas

Sistema distribuido de microservicios para la gestión integral de procesos agrícolas con comunicación asíncrona mediante RabbitMQ.

## 🚀 Instalación y Ejecución

### Pre-requisitos
- **Node.js** (v16 o superior)
- **PostgreSQL** (v12 o superior)
- **Docker** y **Docker Compose**
- **Git**

### 1. Clonar y configurar el proyecto

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd agroflow

# Instalar dependencias en cada microservicio
cd ms-central; npm install; cd ..
cd ms-inventario; npm install; cd ..
cd ms-facturacion; npm install; cd ..
```

### 2. Configurar variables de entorno

Copiar y configurar los archivos de entorno para cada microservicio:

```bash
# MS Central
cd ms-central
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL

# MS Inventario  
cd ../ms-inventario
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL

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
DB_USER=TU_USER
DB_PASSWORD=TU_PASSWORD
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
```

**ms-inventario/.env:**
```bash
PORT=3002
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agroflow_inventario
DB_USER=TU_USER
DB_PASSWORD=TU_PASSWORD
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
```

**ms-facturacion/.env:**
```bash
PORT=3003
MONGODB_URI=TU_MONGODB_URI
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

#### MongoDB Atlas (MS Facturación)
- Crear un cluster en [MongoDB Atlas](https://cloud.mongodb.com)
- Obtener la URI de conexión
- Configurarla en `ms-facturacion/.env`

### 4. Iniciar los servicios

```bash
# Terminal 1 - Iniciar RabbitMQ con Docker
docker-compose up -d

# Terminal 2 - MS Central
cd ms-central; npm run dev

# Terminal 3 - MS Inventario
cd ms-inventario; npm run dev

# Terminal 4 - MS Facturación
cd ms-facturacion; npm run dev
```

### 5. Verificar que todo funciona

```bash
# Health checks
curl http://localhost:3001/health
curl http://localhost:3002/health  
curl http://localhost:3003/health

# RabbitMQ Management
# Abrir: http://localhost:15672 (admin/admin123)
```

### 🔧 Solución de Problemas Comunes

#### Error de conexión a PostgreSQL
- Verificar que PostgreSQL esté ejecutándose
- Comprobar credenciales en archivos `.env`
- Verificar que las bases de datos existan

#### Error de conexión a RabbitMQ
```bash
# Reiniciar contenedor de RabbitMQ
docker-compose down
docker-compose up -d
```

#### Error de conexión a MongoDB
- Verificar la URI de MongoDB Atlas en `.env`
- Comprobar que la IP esté en la whitelist de MongoDB Atlas
- Verificar credenciales de usuario

#### Puerto ocupado
```bash
# Verificar qué proceso usa el puerto
netstat -ano | findstr :3001
# Cambiar puerto en archivo .env correspondiente
```

## 🏗️ Arquitectura del Sistema

- **MS Central** (Puerto 3001): Gestión de agricultores y cosechas - PostgreSQL
- **MS Inventario** (Puerto 3002): Control de stock de insumos - PostgreSQL  
- **MS Facturación** (Puerto 3003): Generación automática de facturas - MongoDB Atlas
- **RabbitMQ**: Comunicación asíncrona entre microservicios

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

**Estructura Actualización Stock:**
```json
{
  "cantidad": 100,
  "operacion": "sumar" // "sumar", "restar", "establecer"
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

**Estructura Pago:**
```json
{
  "metodo_pago": "transferencia" // "efectivo", "transferencia", "cheque", "tarjeta"
}
```

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

### ✅ Pre-requisitos:
Asegúrate de haber completado la instalación y que todos los servicios estén ejecutándose:

```bash
# Verificar que todos los servicios estén activos
curl http://localhost:3001/health  # MS Central
curl http://localhost:3002/health  # MS Inventario  
curl http://localhost:3003/health  # MS Facturación

# Verificar RabbitMQ Management
# http://localhost:15672 (admin/admin123)
```

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

**Resultado esperado:** Status 201, objeto agricultor con `agricultor_id` generado.

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

```http
POST http://localhost:3002/api/insumos
Content-Type: application/json

{
  "nombre_insumo": "Semilla Café Premium",
  "stock": 300,
  "unidad_medida": "kg",
  "categoria": "Semillas"
}
```

```http
POST http://localhost:3002/api/insumos
Content-Type: application/json

{
  "nombre_insumo": "Fertilizante Orgánico",
  "stock": 800,
  "unidad_medida": "kg",
  "categoria": "Fertilizantes"
}
```

#### 1.3 Verificar Estado Inicial
```http
GET http://localhost:3002/api/insumos
```

**Resultado esperado:** Lista de 4 insumos con stocks iniciales.

### Paso 2: Probar Flujo Completo con Cosecha de Arroz

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

#### 2.2 Verificar Ajuste de Inventario
```http
GET http://localhost:3002/api/insumos
```

**Resultado esperado:**
- Semilla Arroz L-23: stock = 475kg
- Fertilizante N-PK: stock = 990kg

#### 2.3 Verificar Generación de Factura
```http
GET http://localhost:3003/api/facturas
```

**Resultado esperado:** Factura con `monto_total: 600`, `pagado: false`

#### 2.4 Verificar Estado de Cosecha
```http
GET http://localhost:3001/api/cosechas/{cosecha_id}
```

**Resultado esperado:** 
- Cosecha con `estado: "FACTURADA"`
- Información de factura `factura_id` incluida

### Paso 3: Probar Diferentes Productos

#### 3.1 Cosecha de Café
```http
POST http://localhost:3001/api/cosechas
Content-Type: application/json

{
  "agricultor_id": "MISMO_ID_AGRICULTOR",
  "producto": "Café Premium",
  "toneladas": 2
}
```

**Cálculos esperados:**
- Semilla Café Premium: 2t × 3kg/t = 6kg (Stock: 300 → 294kg)
- Fertilizante Orgánico: 2t × 2kg/t = 4kg (Stock: 800 → 796kg)
- Factura: 2t × $300/t = $600

### Paso 4: Probar Gestión de Facturas

#### 4.1 Listar Facturas con Filtros
```http
GET http://localhost:3003/api/facturas?pagado=false&limite=5
```

#### 4.2 Marcar Factura como Pagada
```http
PUT http://localhost:3003/api/facturas/{factura_id}/pagar
Content-Type: application/json

{
  "metodo_pago": "transferencia"
}
```

## 📊 URLs de Gestión

- **RabbitMQ Management:** http://localhost:15672 (admin/admin123)
- **MS Central Health:** http://localhost:3001/health
- **MS Inventario Health:** http://localhost:3002/health
- **MS Facturación Health:** http://localhost:3003/health

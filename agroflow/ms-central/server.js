const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize } = require('./models');
const rabbitmqService = require('./services/rabbitmq');
const agricultoresRoutes = require('./routes/agricultores');
const cosechasRoutes = require('./routes/cosechas');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/agricultores', agricultoresRoutes);
app.use('/api/cosechas', cosechasRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    service: 'MS Central',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Inicializar servidor
async function startServer() {
  try {
    // Conectar a PostgreSQL
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL');
    
    // Sincronizar modelos (solo en desarrollo)
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados');

    // Conectar a RabbitMQ
    await rabbitmqService.connect();

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 MS Central ejecutándose en puerto ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('🛑 Cerrando MS Central...');
  await rabbitmqService.close();
  await sequelize.close();
  process.exit(0);
});

startServer();
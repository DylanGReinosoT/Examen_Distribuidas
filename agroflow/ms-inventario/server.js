const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize } = require('./models');
const rabbitmqService = require('./services/rabbitmq');
const insumosRoutes = require('./routes/insumos');

const app = express();
const PORT = process.env.PORT || 3002;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/insumos', insumosRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    service: 'MS Inventario',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Endpoint para ver estado del inventario
app.get('/api/dashboard', async (req, res) => {
  try {
    const { Insumo } = require('./models');
    const { Op } = require('sequelize');
    
    const totalInsumos = await Insumo.count();
    const stockBajo = await Insumo.count({
      where: { stock: { [Op.lt]: 50 } }
    });
    
    const insumosPorCategoria = await Insumo.findAll({
      attributes: [
        'categoria',
        [sequelize.fn('COUNT', sequelize.col('categoria')), 'cantidad'],
        [sequelize.fn('SUM', sequelize.col('stock')), 'stock_total']
      ],
      group: ['categoria']
    });

    res.json({
      resumen: {
        total_insumos: totalInsumos,
        stock_bajo: stockBajo,
        categorias: insumosPorCategoria.length
      },
      por_categoria: insumosPorCategoria
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inicializar servidor
async function startServer() {
  try {
    // Conectar a PostgreSQL
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL');
    
    // Sincronizar modelos
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados');

    // Conectar a RabbitMQ
    await rabbitmqService.connect();

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 MS Inventario ejecutándose en puerto ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📈 Dashboard: http://localhost:${PORT}/api/dashboard`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('🛑 Cerrando MS Inventario...');
  await rabbitmqService.close();
  await sequelize.close();
  process.exit(0);
});

startServer();
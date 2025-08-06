const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/database');
const rabbitmqService = require('./services/rabbitmq');
const facturasRoutes = require('./routes/facturas');
const Factura = require('./models/Factura');

const app = express();
const PORT = process.env.PORT || 3003;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/facturas', facturasRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    service: 'MS Facturación',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Endpoint para dashboard
app.get('/api/dashboard', async (req, res) => {
  try {
    const totalFacturas = await Factura.countDocuments();
    const facturasPagadas = await Factura.countDocuments({ pagado: true });
    const facturasPendientes = await Factura.countDocuments({ pagado: false });

    // Facturas del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const facturasMes = await Factura.countDocuments({
      fecha_emision: { $gte: inicioMes }
    });

    const ingresosMes = await Factura.aggregate([
      { $match: { fecha_emision: { $gte: inicioMes }, pagado: true } },
      { $group: { _id: null, total: { $sum: '$monto_total' } } }
    ]);

    res.json({
      resumen: {
        total_facturas: totalFacturas,
        facturas_pagadas: facturasPagadas,
        facturas_pendientes: facturasPendientes,
        facturas_mes: facturasMes,
        ingresos_mes: ingresosMes[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inicializar servidor
async function startServer() {
  try {
    // Conectar a MongoDB
    await connectDB();

    // Conectar a RabbitMQ
    await rabbitmqService.connect();

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 MS Facturación ejecutándose en puerto ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`💰 Dashboard: http://localhost:${PORT}/api/dashboard`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('🛑 Cerrando MS Facturación...');
  await rabbitmqService.close();
  const mongoose = require('mongoose');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();
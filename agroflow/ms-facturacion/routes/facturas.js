const express = require('express');
const Factura = require('../models/Factura');
const router = express.Router();

// GET /facturas - Obtener todas las facturas
router.get('/', async (req, res) => {
  try {
    const { pagina = 1, limite = 10, pagado } = req.query;
    
    const filtro = {};
    if (pagado !== undefined) {
      filtro.pagado = pagado === 'true';
    }

    const facturas = await Factura.find(filtro)
      .sort({ fecha_emision: -1 })
      .limit(limite * 1)
      .skip((pagina - 1) * limite);

    const total = await Factura.countDocuments(filtro);

    res.json({
      facturas,
      paginacion: {
        pagina_actual: parseInt(pagina),
        total_paginas: Math.ceil(total / limite),
        total_facturas: total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /facturas/:id - Obtener factura por ID
router.get('/:id', async (req, res) => {
  try {
    const factura = await Factura.findOne({ 
      factura_id: req.params.id 
    });
    
    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    res.json(factura);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /facturas/cosecha/:cosecha_id - Obtener factura por cosecha ID
router.get('/cosecha/:cosecha_id', async (req, res) => {
  try {
    const factura = await Factura.findOne({ 
      cosecha_id: req.params.cosecha_id 
    });
    
    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada para esta cosecha' });
    }
    res.json(factura);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /facturas/:id/pagar - Marcar factura como pagada
router.put('/:id/pagar', async (req, res) => {
  try {
    const { metodo_pago } = req.body;
    
    const factura = await Factura.findOneAndUpdate(
      { factura_id: req.params.id },
      {
        pagado: true,
        metodo_pago: metodo_pago || 'efectivo',
        fecha_pago: new Date()
      },
      { new: true }
    );

    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    console.log(`💳 Factura ${req.params.id} marcada como pagada`);
    res.json(factura);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /facturas/estadisticas/resumen - Resumen estadístico
router.get('/estadisticas/resumen', async (req, res) => {
  try {
    const totalFacturas = await Factura.countDocuments();
    const facturasPagadas = await Factura.countDocuments({ pagado: true });
    const facturasPendientes = await Factura.countDocuments({ pagado: false });

    const montoTotal = await Factura.aggregate([
      { $group: { _id: null, total: { $sum: '$monto_total' } } }
    ]);

    const montoPagado = await Factura.aggregate([
      { $match: { pagado: true } },
      { $group: { _id: null, total: { $sum: '$monto_total' } } }
    ]);

    const facturasPorMes = await Factura.aggregate([
      {
        $group: {
          _id: {
            año: { $year: '$fecha_emision' },
            mes: { $month: '$fecha_emision' }
          },
          cantidad: { $sum: 1 },
          monto_total: { $sum: '$monto_total' }
        }
      },
      { $sort: { '_id.año': -1, '_id.mes': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      resumen: {
        total_facturas: totalFacturas,
        facturas_pagadas: facturasPagadas,
        facturas_pendientes: facturasPendientes,
        monto_total: montoTotal[0]?.total || 0,
        monto_pagado: montoPagado[0]?.total || 0,
        monto_pendiente: (montoTotal[0]?.total || 0) - (montoPagado[0]?.total || 0)
      },
      por_mes: facturasPorMes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /facturas - Crear factura manualmente (para pruebas)
router.post('/', async (req, res) => {
  try {
    const factura = new Factura(req.body);
    await factura.save();
    res.status(201).json(factura);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /facturas/:id - Eliminar factura
router.delete('/:id', async (req, res) => {
  try {
    const factura = await Factura.findOneAndDelete({ 
      factura_id: req.params.id 
    });
    
    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
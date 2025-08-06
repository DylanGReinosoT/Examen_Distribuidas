const express = require('express');
const { Cosecha, Agricultor } = require('../models');
const rabbitmqService = require('../services/rabbitmq');
const router = express.Router();

// GET /cosechas - Obtener todas las cosechas
router.get('/', async (req, res) => {
  try {
    const cosechas = await Cosecha.findAll({
      include: [{
        model: Agricultor,
        as: 'agricultor',
        attributes: ['nombre', 'finca']
      }]
    });
    res.json(cosechas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /cosechas/:id - Obtener cosecha por ID
router.get('/:id', async (req, res) => {
  try {
    const cosecha = await Cosecha.findByPk(req.params.id, {
      include: [{
        model: Agricultor,
        as: 'agricultor'
      }]
    });
    
    if (!cosecha) {
      return res.status(404).json({ error: 'Cosecha no encontrada' });
    }
    res.json(cosecha);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /cosechas - Crear nueva cosecha
router.post('/', async (req, res) => {
  try {
    // Validar que el agricultor exista
    const agricultor = await Agricultor.findByPk(req.body.agricultor_id);
    if (!agricultor) {
      return res.status(400).json({ error: 'Agricultor no encontrado' });
    }

    // Crear cosecha
    const cosecha = await Cosecha.create(req.body);

    // Publicar evento para RabbitMQ
    await rabbitmqService.publishEvent('nueva_cosecha', {
      cosecha_id: cosecha.cosecha_id,
      producto: cosecha.producto,
      toneladas: parseFloat(cosecha.toneladas),
      requiere_insumos: getInsumosRequeridos(cosecha.producto)
    });

    res.status(201).json(cosecha);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /cosechas/:id/estado - Actualizar estado de cosecha (usado por MS Facturación)
router.put('/:id/estado', async (req, res) => {
  try {
    console.log(`📝 Actualizando estado de cosecha ${req.params.id}`);
    console.log(`📋 Datos recibidos:`, req.body);
    
    const cosecha = await Cosecha.findByPk(req.params.id);
    if (!cosecha) {
      console.log(`❌ Cosecha ${req.params.id} no encontrada`);
      return res.status(404).json({ error: 'Cosecha no encontrada' });
    }

    const [updated] = await Cosecha.update(
      { 
        estado: req.body.estado, 
        factura_id: req.body.factura_id 
      },
      { where: { cosecha_id: req.params.id } }
    );
    
    if (updated) {
      const cosechaActualizada = await Cosecha.findByPk(req.params.id);
      console.log(`✅ Estado actualizado: ${cosechaActualizada.estado}, Factura: ${cosechaActualizada.factura_id}`);
      res.json(cosechaActualizada);
    } else {
      console.log(`❌ No se pudo actualizar cosecha ${req.params.id}`);
      res.status(404).json({ error: 'No se pudo actualizar la cosecha' });
    }
  } catch (error) {
    console.error('❌ Error actualizando estado:', error);
    res.status(400).json({ error: error.message });
  }
});

// Función helper para determinar insumos requeridos
function getInsumosRequeridos(producto) {
  const insumosPorProducto = {
    'Arroz': ['Semilla Arroz L-23', 'Fertilizante N-PK'],
    'Arroz Oro': ['Semilla Arroz L-23', 'Fertilizante N-PK'],
    'Café': ['Semilla Café Premium', 'Fertilizante Orgánico'],
    'Café Premium': ['Semilla Café Premium', 'Fertilizante Orgánico']
  };
  
  return insumosPorProducto[producto] || ['Fertilizante N-PK'];
}

module.exports = router;

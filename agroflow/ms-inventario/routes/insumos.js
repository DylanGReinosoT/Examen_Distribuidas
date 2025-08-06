const express = require('express');
const { Insumo } = require('../models');
const router = express.Router();

// GET /insumos/stock/bajo - DEBE IR PRIMERO (antes de /:id)
router.get('/stock/bajo', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const limite = req.query.limite || 50;
    
    const insumos = await Insumo.findAll({
      where: {
        stock: {
          [Op.lt]: limite
        }
      },
      order: [['stock', 'ASC']]
    });
    res.json(insumos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /insumos/categoria/:categoria - ANTES de /:id
router.get('/categoria/:categoria', async (req, res) => {
  try {
    const insumos = await Insumo.findAll({
      where: { categoria: req.params.categoria },
      order: [['nombre_insumo', 'ASC']]
    });
    res.json(insumos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /insumos - Obtener todos los insumos
router.get('/', async (req, res) => {
  try {
    const insumos = await Insumo.findAll({
      order: [['categoria', 'ASC'], ['nombre_insumo', 'ASC']]
    });
    res.json(insumos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /insumos/:id - Obtener insumo por ID (DESPUÉS de rutas específicas)
router.get('/:id', async (req, res) => {
  try {
    const insumo = await Insumo.findByPk(req.params.id);
    if (!insumo) {
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }
    res.json(insumo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /insumos - Crear nuevo insumo
router.post('/', async (req, res) => {
  try {
    const insumo = await Insumo.create(req.body);
    res.status(201).json(insumo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /insumos/:id - Actualizar insumo
router.put('/:id', async (req, res) => {
  try {
    const [updated] = await Insumo.update(
      { ...req.body, ultima_actualizacion: new Date() },
      { where: { insumo_id: req.params.id } }
    );
    
    if (updated) {
      const insumo = await Insumo.findByPk(req.params.id);
      res.json(insumo);
    } else {
      res.status(404).json({ error: 'Insumo no encontrado' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /insumos/:id/stock - Actualizar solo el stock
router.put('/:id/stock', async (req, res) => {
  try {
    const { cantidad, operacion } = req.body; // operacion: 'sumar' | 'restar' | 'establecer'
    
    const insumo = await Insumo.findByPk(req.params.id);
    if (!insumo) {
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }

    let nuevoStock;
    switch (operacion) {
      case 'sumar':
        nuevoStock = insumo.stock + cantidad;
        break;
      case 'restar':
        nuevoStock = Math.max(0, insumo.stock - cantidad);
        break;
      case 'establecer':
      default:
        nuevoStock = cantidad;
    }

    await insumo.update({
      stock: nuevoStock,
      ultima_actualizacion: new Date()
    });

    res.json(insumo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /insumos/:id - Eliminar insumo
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Insumo.destroy({
      where: { insumo_id: req.params.id }
    });
    
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Insumo no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
const express = require('express');
const { Agricultor } = require('../models');
const router = express.Router();

// GET /agricultores - Obtener todos los agricultores
router.get('/', async (req, res) => {
  try {
    const agricultores = await Agricultor.findAll();
    res.json(agricultores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /agricultores/:id - Obtener agricultor por ID
router.get('/:id', async (req, res) => {
  try {
    const agricultor = await Agricultor.findByPk(req.params.id);
    if (!agricultor) {
      return res.status(404).json({ error: 'Agricultor no encontrado' });
    }
    res.json(agricultor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /agricultores - Crear nuevo agricultor
router.post('/', async (req, res) => {
  try {
    const agricultor = await Agricultor.create(req.body);
    res.status(201).json(agricultor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /agricultores/:id - Actualizar agricultor
router.put('/:id', async (req, res) => {
  try {
    const [updated] = await Agricultor.update(req.body, {
      where: { agricultor_id: req.params.id }
    });
    
    if (updated) {
      const agricultor = await Agricultor.findByPk(req.params.id);
      res.json(agricultor);
    } else {
      res.status(404).json({ error: 'Agricultor no encontrado' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /agricultores/:id - Eliminar agricultor
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Agricultor.destroy({
      where: { agricultor_id: req.params.id }
    });
    
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Agricultor no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
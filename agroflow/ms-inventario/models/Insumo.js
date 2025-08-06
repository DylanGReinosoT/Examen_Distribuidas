const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Insumo = sequelize.define('Insumo', {
  insumo_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  nombre_insumo: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  unidad_medida: {
    type: DataTypes.STRING(10),
    defaultValue: 'kg'
  },
  categoria: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  ultima_actualizacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'insumos',
  timestamps: false
});

module.exports = Insumo;
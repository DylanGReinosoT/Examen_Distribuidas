const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cosecha = sequelize.define('Cosecha', {
  cosecha_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  agricultor_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  producto: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  toneladas: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  estado: {
    type: DataTypes.STRING(20),
    defaultValue: 'REGISTRADA'
  },
  creado_en: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  factura_id: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'cosechas',
  timestamps: false
});

module.exports = Cosecha;
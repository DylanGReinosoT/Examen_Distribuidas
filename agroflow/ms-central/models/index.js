const sequelize = require('../config/database');
const Agricultor = require('./Agricultor');
const Cosecha = require('./Cosecha');

// Definir asociaciones
Agricultor.hasMany(Cosecha, { 
  foreignKey: 'agricultor_id',
  as: 'cosechas'
});

Cosecha.belongsTo(Agricultor, { 
  foreignKey: 'agricultor_id',
  as: 'agricultor'
});

module.exports = {
  sequelize,
  Agricultor,
  Cosecha
};

const mongoose = require('mongoose');

const facturaSchema = new mongoose.Schema({
  factura_id: {
    type: String,
    required: true,
    unique: true,
    default: () => require('uuid').v4()
  },
  cosecha_id: {
    type: String,
    required: true
  },
  monto_total: {
    type: Number,
    required: true,
    min: 0
  },
  pagado: {
    type: Boolean,
    default: false
  },
  fecha_emision: {
    type: Date,
    default: Date.now
  },
  metodo_pago: {
    type: String,
    enum: ['efectivo', 'transferencia', 'cheque', 'tarjeta'],
    default: undefined // Permitir undefined para facturas no pagadas
  },
  codigo_qr: {
    type: String,
    default: null
  },
  detalles_cosecha: {
    producto: String,
    toneladas: Number,
    precio_por_tonelada: Number
  },
  fecha_pago: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'facturas'
});

// Índices
facturaSchema.index({ cosecha_id: 1 });
facturaSchema.index({ fecha_emision: -1 });
facturaSchema.index({ pagado: 1 });

module.exports = mongoose.model('Factura', facturaSchema);
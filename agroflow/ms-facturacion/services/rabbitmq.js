const amqp = require('amqplib');
const Factura = require('../models/Factura');
const axios = require('axios');

class RabbitMQService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.facturasEnProceso = new Map(); // Para evitar duplicados
  }

  async connect() {
    try {
      console.log('🔄 Conectando a RabbitMQ desde MS Facturación...');
      this.connection = await amqp.connect(process.env.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      
      // Declarar exchange y cola
      await this.channel.assertExchange('cosechas', 'topic', { durable: true });
      await this.channel.assertQueue('cola_facturacion', { durable: true });
      
      // Bindear cola al exchange
      await this.channel.bindQueue('cola_facturacion', 'cosechas', 'nueva_cosecha');
      await this.channel.bindQueue('cola_facturacion', 'cosechas', 'inventario_ajustado');
      
      // Consumir mensajes
      await this.channel.consume('cola_facturacion', this.handleMessage.bind(this), {
        noAck: false
      });
      
      console.log('✅ Conectado a RabbitMQ - Escuchando cola_facturacion');
      console.log('🎯 Esperando mensajes: nueva_cosecha, inventario_ajustado');
    } catch (error) {
      console.error('❌ Error conectando a RabbitMQ:', error.message);
      setTimeout(() => this.connect(), 5000);
    }
  }

  async handleMessage(msg) {
    if (msg) {
      try {
        const message = JSON.parse(msg.content.toString());
        console.log('📨 Mensaje recibido en MS Facturación:', message.event_type);
        console.log('📋 Payload:', JSON.stringify(message.payload, null, 2));

        switch (message.event_type) {
          case 'nueva_cosecha':
            await this.procesarNuevaCosecha(message.payload);
            break;
          case 'inventario_ajustado':
            await this.procesarInventarioAjustado(message.payload);
            break;
        }

        this.channel.ack(msg);
      } catch (error) {
        console.error('❌ Error procesando mensaje:', error);
        this.channel.nack(msg, false, false);
      }
    }
  }

  async procesarNuevaCosecha(payload) {
    try {
      const { cosecha_id, producto, toneladas } = payload;
      
      console.log(`💰 Iniciando proceso de facturación para cosecha ${cosecha_id}`);
      
      // Verificar si ya existe una factura para esta cosecha
      const facturaExistente = await Factura.findOne({ cosecha_id });
      if (facturaExistente) {
        console.log(`⚠️ Ya existe factura para cosecha ${cosecha_id}: ${facturaExistente.factura_id}`);
        return;
      }

      // Marcar como en proceso para evitar duplicados
      if (this.facturasEnProceso.has(cosecha_id)) {
        console.log(`⚠️ Factura para cosecha ${cosecha_id} ya está en proceso`);
        return;
      }
      this.facturasEnProceso.set(cosecha_id, true);

      // Calcular monto según tabla de precios
      const preciosPorTonelada = {
        'Arroz': 120,
        'Arroz Oro': 120,
        'Café': 250,
        'Café Premium': 300
      };

      const precioPorTonelada = preciosPorTonelada[producto] || 100;
      const montoTotal = parseFloat((toneladas * precioPorTonelada).toFixed(2));

      // Crear factura (SIN metodo_pago porque aún no está pagada)
      const factura = new Factura({
        cosecha_id,
        monto_total: montoTotal,
        detalles_cosecha: {
          producto,
          toneladas,
          precio_por_tonelada: precioPorTonelada
        },
        codigo_qr: this.generarCodigoQR(cosecha_id, montoTotal),
        pagado: false
        // metodo_pago se queda undefined hasta que se pague
      });

      await factura.save();
      
      console.log(`✅ Factura creada: ${factura.factura_id}`);
      console.log(`💰 ${producto} ${toneladas}t × $${precioPorTonelada} = $${montoTotal}`);
      
      // Limpiar del proceso
      this.facturasEnProceso.delete(cosecha_id);
      
    } catch (error) {
      console.error('❌ Error creando factura:', error);
      this.facturasEnProceso.delete(payload.cosecha_id);
    }
  }

  async procesarInventarioAjustado(payload) {
    try {
      const { cosecha_id, status } = payload;
      
      console.log(`📦 Inventario ajustado para cosecha ${cosecha_id}: ${status}`);
      
      if (status === 'OK') {
        // Buscar la factura que debería haberse creado
        const factura = await Factura.findOne({ cosecha_id });
        
        if (factura) {
          // Notificar al MS Central que la factura está lista
          console.log(`📤 Notificando a MS Central sobre factura ${factura.factura_id}`);
          await this.notificarCentral(cosecha_id, factura.factura_id);
          console.log(`✅ Facturación confirmada para cosecha ${cosecha_id}`);
        } else {
          console.log(`⚠️ No se encontró factura para cosecha ${cosecha_id}, esperando...`);
          // Esperar un momento y reintentar
          setTimeout(async () => {
            const facturaRetry = await Factura.findOne({ cosecha_id });
            if (facturaRetry) {
              await this.notificarCentral(cosecha_id, facturaRetry.factura_id);
            } else {
              console.log(`❌ Factura no encontrada después de reintento para cosecha ${cosecha_id}`);
            }
          }, 2000);
        }
      } else {
        console.log(`⚠️ Inventario insuficiente para cosecha ${cosecha_id}. Factura creada pero marcada como pendiente.`);
      }
      
    } catch (error) {
      console.error('❌ Error procesando inventario ajustado:', error);
    }
  }

  async notificarCentral(cosecha_id, factura_id) {
    try {
      const url = `${process.env.MS_CENTRAL_URL}/api/cosechas/${cosecha_id}/estado`;
      console.log(`📞 Llamando a MS Central: PUT ${url}`);
      
      const response = await axios.put(url, {
        estado: 'FACTURADA',
        factura_id: factura_id
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Estado actualizado en MS Central: ${response.status}`);
      console.log(`📋 Cosecha ${cosecha_id} → Factura ${factura_id}`);
      
    } catch (error) {
      console.error('❌ Error notificando a MS Central:', error.response?.data || error.message);
      
      // Reintentar una vez más
      setTimeout(async () => {
        try {
          const retryResponse = await axios.put(
            `${process.env.MS_CENTRAL_URL}/api/cosechas/${cosecha_id}/estado`,
            { estado: 'FACTURADA', factura_id: factura_id }
          );
          console.log(`✅ Reintento exitoso: ${retryResponse.status}`);
        } catch (retryError) {
          console.error('❌ Error en reintento:', retryError.message);
        }
      }, 3000);
    }
  }

  generarCodigoQR(cosecha_id, monto) {
    return `QR-${cosecha_id.substring(0, 8)}-${monto}`;
  }

  async close() {
    if (this.connection) {
      await this.connection.close();
    }
  }
}

module.exports = new RabbitMQService();
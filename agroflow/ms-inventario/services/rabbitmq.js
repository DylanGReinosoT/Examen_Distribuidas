const amqp = require('amqplib');
const { Insumo } = require('../models');

class RabbitMQService {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      
      // Declarar exchange y cola
      await this.channel.assertExchange('cosechas', 'topic', { durable: true });
      await this.channel.assertQueue('cola_inventario', { durable: true });
      
      // Bindear cola al exchange con routing key
      await this.channel.bindQueue('cola_inventario', 'cosechas', 'nueva_cosecha');
      
      // Consumir mensajes
      await this.channel.consume('cola_inventario', this.handleMessage.bind(this), {
        noAck: false
      });
      
      console.log('✅ Conectado a RabbitMQ - Escuchando cola_inventario');
    } catch (error) {
      console.error('❌ Error conectando a RabbitMQ:', error.message);
    }
  }

  async handleMessage(msg) {
    if (msg) {
      try {
        const message = JSON.parse(msg.content.toString());
        console.log('📨 Mensaje recibido:', message.event_type);

        if (message.event_type === 'nueva_cosecha') {
          await this.procesarNuevaCosecha(message.payload);
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
      const { cosecha_id, producto, toneladas, requiere_insumos } = payload;
      
      // Calcular insumos necesarios
      const insumosCalculados = this.calcularInsumosNecesarios(producto, toneladas);
      
      console.log(`🧮 Calculando insumos para ${toneladas}t de ${producto}`);
      
      let todosDisponibles = true;
      const resultados = [];

      // Procesar cada insumo
      for (const insumoCalc of insumosCalculados) {
        const insumo = await Insumo.findOne({
          where: { nombre_insumo: insumoCalc.nombre }
        });

        if (insumo) {
          if (insumo.stock >= insumoCalc.cantidad) {
            // Actualizar stock
            await insumo.update({
              stock: insumo.stock - insumoCalc.cantidad,
              ultima_actualizacion: new Date()
            });
            
            resultados.push({
              insumo: insumoCalc.nombre,
              cantidad_usada: insumoCalc.cantidad,
              stock_restante: insumo.stock - insumoCalc.cantidad,
              status: 'OK'
            });
            
            console.log(`✅ ${insumoCalc.nombre}: -${insumoCalc.cantidad}kg (Stock: ${insumo.stock - insumoCalc.cantidad}kg)`);
          } else {
            todosDisponibles = false;
            resultados.push({
              insumo: insumoCalc.nombre,
              cantidad_requerida: insumoCalc.cantidad,
              stock_disponible: insumo.stock,
              status: 'INSUFICIENTE'
            });
            
            console.log(`⚠️ ${insumoCalc.nombre}: Stock insuficiente (Req: ${insumoCalc.cantidad}kg, Disp: ${insumo.stock}kg)`);
          }
        } else {
          todosDisponibles = false;
          resultados.push({
            insumo: insumoCalc.nombre,
            status: 'NO_ENCONTRADO'
          });
        }
      }

      // Publicar resultado
      await this.publishInventoryResult(cosecha_id, todosDisponibles ? 'OK' : 'PARCIAL', resultados);
      
    } catch (error) {
      console.error('❌ Error procesando cosecha:', error);
      await this.publishInventoryResult(payload.cosecha_id, 'ERROR', []);
    }
  }

  calcularInsumosNecesarios(producto, toneladas) {
    // Fórmulas según el documento: 5kg semilla/tonelada + 2kg fertilizante/tonelada
    const formulasInsumos = {
      'Arroz': [
        { nombre: 'Semilla Arroz L-23', factor: 5 },
        { nombre: 'Fertilizante N-PK', factor: 2 }
      ],
      'Arroz Oro': [
        { nombre: 'Semilla Arroz L-23', factor: 5 },
        { nombre: 'Fertilizante N-PK', factor: 2 }
      ],
      'Café': [
        { nombre: 'Semilla Café Premium', factor: 3 },
        { nombre: 'Fertilizante Orgánico', factor: 2 }
      ],
      'Café Premium': [
        { nombre: 'Semilla Café Premium', factor: 3 },
        { nombre: 'Fertilizante Orgánico', factor: 2 }
      ]
    };

    const formula = formulasInsumos[producto] || [
      { nombre: 'Fertilizante N-PK', factor: 2 }
    ];

    return formula.map(item => ({
      nombre: item.nombre,
      cantidad: parseFloat((toneladas * item.factor).toFixed(2))
    }));
  }

  async publishInventoryResult(cosecha_id, status, resultados) {
    try {
      const message = {
        event_id: require('uuid').v4(),
        event_type: 'inventario_ajustado',
        timestamp: new Date().toISOString(),
        payload: {
          cosecha_id,
          status,
          resultados
        }
      };

      await this.channel.publish(
        'cosechas',
        'inventario_ajustado',
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );

      console.log('📤 Resultado inventario publicado:', status);
    } catch (error) {
      console.error('❌ Error publicando resultado:', error);
    }
  }

  async close() {
    if (this.connection) {
      await this.connection.close();
    }
  }
}

module.exports = new RabbitMQService();
const amqp = require('amqplib');

class RabbitMQService {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      
      // Declarar exchange
      await this.channel.assertExchange('cosechas', 'topic', { durable: true });
      
      console.log('✅ Conectado a RabbitMQ');
    } catch (error) {
      console.error('❌ Error conectando a RabbitMQ:', error.message);
    }
  }

  async publishEvent(eventType, payload) {
    try {
      const message = {
        event_id: require('uuid').v4(),
        event_type: eventType,
        timestamp: new Date().toISOString(),
        payload
      };

      await this.channel.publish(
        'cosechas',
        eventType,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );

      console.log('📤 Evento publicado:', eventType, payload.cosecha_id);
    } catch (error) {
      console.error('❌ Error publicando evento:', error);
    }
  }

  async close() {
    if (this.connection) {
      await this.connection.close();
    }
  }
}

module.exports = new RabbitMQService();
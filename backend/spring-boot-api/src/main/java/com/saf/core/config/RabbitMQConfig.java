package com.saf.core.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // Exchange: một topic exchange duy nhất cho toàn bộ sự kiện booking
    public static final String BOOKING_EXCHANGE = "saf.booking";

    // Queue: nodejs-messaging service lắng nghe tại đây để push Socket.io
    public static final String NOTIFICATION_QUEUE = "saf.notification.queue";

    // Routing key pattern: booking.confirmed, booking.completed, booking.cancelled, booking.new
    public static final String NOTIFICATION_ROUTING_KEY = "booking.#";

    @Bean
    public TopicExchange bookingExchange() {
        return ExchangeBuilder.topicExchange(BOOKING_EXCHANGE).durable(true).build();
    }

    @Bean
    public Queue notificationQueue() {
        return QueueBuilder.durable(NOTIFICATION_QUEUE).build();
    }

    @Bean
    public Binding notificationBinding(Queue notificationQueue, TopicExchange bookingExchange) {
        return BindingBuilder.bind(notificationQueue).to(bookingExchange).with(NOTIFICATION_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public AmqpTemplate amqpTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jackson2JsonMessageConverter());
        return template;
    }
}

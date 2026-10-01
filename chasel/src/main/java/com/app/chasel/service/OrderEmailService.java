package com.app.chasel.service;

import com.app.chasel.model.Order;
import com.app.chasel.model.OrderItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class OrderEmailService {

    private static final Logger log = LoggerFactory.getLogger(OrderEmailService.class);
    private final JavaMailSender mailSender;
    private final boolean enabled;
    private final String from;

    public OrderEmailService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${chasel.mail.enabled:false}") boolean enabled,
            @Value("${chasel.mail.from:no-reply@chasel.local}") String from) {
        this.mailSender = mailSenderProvider.getIfAvailable();
        this.enabled = enabled;
        this.from = from;
    }

    public void sendOrderConfirmation(Order order) {
        StringBuilder items = new StringBuilder();
        for (OrderItem item : order.getItems()) {
            items.append("- ").append(item.getTitleSnapshot())
                    .append(" x").append(item.getQuantity())
                    .append(" — $").append(item.getPriceSnapshot()).append('\n');
        }

        String body = """
                Thank you for your order.

                Order #%s
                %s
                Estimated tax: $%s
                Delivery: $%s
                Total: $%s

                Ship to:
                %s

                You may cancel this order until %s. After that time, the order will move to processing.
                """.formatted(
                order.getOrderNumber(), items, order.getTaxAmount(), order.getDeliveryAmount(), order.getTotalAmount(),
                order.getShippingAddress(), order.getCancelUntil());

        send(order, "Chasel order #%s confirmed".formatted(order.getOrderNumber()), body);
    }

    public void sendStatusUpdate(Order order, String status, String detail) {
        String body = """
                Your Chasel order has a new update.

                Order #%s
                Status: %s

                %s

                Total: $%s
                """.formatted(order.getOrderNumber(), status, detail, order.getTotalAmount());
        send(order, "Order #%s: %s".formatted(order.getOrderNumber(), status), body);
    }

    private void send(Order order, String subject, String body) {
        if (!enabled || mailSender == null) {
            log.info("Order email disabled; would send '{}' for order #{} to {}",
                    subject, order.getOrderNumber(), order.getContactEmail());
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(order.getContactEmail());
        message.setSubject(subject);
        message.setText(body);
        try {
            mailSender.send(message);
        } catch (MailException exception) {
            // A mail-server outage must not turn a valid checkout into a failed order.
            log.error("Could not send email for order #{}", order.getId(), exception);
        }
    }
}

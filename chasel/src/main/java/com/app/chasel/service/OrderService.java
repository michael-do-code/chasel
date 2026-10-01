package com.app.chasel.service;

import com.app.chasel.dto.OrderItemResponse;
import com.app.chasel.dto.OrderResponse;
import com.app.chasel.dto.SaleItemResponse;
import com.app.chasel.dto.GuestCheckoutRequest;
import com.app.chasel.dto.ReturnRequest;
import com.app.chasel.dto.ReturnDecisionRequest;
import com.app.chasel.model.Cart;
import com.app.chasel.model.CartItem;
import com.app.chasel.model.Listing;
import com.app.chasel.model.Order;
import com.app.chasel.model.OrderItem;
import com.app.chasel.model.OrderStatus;
import com.app.chasel.model.OrderItemStatus;
import com.app.chasel.model.Users;
import com.app.chasel.repository.CartItemRepository;
import com.app.chasel.repository.CartRepository;
import com.app.chasel.repository.ListingRepository;
import com.app.chasel.repository.OrderRepository;
import com.app.chasel.repository.OrderItemRepository;
import com.app.chasel.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class OrderService {

    private static final BigDecimal ESTIMATED_TAX_RATE = new BigDecimal("0.10");
    private static final BigDecimal STANDARD_DELIVERY_FEE = new BigDecimal("9.95");

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final OrderItemRepository orderItemRepository;
    private final NotificationService notificationService;
    private final OrderEmailService orderEmailService;
    private final QrCodeService qrCodeService;
    private final Duration cancellationWindow;

    public OrderService(
            OrderRepository orderRepository,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            ListingRepository listingRepository,
            UserRepository userRepository,
            OrderItemRepository orderItemRepository,
            NotificationService notificationService,
            OrderEmailService orderEmailService,
            QrCodeService qrCodeService,
            @Value("${orders.cancellation-window:30m}") Duration cancellationWindow) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.orderItemRepository = orderItemRepository;
        this.notificationService = notificationService;
        this.orderEmailService = orderEmailService;
        this.qrCodeService = qrCodeService;
        this.cancellationWindow = cancellationWindow;
    }

    @Transactional
    public OrderResponse checkout(Long buyerId, String shippingAddress, String promoCode) {
        Users buyer = getUser(buyerId);
        Cart cart = cartRepository.findByUser(buyer)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Cart is empty"));

        List<CartItem> cartItems = cartItemRepository.findByCart(cart);
        if (cartItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is empty");
        }

        return checkoutCart(buyer, cartItems, shippingAddress, promoCode, buyer.getEmail());
    }

    @Transactional
    public OrderResponse guestCheckout(GuestCheckoutRequest request) {
        Users guest = new Users();
        guest.setEmail("guest-" + UUID.randomUUID() + "@chasel.local");
        guest.setPassword(UUID.randomUUID().toString());
        guest.setFirstName(request.firstName().trim());
        guest.setLastName(request.lastName().trim());
        guest.setPhone(request.phone().trim());
        guest = userRepository.save(guest);

        Cart cart = new Cart();
        cart.setUser(guest);
        cart = cartRepository.save(cart);

        for (var requestedItem : request.items()) {
            Listing listing = listingRepository.findById(requestedItem.productId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
            CartItem cartItem = new CartItem();
            cartItem.setCart(cart);
            cartItem.setProduct(listing);
            cartItem.setQuantity(requestedItem.quantity());
            cartItemRepository.save(cartItem);
        }

        return checkoutCart(
                guest,
                cartItemRepository.findByCart(cart),
                request.shippingAddress(),
                request.promoCode(),
                request.email().trim().toLowerCase());
    }

    private OrderResponse checkoutCart(
            Users buyer,
            List<CartItem> cartItems,
            String shippingAddress,
            String promoCode,
            String contactEmail) {

        Order order = new Order();
        order.setOrderNumber(generateOrderNumber());
        order.setBuyer(buyer);
        order.setContactEmail(contactEmail);
        order.setShippingAddress(shippingAddress.trim());
        order.setCancelUntil(LocalDateTime.now().plus(cancellationWindow));

        BigDecimal total = BigDecimal.ZERO;

        for (CartItem cartItem : cartItems) {
            Listing listing = listingRepository.findByIdForUpdate(
                            cartItem.getProduct().getId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Listing not found"));

            if (!listing.isActive()) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Listing is no longer available: " + listing.getTitle());
            }

            if (listing.getSeller().getId().equals(buyer.getId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "You cannot buy your own listing: " + listing.getTitle());
            }

            int quantity = cartItem.getQuantity();
            BigDecimal unitPrice = BigDecimal.valueOf(listing.getPrice());

            OrderItem orderItem = new OrderItem();
            orderItem.setListing(listing);
            orderItem.setSeller(listing.getSeller());
            orderItem.setTitleSnapshot(listing.getTitle());
            orderItem.setPriceSnapshot(unitPrice);
            orderItem.setQuantity(quantity);
            order.addItem(orderItem);

            total = total.add(unitPrice.multiply(BigDecimal.valueOf(quantity)));
            listing.markAsSold();
        }

        BigDecimal tax = total.multiply(ESTIMATED_TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal delivery = "FREESHIP".equalsIgnoreCase(promoCode == null ? "" : promoCode.trim())
                ? BigDecimal.ZERO
                : STANDARD_DELIVERY_FEE;
        order.setTaxAmount(tax);
        order.setDeliveryAmount(delivery);
        order.setTotalAmount(total.add(tax).add(delivery));
        Order savedOrder = orderRepository.save(order);
        notificationService.notifyOrderPlaced(savedOrder);
        notificationService.notifySalePlaced(savedOrder);
        orderEmailService.sendOrderConfirmation(savedOrder);

        // Only clear the cart after every order item has been created successfully.
        cartItemRepository.deleteAll(cartItems);

        return toResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getPurchases(Long buyerId) {
        Users buyer = getUser(buyerId);
        return orderRepository.findByBuyerOrderByCreatedAtDesc(buyer)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getPurchase(Long buyerId, Long orderId) {
        Users buyer = getUser(buyerId);
        Order order = orderRepository.findByIdAndBuyer(orderId, buyer)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Order not found"));
        return toResponse(order);
    }

    @Transactional
    public OrderResponse cancelOrder(Long buyerId, Long orderId) {
        Users buyer = getUser(buyerId);
        Order order = orderRepository.findForCancellation(orderId, buyer)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Order not found"));

        // Repeating the same request is safe and returns the current order.
        if (order.getStatus() == OrderStatus.CANCELLED) {
            return toResponse(order);
        }

        LocalDateTime now = LocalDateTime.now();
        if (order.getStatus() != OrderStatus.PLACED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "This order can no longer be cancelled");
        }
        if (order.getCancelUntil() == null || !now.isBefore(order.getCancelUntil())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "The cancellation period for this order has ended");
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(now);
        for (OrderItem item : order.getItems()) {
            item.setStatus(OrderItemStatus.CANCELLED);
            item.getListing().markAsActive();
        }
        notificationService.notifyOrderCancelled(order);
        orderEmailService.sendStatusUpdate(order, "Cancelled", "Your order was cancelled.");

        return toResponse(order);
    }

    @Transactional
    public OrderResponse requestReturn(Long buyerId, Long orderId, ReturnRequest request) {
        Users buyer = getUser(buyerId);
        Order order = orderRepository.findForCancellation(orderId, buyer)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        Set<Long> requestedIds = new HashSet<>(request.itemIds());
        List<OrderItem> selected = order.getItems().stream()
                .filter(item -> requestedIds.contains(item.getId()))
                .toList();
        if (selected.size() != requestedIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more items are not part of this order");
        }

        LocalDateTime now = LocalDateTime.now();
        Map<Long, String> packageCodes = new HashMap<>();
        for (OrderItem item : selected) {
            if (item.getStatus() != OrderItemStatus.DELIVERED) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Only delivered items can be returned");
            }
            if (item.getReturnStatus() != null) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "A return already exists for this item");
            }
            item.setReturnStatus(com.app.chasel.model.ReturnStatus.REQUESTED);
            item.setReturnRequestedAt(now);
            item.setReturnReason(request.reason().trim());
            item.setReturnDetails(request.details() == null ? null : request.details().trim());
            item.setReturnPreferredResolution(request.preferredResolution());
            item.setReturnMediaUrls(request.mediaUrls());
            item.setReturnAuthorizationCode(packageCodes.computeIfAbsent(
                    item.getSeller().getId(), ignored -> "RET-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()));
            notificationService.notifyReturnRequested(item);
        }
        return toResponse(order);
    }

    @Transactional
    public SaleItemResponse decideReturn(Long sellerId, Long itemId, boolean approve, ReturnDecisionRequest request) {
        Users seller = getUser(sellerId);
        OrderItem item = orderItemRepository.findForSellerUpdate(itemId, seller)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Return request not found"));
        if (item.getReturnStatus() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This item has no return request");
        }
        List<OrderItem> packageItems = item.getOrder().getItems().stream()
                .filter(candidate -> candidate.getSeller().getId().equals(sellerId))
                .filter(candidate -> item.getReturnAuthorizationCode() != null
                        && item.getReturnAuthorizationCode().equals(candidate.getReturnAuthorizationCode()))
                .toList();
        for (OrderItem packageItem : packageItems) {
            packageItem.setReturnSellerNote(request == null ? null : request.note());
            if (approve) {
                packageItem.setReturnStatus(com.app.chasel.model.ReturnStatus.APPROVED);
                notificationService.notifyReturnApproved(packageItem);
            } else {
                packageItem.setReturnStatus(com.app.chasel.model.ReturnStatus.NEEDS_DISCUSSION);
                notificationService.notifyReturnDiscussion(packageItem);
            }
        }
        return toSaleResponse(item);
    }

    /** Moves expired orders out of the cancellation window, even after a restart. */
    @Scheduled(fixedDelayString = "${orders.processing-check-interval:15000}")
    @Transactional
    public void processExpiredOrders() {
        LocalDateTime now = LocalDateTime.now();
        List<Order> expired = orderRepository.findByStatusAndCancelUntilLessThanEqual(
                OrderStatus.PLACED, now);

        for (Order order : expired) {
            order.setStatus(OrderStatus.PROCESSING);
            order.setProcessingAt(now);
            for (OrderItem item : order.getItems()) {
                item.setStatus(OrderItemStatus.PROCESSING);
                item.setProcessingAt(now);
                if (item.getShippingCode() == null) {
                    item.setShippingCode(UUID.randomUUID().toString());
                }
                notificationService.notifySaleReady(item);
                notificationService.notifyOrderItemProcessing(item);
            }
            orderEmailService.sendStatusUpdate(order, "Preparing", "Your order is being prepared for shipment.");
        }
    }

    @Transactional
    public List<SaleItemResponse> getSales(Long sellerId) {
        processExpiredOrders();
        Users seller = getUser(sellerId);
        return orderItemRepository.findBySellerOrderByCreatedAtDesc(seller)
                .stream()
                .map(this::toSaleResponse)
                .toList();
    }

    @Transactional
    public SaleItemResponse markShipped(Long sellerId, Long itemId) {
        processExpiredOrders();
        Users seller = getUser(sellerId);
        OrderItem item = orderItemRepository.findForSellerUpdate(itemId, seller)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Sale not found"));

        if (item.getStatus() == OrderItemStatus.SHIPPED) {
            return toSaleResponse(item);
        }
        if (item.getStatus() != OrderItemStatus.PROCESSING) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "This sale is not ready to ship");
        }

        item.setStatus(OrderItemStatus.SHIPPED);
        item.setShippedAt(LocalDateTime.now());
        Order order = item.getOrder();
        boolean allShipped = order.getItems().stream()
                .allMatch(orderItem -> orderItem.getStatus() == OrderItemStatus.SHIPPED);
        if (allShipped) {
            order.setStatus(OrderStatus.SHIPPED);
            orderEmailService.sendStatusUpdate(order, "Shipped", "Your order is on the way.");
        }
        notificationService.notifyOrderShipped(item);
        notificationService.notifySaleShipped(item);
        return toSaleResponse(item);
    }

    @Transactional
    public OrderResponse confirmDelivered(Long buyerId, Long orderId) {
        Users buyer = getUser(buyerId);
        Order order = orderRepository.findForCancellation(orderId, buyer)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Order not found"));

        if (order.getStatus() == OrderStatus.DELIVERED) {
            return toResponse(order);
        }
        if (order.getStatus() != OrderStatus.SHIPPED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "This order has not been fully shipped");
        }

        order.setStatus(OrderStatus.DELIVERED);
        for (OrderItem item : order.getItems()) {
            item.setStatus(OrderItemStatus.DELIVERED);
        }
        notificationService.notifyOrderDelivered(order);
        orderEmailService.sendStatusUpdate(order, "Delivered", "Your order has been delivered.");
        return toResponse(order);
    }

    private Users getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));
    }

    private String generateOrderNumber() {
        String candidate;
        do {
            candidate = String.valueOf(ThreadLocalRandom.current().nextInt(10_000_000, 100_000_000));
        } while (orderRepository.existsByOrderNumber(candidate));
        return candidate;
    }

    private OrderResponse toResponse(Order order) {
        boolean cancellable = order.getStatus() == OrderStatus.PLACED
                && order.getCancelUntil() != null
                && LocalDateTime.now().isBefore(order.getCancelUntil());

        List<OrderItemResponse> items = order.getItems().stream()
                .map(item -> new OrderItemResponse(
                        item.getId(),
                        item.getListing().getId(),
                        item.getSeller().getId(),
                        sellerName(item.getSeller()),
                        item.getTitleSnapshot(),
                        item.getPriceSnapshot(),
                        item.getQuantity(),
                        item.getStatus(),
                        item.getReturnStatus(),
                        returnAddress(item.getSeller()),
                        item.getReturnReason(),
                        item.getReturnDetails(),
                        item.getReturnPreferredResolution(),
                        item.getReturnMediaUrls(),
                        item.getReturnSellerNote(),
                        item.getReturnAuthorizationCode(),
                        item.getListing().getImageUrls()
                ))
                .toList();

        return new OrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getBuyer().getId(),
                order.getTotalAmount(),
                order.getTaxAmount(),
                order.getDeliveryAmount(),
                order.getStatus(),
                order.getShippingAddress(),
                order.getCreatedAt(),
                order.getCancelUntil(),
                order.getCancelledAt(),
                cancellable,
                items
        );
    }

    private String sellerName(Users seller) {
        String firstName = seller.getFirstName() == null ? "" : seller.getFirstName();
        String lastName = seller.getLastName() == null ? "" : seller.getLastName();
        String fullName = (firstName + " " + lastName).trim();
        return fullName.isEmpty() ? "Seller" : fullName;
    }

    private String returnAddress(Users seller) {
        String location = java.util.stream.Stream.of(
                        seller.getAddress(), seller.getCity(), seller.getState(), seller.getZipCode())
                .filter(part -> part != null && !part.isBlank())
                .collect(java.util.stream.Collectors.joining(", "));
        return location.isEmpty()
                ? "Seller will provide the return address after approving the request."
                : location;
    }

    private SaleItemResponse toSaleResponse(OrderItem item) {
        Order order = item.getOrder();
        return new SaleItemResponse(
                item.getId(),
                order.getId(),
                order.getOrderNumber(),
                item.getListing().getId(),
                displayName(order.getBuyer(), "Buyer"),
                item.getTitleSnapshot(),
                item.getPriceSnapshot(),
                item.getQuantity(),
                item.getStatus(),
                order.getShippingAddress(),
                item.getShippingCode(),
                qrCodeService.fulfillmentDataUrl(order.getOrderNumber(), item.getId(), item.getShippingCode()),
                order.getCreatedAt(),
                item.getProcessingAt(),
                item.getShippedAt(),
                item.getReturnStatus(),
                item.getReturnReason(),
                item.getReturnDetails(),
                item.getReturnPreferredResolution(),
                item.getReturnMediaUrls(),
                item.getReturnSellerNote(),
                returnAddress(item.getSeller()),
                item.getReturnAuthorizationCode(),
                item.getListing().getImageUrls());
    }

    private String displayName(Users user, String fallback) {
        String firstName = user.getFirstName() == null ? "" : user.getFirstName();
        String lastName = user.getLastName() == null ? "" : user.getLastName();
        String fullName = (firstName + " " + lastName).trim();
        return fullName.isEmpty() ? fallback : fullName;
    }
}

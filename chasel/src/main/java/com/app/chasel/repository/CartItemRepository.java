package com.app.chasel.repository;

import com.app.chasel.model.Cart;
import com.app.chasel.model.CartItem;
import com.app.chasel.model.Listing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository
        extends JpaRepository<CartItem, Long> {

    List<CartItem> findByCart(Cart cart);

    Optional<CartItem> findByCartAndProduct(
        Cart cart,
        Listing product
    );

    void deleteByProduct(Listing product);
}

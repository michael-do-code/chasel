package com.app.chasel.repository;

import com.app.chasel.model.Cart;
import com.app.chasel.model.CartItem;
import com.app.chasel.model.Listing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository
        extends JpaRepository<CartItem, Long> {

    List<CartItem> findByCart(Cart cart);

    Optional<CartItem> findByCartAndProduct(
        Cart cart,
        Listing product
    );

    /**
     * Total quantity in a cart, aggregated in the database so the badge does
     * not have to load every line and its product.
     */
    @Query("select coalesce(sum(item.quantity), 0L) from CartItem item where item.cart = :cart")
    Long sumQuantityByCart(@Param("cart") Cart cart);

    void deleteByProduct(Listing product);
}

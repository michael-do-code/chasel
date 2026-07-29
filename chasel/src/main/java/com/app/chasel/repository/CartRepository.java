package com.app.chasel.repository;

import com.app.chasel.model.Cart;
import com.app.chasel.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {

    Optional<Cart> findByUser(Users user);
}
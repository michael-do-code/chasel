package com.app.chasel.repository;

import com.app.chasel.model.Listing;
import com.app.chasel.model.SavedItem;
import com.app.chasel.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedItemRepository
        extends JpaRepository<SavedItem, Long> {

    List<SavedItem> findByUser(Users user);

    Optional<SavedItem> findByUserAndProduct(
        Users user,
        Listing product
    );

    void deleteByProduct(Listing product);
}

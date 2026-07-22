package com.app.chasel.repository;

import com.app.chasel.model.Listing;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ListingRepository extends JpaRepository<Listing, Long> {
    List<Listing> findByLocation(String location);
    List<Listing> findBySellerId(Long sellerId);
}
package com.app.chasel.repository;

import com.app.chasel.model.Listing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ListingRepository extends JpaRepository<Listing, Long> {
    List<Listing> findByLocation(String location);
    List<Listing> findBySellerId(Long sellerId);

    @Query("""
        SELECT listing
        FROM Listing listing
        JOIN SavedItem saved ON saved.product = listing
        GROUP BY listing
        ORDER BY COUNT(saved.id) DESC, listing.createdAt DESC
        """)
    List<Listing> findTrendingBySaveCount();
}

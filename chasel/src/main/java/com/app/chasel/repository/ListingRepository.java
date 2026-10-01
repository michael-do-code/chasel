package com.app.chasel.repository;

import com.app.chasel.model.Listing;
import com.app.chasel.model.ListingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.List;

public interface ListingRepository extends JpaRepository<Listing, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT listing FROM Listing listing WHERE listing.id = :id")
    Optional<Listing> findByIdForUpdate(@Param("id") Long id);
    List<Listing> findByLocation(String location);
    List<Listing> findBySellerId(Long sellerId);
    @Query("""
        SELECT DISTINCT listing
        FROM Listing listing
        WHERE listing.status = com.app.chasel.model.ListingStatus.ACTIVE
           OR EXISTS (
               SELECT item.id
               FROM OrderItem item
               WHERE item.listing = listing
                 AND item.order.status = com.app.chasel.model.OrderStatus.PLACED
           )
        ORDER BY listing.createdAt DESC
        """)
    List<Listing> findMarketplaceListings();

    @Query("""
        SELECT listing
        FROM Listing listing
        JOIN SavedItem saved ON saved.product = listing
        WHERE listing.status = com.app.chasel.model.ListingStatus.ACTIVE
           OR EXISTS (
               SELECT item.id
               FROM OrderItem item
               WHERE item.listing = listing
                 AND item.order.status = com.app.chasel.model.OrderStatus.PLACED
           )
        GROUP BY listing
        ORDER BY COUNT(saved.id) DESC, listing.createdAt DESC
        """)
    List<Listing> findTrendingBySaveCount();
}

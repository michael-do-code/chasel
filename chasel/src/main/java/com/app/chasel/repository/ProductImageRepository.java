package com.app.chasel.repository;

import com.app.chasel.model.Listing;
import com.app.chasel.model.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductImageRepository
        extends JpaRepository<ProductImage, Long> {

    List<ProductImage> findByProduct(Listing product);

    void deleteByProduct(Listing product);
}

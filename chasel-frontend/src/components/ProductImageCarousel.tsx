import { useState } from 'react';
import type { MouseEvent, TouchEvent } from 'react';

interface ProductImageCarouselProps {
  title: string;
  imageUrls?: string[];
}

function ProductImageCarousel({
  title,
  imageUrls = [],
}: ProductImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const showPrevious = (event?: MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    setActiveIndex((current) =>
      current === 0 ? imageUrls.length - 1 : current - 1
    );
  };

  const showNext = (event?: MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    setActiveIndex((current) =>
      current === imageUrls.length - 1 ? 0 : current + 1
    );
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    event.stopPropagation();
    setTouchStart(event.touches[0].clientX);
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (touchStart === null || imageUrls.length < 2) return;

    const distance = touchStart - event.changedTouches[0].clientX;

    if (distance > 40) {
      showNext();
    } else if (distance < -40) {
      showPrevious();
    }

    setTouchStart(null);
  };

  return (
    <div
      className="listing-image product-carousel"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {imageUrls[activeIndex] ? (
        <img
          src={imageUrls[activeIndex]}
          alt={`${title} ${activeIndex + 1}`}
          className="product-image"
          draggable={false}
        />
      ) : (
        <div className="image-placeholder">No image</div>
      )}

      <span className="badge badge-sale">FOR SALE</span>

      {imageUrls.length > 1 && (
        <>
          <button
            type="button"
            className="carousel-arrow carousel-previous"
            aria-label="Previous image"
            onClick={showPrevious}
          >
            ‹
          </button>
          <button
            type="button"
            className="carousel-arrow carousel-next"
            aria-label="Next image"
            onClick={showNext}
          >
            ›
          </button>

          <div className="carousel-dots">
            {imageUrls.map((imageUrl, index) => (
              <button
                type="button"
                key={`${imageUrl}-${index}`}
                className={index === activeIndex ? 'active' : ''}
                aria-label={`Show image ${index + 1}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveIndex(index);
                }}
              />
            ))}
          </div>

          <span className="carousel-count">
            {activeIndex + 1}/{imageUrls.length}
          </span>
        </>
      )}
    </div>
  );
}

export default ProductImageCarousel;

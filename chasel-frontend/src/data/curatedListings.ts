import type { Listing } from '../types/listing';
import clothingWide from '../assets/promo-category-clothing-wide.png';
import cardigan from '../assets/under-100-community-cardigan.png';
import footwearWide from '../assets/promo-category-footwear-wide.png';
import boots from '../assets/under-100-community-boots.png';
import handbag from '../assets/under-100-community-handbag.png';
import scarf from '../assets/under-100-community-scarf.png';
import jewelryWide from '../assets/promo-category-jewelry-wide.png';
import watch from '../assets/under-100-community-watch.png';
import beauty from '../assets/promo-beauty.png';
import home from '../assets/promo-home.png';

const createdAt = '2026-09-14T12:00:00.000Z';

/** Shared fallback catalog used when the local backend has no listings. */
export const curatedListings: Listing[] = [
  { id: -1, title: 'Camel Wool Coat', brand: 'Atelier Archive', price: 148, condition: 'Excellent', size: 'M', category: 'Clothing', createdAt, imageUrls: [clothingWide] },
  { id: -2, title: 'Cable-Knit Cardigan', brand: 'Sunday Studio', price: 48, condition: 'Like new', size: 'S', category: 'Clothing', createdAt, imageUrls: [cardigan] },
  { id: -3, title: 'Leather Slingback Heels', brand: 'Maison Rouge', price: 92, condition: 'Excellent', size: '8', category: 'Footwear', createdAt, imageUrls: [footwearWide] },
  { id: -4, title: 'Chocolate Ankle Boots', brand: 'Heritage Walk', price: 89, condition: 'Very good', size: '7.5', category: 'Footwear', createdAt, imageUrls: [boots] },
  { id: -5, title: 'Leather Crossbody', brand: 'Foundry', price: 64, condition: 'Very good', size: 'One size', category: 'Handbags', createdAt, imageUrls: [handbag] },
  { id: -6, title: 'Silk Printed Scarf', brand: 'Élan', price: 36, condition: 'Like new', size: 'One size', category: 'Accessories', createdAt, imageUrls: [scarf] },
  { id: -7, title: 'Gold Pendant Necklace', brand: 'Lumen', price: 72, condition: 'Like new', size: 'One size', category: 'Jewelry', createdAt, imageUrls: [jewelryWide] },
  { id: -8, title: 'Classic Leather Watch', brand: 'Meridian', price: 75, condition: 'Very good', size: 'One size', category: 'Watches', createdAt, imageUrls: [watch] },
  { id: -9, title: 'Signature Eau de Parfum', brand: 'Serein', price: 77, condition: 'New', size: '50 ml', category: 'Beauty', createdAt, imageUrls: [beauty] },
  { id: -10, title: 'Marble Table Lamp', brand: 'Casa Forma', price: 126, condition: 'Like new', size: 'Medium', category: 'Home', createdAt, imageUrls: [home] },
];

import { Product } from '../types/product';

export const products: Product[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    price: 299,
    originalPrice: 399,
    image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Audio',
    description: 'Experience crystal-clear sound with our premium wireless headphones featuring active noise cancellation and 30-hour battery life.',
    features: [
      'Active Noise Cancellation',
      '30-hour Battery Life',
      'Quick Charge Technology',
      'Premium Leather Padding',
      'Bluetooth 5.0'
    ],
    rating: 4.8,
    reviews: 1247,
    inStock: true
  },
  {
    id: '2',
    name: 'Smart Fitness Watch',
    price: 249,
    image: 'https://images.pexels.com/photos/393047/pexels-photo-393047.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Wearables',
    description: 'Track your fitness goals with this advanced smartwatch featuring heart rate monitoring, GPS, and 7-day battery life.',
    features: [
      'Heart Rate Monitor',
      'Built-in GPS',
      '7-day Battery Life',
      'Water Resistant',
      'Sleep Tracking'
    ],
    rating: 4.6,
    reviews: 892,
    inStock: true
  },
  {
    id: '3',
    name: 'Portable Bluetooth Speaker',
    price: 79,
    originalPrice: 99,
    image: 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Audio',
    description: 'Compact yet powerful Bluetooth speaker with 360-degree sound and waterproof design perfect for any adventure.',
    features: [
      '360-Degree Sound',
      'Waterproof Design',
      '12-hour Playtime',
      'Compact & Portable',
      'Quick Pair Technology'
    ],
    rating: 4.4,
    reviews: 634,
    inStock: true
  },
  {
    id: '4',
    name: 'Wireless Charging Pad',
    price: 49,
    image: 'https://images.pexels.com/photos/4158/apple-iphone-smartphone-desk.jpg?auto=compress&cs=tinysrgb&w=500',
    category: 'Accessories',
    description: 'Fast wireless charging pad compatible with all Qi-enabled devices. Sleek design complements any workspace.',
    features: [
      'Fast Wireless Charging',
      'Qi-Compatible',
      'LED Indicator',
      'Non-slip Surface',
      'Compact Design'
    ],
    rating: 4.3,
    reviews: 423,
    inStock: false
  },
  {
    id: '5',
    name: 'Gaming Mechanical Keyboard',
    price: 129,
    originalPrice: 159,
    image: 'https://images.pexels.com/photos/2115257/pexels-photo-2115257.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Gaming',
    description: 'Professional gaming keyboard with mechanical switches, RGB backlighting, and programmable keys for competitive gaming.',
    features: [
      'Mechanical Switches',
      'RGB Backlighting',
      'Programmable Keys',
      'Anti-Ghosting',
      'Durable Construction'
    ],
    rating: 4.7,
    reviews: 756,
    inStock: true
  },
  {
    id: '6',
    name: 'Ultra HD Webcam',
    price: 89,
    image: 'https://images.pexels.com/photos/4126743/pexels-photo-4126743.jpeg?auto=compress&cs=tinysrgb&w=500',
    category: 'Accessories',
    description: '4K Ultra HD webcam with auto-focus and built-in microphone. Perfect for video calls and content creation.',
    features: [
      '4K Ultra HD',
      'Auto-Focus',
      'Built-in Microphone',
      'Wide-Angle Lens',
      'Plug & Play'
    ],
    rating: 4.5,
    reviews: 345,
    inStock: true
  }
];
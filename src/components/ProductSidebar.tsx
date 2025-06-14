import React from 'react';
import { X, Star, ShoppingCart, Heart, Share2, Truck, Shield, RotateCcw } from 'lucide-react';
import { Product } from '../types/product';

interface ProductSidebarProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductSidebar: React.FC<ProductSidebarProps> = ({ product, isOpen, onClose }) => {
  if (!product) return null;

  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div
        className={`fixed z-50 bg-white shadow-2xl transition-all duration-300 ease-out ${
          isOpen 
            ? 'translate-x-0 translate-y-0' 
            : 'md:translate-x-full translate-y-full md:translate-y-0'
        } 
        bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-0 md:top-0 
        max-h-[85vh] md:max-h-full md:w-96 md:h-full
        rounded-t-2xl md:rounded-none overflow-y-auto`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Product Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Product Image */}
          <div className="relative mb-6">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-64 object-cover rounded-xl"
            />
            {discountPercentage > 0 && (
              <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                -{discountPercentage}%
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div className="mb-4">
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {product.category}
            </span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{product.name}</h1>
          
          {/* Rating */}
          <div className="flex items-center mb-4">
            <div className="flex items-center text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`}
                />
              ))}
            </div>
            <span className="text-lg font-semibold text-gray-700 ml-2">{product.rating}</span>
            <span className="text-gray-500 ml-2">({product.reviews} reviews)</span>
          </div>
          
          {/* Price */}
          <div className="flex items-center space-x-3 mb-6">
            <span className="text-3xl font-bold text-gray-900">${product.price}</span>
            {product.originalPrice && (
              <span className="text-xl text-gray-500 line-through">${product.originalPrice}</span>
            )}
          </div>
          
          {/* Description */}
          <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
          
          {/* Features */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Features</h3>
            <ul className="space-y-2">
              {product.features.map((feature, index) => (
                <li key={index} className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Service Icons */}
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="text-center">
              <Truck className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <span className="text-xs text-gray-600">Free Delivery</span>
            </div>
            <div className="text-center">
              <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <span className="text-xs text-gray-600">2 Year Warranty</span>
            </div>
            <div className="text-center">
              <RotateCcw className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <span className="text-xs text-gray-600">Easy Returns</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              disabled={!product.inStock}
              className={`w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
                product.inStock
                  ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ShoppingCart className="w-6 h-6" />
              <span>{product.inStock ? 'Add to Cart' : 'Out of Stock'}</span>
            </button>
            
            <div className="flex space-x-3">
              <button className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-gray-300 transition-colors">
                <Heart className="w-5 h-5" />
                <span>Wishlist</span>
              </button>
              <button className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-gray-300 transition-colors">
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
import Link from 'next/link'
import { RiPenNibLine, RiArrowRightLine } from '@remixicon/react'

export function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-white/10 rounded-full backdrop-blur-sm">
              <RiPenNibLine className="w-12 h-12" />
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Share Your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              Amazing Stories
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join our community of passionate writers and readers. Discover inspiring stories, 
            share your thoughts, and connect with like-minded people.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/write"
              className="group bg-white text-primary-600 hover:bg-primary-50 font-semibold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center space-x-2"
            >
              <RiPenNibLine className="w-5 h-5" />
              <span>Start Writing</span>
              <RiArrowRightLine className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              href="/discover"
              className="group bg-transparent border-2 border-white/30 hover:border-white hover:bg-white/10 font-semibold py-4 px-8 rounded-xl transition-all duration-200 backdrop-blur-sm"
            >
              Explore Stories
            </Link>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-1/4 left-10 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>
      <div className="absolute bottom-1/4 right-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
    </section>
  )
}
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import { 
  RiPenNibLine, 
  RiMenuLine, 
  RiCloseLine, 
  RiUserLine,
  RiLogoutBoxLine,
  RiCompassLine,
  RiAddLine
} from '@remixicon/react'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="p-2 bg-primary-600 rounded-lg group-hover:bg-primary-700 transition-colors">
              <RiPenNibLine className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">ModernBlog</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/discover"
              className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <RiCompassLine className="w-5 h-5" />
              <span>Discover</span>
            </Link>

            {user ? (
              <>
                <Link
                  href="/write"
                  className="flex items-center space-x-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <RiAddLine className="w-5 h-5" />
                  <span>Write</span>
                </Link>
                
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <RiUserLine className="w-5 h-5 text-primary-600" />
                    </div>
                    <span>{user.username}</span>
                  </button>
                  
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link
                      href="/profile"
                      className="flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-t-lg"
                    >
                      <RiUserLine className="w-5 h-5" />
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={logout}
                      className="flex items-center space-x-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-b-lg w-full text-left"
                    >
                      <RiLogoutBoxLine className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-gray-100 transition-colors"
          >
            {isOpen ? (
              <RiCloseLine className="w-6 h-6" />
            ) : (
              <RiMenuLine className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link
                href="/discover"
                className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <RiCompassLine className="w-5 h-5" />
                <span>Discover</span>
              </Link>

              {user ? (
                <>
                  <Link
                    href="/write"
                    className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <RiAddLine className="w-5 h-5" />
                    <span>Write</span>
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <RiUserLine className="w-5 h-5" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout()
                      setIsOpen(false)
                    }}
                    className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
                  >
                    <RiLogoutBoxLine className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-primary-600 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors text-center"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
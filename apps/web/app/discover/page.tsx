'use client'

import { useEffect, useState } from 'react'
import { PostCard } from '../components/PostCard'
import { api } from '../lib/api'
import { Post } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { RiLoader4Line, RiCompassLine } from '@remixicon/react'

export default function Discover() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchDiscoveryPosts()
  }, [user])

  const fetchDiscoveryPosts = async () => {
    try {
      setLoading(true)
      const endpoint = user ? '/posts/discovery' : '/posts'
      const response = await api.get(`${endpoint}?limit=10`)
      
      if (user) {
        setPosts(response.data)
      } else {
        setPosts(response.data.posts)
      }
    } catch (error) {
      console.error('Error fetching discovery posts:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary-100 rounded-full">
              <RiCompassLine className="w-8 h-8 text-primary-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Amazing Stories
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {user 
              ? "Personalized recommendations based on your interests and the people you follow"
              : "Explore trending stories from our community of writers"
            }
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RiLoader4Line className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : (
          <>
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-4">No posts found</p>
                {user && (
                  <p className="text-gray-400">
                    Follow some writers or check back later for new content!
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
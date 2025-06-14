'use client'

import { useEffect, useState } from 'react'
import { PostCard } from './components/PostCard'
import { Hero } from './components/Hero'
import { api } from './lib/api'
import { Post } from './types'
import { RiLoader4Line } from '@remixicon/react'

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async (pageNum = 1) => {
    try {
      setLoading(true)
      const response = await api.get(`/posts?page=${pageNum}&limit=6`)
      const { posts: newPosts, pagination } = response.data
      
      if (pageNum === 1) {
        setPosts(newPosts)
      } else {
        setPosts(prev => [...prev, ...newPosts])
      }
      
      setHasMore(pagination.page < pagination.pages)
      setPage(pageNum)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(page + 1)
    }
  }

  return (
    <div className="min-h-screen">
      <Hero />
      
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Latest Stories
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover amazing stories from our community of writers
            </p>
          </div>

          {loading && posts.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <RiLoader4Line className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>

              {hasMore && (
                <div className="text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <RiLoader4Line className="w-5 h-5 animate-spin" />
                        <span>Loading...</span>
                      </div>
                    ) : (
                      'Load More'
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {!loading && posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No posts found</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
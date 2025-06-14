'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { Post, Comment } from '../../types'
import toast from 'react-hot-toast'
import { 
  RiHeartLine, 
  RiHeartFill, 
  RiChatLine, 
  RiUserLine,
  RiLoader4Line,
  RiSendPlaneLine
} from '@remixicon/react'

export default function PostPage() {
  const params = useParams()
  const slug = params.slug as string
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [comment, setComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (slug) {
      fetchPost()
    }
  }, [slug])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/posts/slug/${slug}`)
      setPost(response.data)
    } catch (error) {
      console.error('Error fetching post:', error)
      toast.error('Post not found')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!user || !post) {
      toast.error('Please login to like posts')
      return
    }

    try {
      const response = await api.post(`/posts/${post.id}/like`)
      setLiked(response.data.liked)
      
      // Update like count
      setPost(prev => prev ? {
        ...prev,
        _count: {
          ...prev._count,
          likes: response.data.liked ? prev._count.likes + 1 : prev._count.likes - 1
        }
      } : null)
    } catch (error) {
      toast.error('Failed to like post')
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !post || !comment.trim()) {
      toast.error('Please login and enter a comment')
      return
    }

    try {
      setSubmittingComment(true)
      const response = await api.post('/comments', {
        content: comment,
        postId: post.id
      })

      // Add new comment to the list
      setPost(prev => prev ? {
        ...prev,
        comments: [response.data, ...(prev.comments || [])],
        _count: {
          ...prev._count,
          comments: prev._count.comments + 1
        }
      } : null)

      setComment('')
      toast.success('Comment added!')
    } catch (error) {
      toast.error('Failed to add comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RiLoader4Line className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Post not found</h1>
          <p className="text-gray-600">The post you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <article className="card p-8 mb-8">
          {/* Header */}
          <header className="mb-8">
            {post.coverImage && (
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
            )}

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-4xl font-bold text-gray-900 mb-6">{post.title}</h1>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <RiUserLine className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {post.author.name || post.author.username}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {format(new Date(post.createdAt), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    liked
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {liked ? (
                    <RiHeartFill className="w-5 h-5" />
                  ) : (
                    <RiHeartLine className="w-5 h-5" />
                  )}
                  <span>{post._count.likes}</span>
                </button>

                <div className="flex items-center space-x-2 text-gray-600">
                  <RiChatLine className="w-5 h-5" />
                  <span>{post._count.comments}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {post.content}
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <div className="card p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Comments ({post._count.comments})
          </h3>

          {/* Comment Form */}
          {user ? (
            <form onSubmit={handleComment} className="mb-8">
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <RiUserLine className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a comment..."
                    rows={3}
                    className="textarea mb-3"
                  />
                  <button
                    type="submit"
                    disabled={!comment.trim() || submittingComment}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingComment ? (
                      <div className="flex items-center space-x-2">
                        <RiLoader4Line className="w-4 h-4 animate-spin" />
                        <span>Posting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <RiSendPlaneLine className="w-4 h-4" />
                        <span>Post Comment</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 mb-8 text-center">
              <p className="text-gray-600">
                Please <a href="/login" className="text-primary-600 hover:text-primary-700">login</a> to leave a comment
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {post.comments && post.comments.length > 0 ? (
              post.comments.map((comment) => (
                <div key={comment.id} className="flex space-x-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <RiUserLine className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-gray-900">
                          {comment.author.name || comment.author.username}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
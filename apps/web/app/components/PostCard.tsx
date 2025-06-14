import Link from 'next/link'
import { format } from 'date-fns'
import { Post } from '../types'
import { RiHeartLine, RiChatLine, RiUserLine } from '@remixicon/react'

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="card p-6 group hover:shadow-lg transition-all duration-300">
      {post.coverImage && (
        <div className="mb-4 overflow-hidden rounded-lg">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <div className="flex items-center space-x-2 mb-3">
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <Link href={`/posts/${post.slug}`}>
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
          {post.title}
        </h3>
      </Link>

      <p className="text-gray-600 mb-4 line-clamp-3">
        {post.excerpt || post.content.substring(0, 150) + '...'}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <RiUserLine className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {post.author.name || post.author.username}
              </p>
              <p className="text-xs text-gray-500">
                {format(new Date(post.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-gray-500">
          <div className="flex items-center space-x-1">
            <RiHeartLine className="w-4 h-4" />
            <span className="text-sm">{post._count.likes}</span>
          </div>
          <div className="flex items-center space-x-1">
            <RiChatLine className="w-4 h-4" />
            <span className="text-sm">{post._count.comments}</span>
          </div>
        </div>
      </div>
    </article>
  )
}
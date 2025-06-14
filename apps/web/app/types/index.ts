export interface User {
  id: string
  email: string
  username: string
  name?: string
  avatar?: string
  bio?: string
  createdAt: string
  _count?: {
    posts: number
    followers: number
    follows: number
  }
}

export interface Post {
  id: string
  title: string
  content: string
  excerpt?: string
  coverImage?: string
  published: boolean
  slug: string
  tags: string[]
  createdAt: string
  updatedAt: string
  author: User
  comments?: Comment[]
  _count: {
    likes: number
    comments: number
  }
}

export interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  author: User
  postId: string
}

export interface Like {
  id: string
  createdAt: string
  userId: string
  postId: string
}
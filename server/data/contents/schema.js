const { gql } = require('apollo-server-express');

// Define our schema using the GraphQL schema language
const schema = gql `
  type ContentData {
    id: Int
    author: User
    title: String,
    content: String,
    status: Int,
    category: Int,
    excerpt: String,
    slug: String,
    views: Int
    featured_image: String
    publishedAt: String
    createdAt: String
    updatedAt: String
  }

  input ContentInput {
    id: Int
    author_id: Int
    title: String,
    content: String,
    status: Int,
    featured_image: Int,
    category: Int,
    excerpt: String,
    slug: String,
    publishedAt: String,
  }

  extend type Query {
    contents(ids: [Int]): [ContentData]
  }

  extend type Mutation {
    content(content: ContentInput!): Int,
    deleteContent(ids: [Int]!): Boolean,
    incrementViewsOnContent(id: Int!): Boolean,
    uploadImageForContent(file: Upload!, id: Int, type: String): String
  }
`;

module.exports = schema;
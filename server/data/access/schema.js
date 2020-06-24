import { gql } from 'apollo-server-express';

// Define our schema using the GraphQL schema language
const schema = gql `
  type AccessValue {
    id: Int
    aid: Int
    value: Boolean
    slug: String
    name: String
    can_view: Boolean
    can_view_own: Boolean
    can_edit: Boolean
    can_create: Boolean
    can_delete: Boolean
  }

  type AccessLevel {
    niveau: Int!
    description: String!
    accesses: [AccessValue]
  }

  input AccessLevelInput {
    niveau: Int!
    description: String
  }

  extend type Query {
    levels(ids: [Int]): [AccessLevel],
    accesses(ids: [Int]): [AccessValue]
  }

  extend type Mutation {
    changeAccess(levelId: Int!, accessId: Int!, privilege: String!): Boolean,
  }
`;

export default schema;
import {
  gql
} from 'apollo-server-express';
// Handel diffrent Apollo Schemas and Resolvers
// ToDo: refactor this part of the code
const rootSchema = gql `
  type Query {
    root: String
  }

  type Mutation {
    root: String
  }
`;

module.exports = rootSchema;
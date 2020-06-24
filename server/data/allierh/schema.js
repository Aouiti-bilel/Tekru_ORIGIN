const { gql } = require('apollo-server-express');

// Define our schema using the GraphQL schema language
const schema = gql `
  type AllieRHData {
    url: String!
  }

  extend type Query {
    allierh: AllieRHData,
  }
`;

module.exports = schema;
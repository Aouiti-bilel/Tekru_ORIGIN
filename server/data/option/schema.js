import { gql } from 'apollo-server-express';

// Define our schema using the GraphQL schema language
const schema = gql `
  type OptionData {
    name: String!
    value: String
    access: String
  }

  input OptionInput {
    name: String!
    value: String!
  }

  extend type Query {
    options(slugs: [String]): [OptionData]
  }

  extend type Mutation {
    updateOptions(options: [OptionInput]): Boolean,
    updateHomeBackgroundImageOption(file: Upload!): String
    uploadImage(file: Upload!, attachedTo: String!, attachtedId: Int): String
  }
`;

export default schema;
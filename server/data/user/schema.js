const { gql } = require('apollo-server-express');

// Define our schema using the GraphQL schema language
const schema = gql`
  type File {
    filename: String!
    mimetype: String!
    encoding: String!
  }

  type User {
    code: Int!
    userName: String
    courriel: String
    nomFamille: String
    prenom: String
    actif: Boolean!
    sexe: String!
    fonction: String!
    id_Emp: Int
    picture: String
    niveau: AccessLevel
    accesses: [AccessValue]
  }

  type LoginData {
    token: String
    user: User
  }

  extend type Query {
    me: User
  }

  extend type Mutation {
    signup (userName: String!, courriel: String!, pswd: String!): String,
    login(courriel: String!, pswd: String!): LoginData,
    token: LoginData,
    forgetpassword (courriel: String!): Boolean,
    setForgotPassword (token: String!, newpassword: String!): String
    setProfilePicture (file: Upload!): String
    setNewPassword(oldpassword: String!, newpassword: String!, newpassword2: String!): String
    setUserGroup(groupId: Int!): String,
    activateDeactivateUser: Boolean,
    userHasAccess(accessSlug: Int!): Boolean,
    abulkActivateDeactivateUser(ids: [Int] !, state: Boolean!): Boolean,
  }
`;

module.exports = schema;
const { gql } = require('apollo-server-express');

// Define our schema using the GraphQL schema language
const schema = gql `
  type MenuItemData {
    id: Int
    type: Int
    name: String
    icon: String
    color: String
    order: Int
    link: String
    external: Boolean
    data: [MenuCategoryData]
    access: AccessValue
    auths: [AccessLevel]
    children: [MenuItemData]
  }

  input MenuItemInput {
    id: Int
    type: Int
    order: Int
    name: String
    icon: String
    color: String
    link: String
    external: Boolean
    accessId: Int
    accessSlug: String
    auths: [AccessLevelInput]
    parentId: Int
    data: [MenuCategoryInput]
  }

  type MenuCategoryData {
    id: Int
    menuItemId: Int
    title: String
    image: String
    color_text: String
    color_background: String
    link: String
    external: Boolean
    order: Int
  }

  input MenuCategoryInput {
    id: Int
    menuItemId: Int
    title: String
    image: String
    color_text: String
    color_background: String
    link: String
    external: Boolean
    order: Int
  }

  extend type Query {
    menuItems(admin: Boolean): [MenuItemData]
  }

  extend type Mutation {
    menuItem(item: MenuItemInput): Int,
    menuItems(items: [MenuItemInput], deletedItems: [Int]): [MenuItemData],
    menuCategoryPage(menuItemId: Int, items: [MenuCategoryInput]): Int,
    reorderMenuItem(id: Int!, order: Int!): Boolean,
    deleteMenuItem(ids: [Int] !): Boolean,
  }
`;

module.exports = schema;
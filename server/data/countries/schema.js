const { gql } = require('apollo-server-express');

// Define our schema using the GraphQL schema language
const schema = gql`

  type Country{
    country_id: Int
    short_name: String
  }

  type Region{
    region_id: Int
    long_name: String
    short_name: String
  }

  type City{
    id: Int
    name: String
    country: String
    province_code: String
  }

  extend type Query {
    Countries: [Country],
    Regions: [Region],
    Cities(cityFilter:Int): [City],
  } 
`;

module.exports = schema;

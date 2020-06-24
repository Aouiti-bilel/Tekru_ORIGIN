import { gql } from 'apollo-server-express';

// Define our schema using the GraphQL schema language
const schema = gql`
  type W1_data {
    type: String
    value: Int
    change: Float
  }

  type W2_data {
    name: String
    value: Float
    change: Float
  }

  type WidgetReceivedFolderData {
    active: Int
    graph: [W2_data]
    data: [W1_data]
  }

  type MultiGraphData {
    name: String
    data: [W2_data]
  }

  type BilledVsNoneBilledHours {
    count: Int
    table: [BilledVsNoneBilledHoursTable]
  }

  type BilledVsNoneBilledHoursTable {
    folder: String
    customerType: String
    customerName: String
    billed: Float
    noneBilled: Float
    amountBilled: Float
    amountNoneBilled: Float
    budget: Float
  }

  input queryOption {
    name: String
    value: String
  }

  extend type Query {
    widgetReceivedFolder: WidgetReceivedFolderData
    widgetIncomeVGoals: [MultiGraphData]
    widgetSTEC(options: [queryOption]): [MultiGraphData]
    widgetBudgetAndDelais(options: [queryOption]): [MultiGraphData]
    widgetBvNbHours(options: [queryOption]): BilledVsNoneBilledHours
  }
`;

export default schema;
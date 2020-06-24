import i18nHelper from "../../helpers/i18n.helper";
import { ApolloError } from "apollo-server-express";
import helper from "./helpers";

const resolvers = {
  Query: {
    async widgetReceivedFolder(_, args, { user }) {
      // Make sure if the user is logged in
      if (!user) {
        throw new ApolloError(
          i18nHelper.__("NOT_AUTHENTICATED"),
          "NOT_AUTHENTICATED"
        );
      }
      // Get the data and return it
      return await helper.widgetReceivedFolder(user);
    },
    async widgetIncomeVGoals(_, args, { user }) {
      // Make sure if the user is logged in
      if (!user) {
        throw new ApolloError(
          i18nHelper.__("NOT_AUTHENTICATED"),
          "NOT_AUTHENTICATED"
        );
      }
      // Get the data and return it
      return await helper.widgetIncome(user);
    },
    async widgetSTEC(_, args, { user }) {
      // Make sure if the user is logged in
      if (!user) {
        throw new ApolloError(
          i18nHelper.__("NOT_AUTHENTICATED"),
          "NOT_AUTHENTICATED"
        );
      }

      const options = renderQueryOptions(args.options);

      // Get the data and return it
      return await helper.widgetSTEC(user, options);
    },
    async widgetBudgetAndDelais(_, args, { user }) {
      // Make sure if the user is logged in
      if (!user) {
        throw new ApolloError(
          i18nHelper.__("NOT_AUTHENTICATED"),
          "NOT_AUTHENTICATED"
        );
      }

      const options = renderQueryOptions(args.options);

      // Get the data and return it
      return await helper.widgetBudgetAndDelais(user, options);
    },
    async widgetBvNbHours(_, args, { user }) {
      // Make sure if the user is logged in
      if (!user) {
        throw new ApolloError(
          i18nHelper.__("NOT_AUTHENTICATED"),
          "NOT_AUTHENTICATED"
        );
      }

      const options = renderQueryOptions(args.options);

      // Get the data and return it
      return await helper.widgetBvNbHours(user, options);
    },
  },
};

function renderQueryOptions(optionsArray) {
  if (!Array.isArray(optionsArray)) {
    return {}
  }
  const options = {};
  optionsArray.map((option) => {
    options[option.name] = option.value;
  });
  return options;
}

module.exports = resolvers;

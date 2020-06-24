import countriesController from './helpers';
import { ApolloError } from "apollo-server-express"
import i18nHelper from '../../helpers/i18n.helper';
import userHelpers from '../user/helpers';

const resolvers = {
  Query: {
    /**
       * get all countries from db
       * @author Karim Bouhnek
       * @returns  [country]
       */
      async Countries(_, args,{user}){
        // Make sure user is logged in
        if (!user) {
            throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
        }
        // Check access
        const createAccess = await userHelpers.hasAccess('permissions', 'can_create', user.id_Emp);
        const editAccess = await userHelpers.hasAccess('permissions', 'can_edit', user.id_Emp);
        if (!createAccess || !editAccess) {
            throw new ApolloError(i18nHelper.__('GRANT_ERROR'), 'GRANT_ERROR');
        }
        return await countriesController.getAllCountries();
    },


    /**
       * get all regions from db
       * @author Karim Bouhnek
       * @returns  [country]
       */
      async Regions(_, args,{user}){
        // Make sure user is logged in
        if (!user) {
            throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
        }
        // Check access
        const createAccess = await userHelpers.hasAccess('permissions', 'can_create', user.id_Emp);
        const editAccess = await userHelpers.hasAccess('permissions', 'can_edit', user.id_Emp);
        if (!createAccess || !editAccess) {
            throw new ApolloError(i18nHelper.__('GRANT_ERROR'), 'GRANT_ERROR');
        }
        return await countriesController.getAllRegions();
    },

    /**
       * get all cities from db
       * @author Karim Bouhnek
       * @returns  [city]
       */
      async Cities(_, args,{user}){
        // Make sure user is logged in
        if (!user) {
            throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
        }
        // Check access
        const createAccess = await userHelpers.hasAccess('permissions', 'can_create', user.id_Emp);
        const editAccess = await userHelpers.hasAccess('permissions', 'can_edit', user.id_Emp);
        if (!createAccess || !editAccess) {
            throw new ApolloError(i18nHelper.__('GRANT_ERROR'), 'GRANT_ERROR');
        }
        return await countriesController.getAllCities(args.cityFilter);
    }
  }
}

module.exports = resolvers;

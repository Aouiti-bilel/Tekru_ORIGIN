import allieRHHelpers from './helpers';
import userHelpers from '../user/helpers';
import i18nHelper from '../../helpers/i18n.helper';
import { ApolloError } from "apollo-server-express"

const resolvers = {
    Query: {
        async allierh(_, args, { user }) {
            // Make sure user is logged in
            if (!user) {
                throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
            }
            
            // Check access
            const access = await userHelpers.hasAccess('allierh', 'can_view', user.id_Emp);
            if (!access) {
                throw new ApolloError(i18nHelper.__('GRANT_ERROR'), 'GRANT_ERROR');
            }

            return await allieRHHelpers.allierh();
        },
    },
}

module.exports = resolvers;
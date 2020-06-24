import accessHelpers from './helpers';
import userHelpers from '../user/helpers';
import i18nHelper from '../../helpers/i18n.helper';
import { ApolloError } from "apollo-server-express"

const resolvers = {
    Query: {
        async levels(_, args, { user }) {
            // Make sure user is logged in
            if (!user) {
                throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
            }
            
            // Check access
            const access = await userHelpers.hasAccess('permissions', 'can_view', user.id_Emp);
            if (!access) {
                throw new ApolloError(i18nHelper.__('GRANT_ERROR'), 'GRANT_ERROR');
            }

            return await accessHelpers.getLevels(args.ids);
        },
        async accesses(_, args, { user }) {
            // Make sure user is logged in
            if (!user) {
                throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
            }

            // Check access
            const access = await userHelpers.hasAccess('permissions', 'can_view', user.id_Emp);
            if (!access) {
                throw new ApolloError(i18nHelper.__('GRANT_ERROR'), 'GRANT_ERROR');
            }
            
            return await accessHelpers.getAccesses(args.ids);
        },
    },

    Mutation: {
        async changeAccess(_, {
            levelId,
            accessId,
            privilege
        }, {
            user
        }) {
            // Make sure user is logged in
            if (!user) {
                throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
            }

            // Check access
            const access = await userHelpers.hasAccess('permissions', 'can_edit', user.id_Emp);
            if (!access) {
                throw new ApolloError(i18nHelper.__('GRANT_ERROR'), 'GRANT_ERROR');
            }

            // Execute the operation
            if (!await accessHelpers.changeAccess(levelId, accessId, privilege)) {
                throw new ApolloError(i18nHelper.__('SERVER_ERROR'), 'SERVER_ERROR');
            }

            return true;
        },
    }
}

module.exports = resolvers;
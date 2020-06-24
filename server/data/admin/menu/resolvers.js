import menuHelpers from './helpers';
import userHelpers from '../../user/helpers';
import i18nHelper from '../../../helpers/i18n.helper';
import utilsHelpers from '../../../helpers/utils.helper';
import { ApolloError } from "apollo-server-express"
import config from '../../../config';

const resolvers = {
    Query: {
        async menuItems(_, args, {
                user
            }) {
            // Make sure user is logged in
            if (!user) {
                throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
            }
            const { admin } = args;
            let data = [];
            if (admin) {
                // Check access
                const access_create = await userHelpers.hasAccess('platform-admin', 'can_create', user.id_Emp);
                const access_edit = await userHelpers.hasAccess('platform-admin', 'can_edit', user.id_Emp);
                const access_delete = await userHelpers.hasAccess('platform-admin', 'can_delete', user.id_Emp);
                if (!access_create && !access_edit && !access_delete) {
                    throw new ApolloError(i18nHelper.__('GRANT_ERROR'), 'GRANT_ERROR');
                }
                data = await menuHelpers.get(0, user.id_Emp, true);
            } else {
                // Get the data
                data = await menuHelpers.get(0, user.id_Emp, false);
            }

            return data;
        }
    },

    Mutation: {
        /** Update or insert item **/
        async menuItem(_, {
            item
        }, {
            user
        }) {
            // Make sure user is logged in
            if (!user) {
                throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
            }

            // Check access
            const access_create = await userHelpers.hasAccess('platform-admin', 'can_create', user.id_Emp);
            const access_edit = await userHelpers.hasAccess('platform-admin', 'can_edit', user.id_Emp);
            if (!access_create && !access_edit) {
                throw new ApolloError(i18nHelper.__('GRANT_ERROR'), 'GRANT_ERROR');
            }

            let response = 0;
            if (item.id === undefined || item.id === 0) {
                item.createdBy = user.id_Emp;
                response = await menuHelpers.create(item);
                if (!response) {
                    throw new ApolloError(i18nHelper.__('SERVER_ERROR'), 'SERVER_ERROR_CREATING_MENU_ITEM');
                }
            } else {
                if (!await menuHelpers.update(item)) {
                    throw new ApolloError(i18nHelper.__('SERVER_ERROR'), 'SERVER_ERROR_UPDATING_MENU_ITEM');
                } else {
                    response = item.id;
                }
            }

            return response;
        },

        /**
         * Bulk update the menu
         * This function will update, insert and delete the data
         * @param {*} _ 
         * @param array param1 
         * @param array param2
         */
        async menuItems(_, {
            items, deletedItems
        }, {
            user
        }) {
            // Make sure user is logged in
            if (!user) {
                throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
            }

            // Check access
            const access_create = await userHelpers.hasAccess('platform-admin', 'can_create', user.id_Emp);
            const access_edit = await userHelpers.hasAccess('platform-admin', 'can_edit', user.id_Emp);
            const access_delete = await userHelpers.hasAccess('platform-admin', 'can_delete', user.id_Emp);
            if (!access_create && !access_edit && !access_delete) {
                throw new ApolloError(i18nHelper.__('GRANT_ERROR'), 'GRANT_ERROR');
            }

            if (!await menuHelpers.handle(items, deletedItems, user.id_Emp)) {
                throw new ApolloError(i18nHelper.__('SERVER_ERROR'), 'SERVER_ERROR_UPDATING_MENU_ITEM');
            }

            return await menuHelpers.get();
        },

        /** Delete data **/
        async deleteMenuItem(_, {
            ids
        }, {
            user
        }) {
            // Make sure user is logged in
            if (!user) {
                throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
            }

            // Check access
            const access = await userHelpers.hasAccess('platform-admin', 'can_delete', user.id_Emp);
            if (!access) {
                throw new ApolloError(i18nHelper.__('GRANT_ERROR'), 'GRANT_ERROR');
            }

            if (!await menuHelpers.delete(ids)) {
                throw new ApolloError(i18nHelper.__('SERVER_ERROR'), 'SERVER_ERROR');
            }

            return true;
        },

        /** Update or insert Catergory Page **/
        async menuCategoryPage(_, {
            menuItemId, items
        }, {
            user
        }) {
            // Make sure user is logged in
            if (!user) {
                throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
            }

            // Check access
            const access_create = await userHelpers.hasAccess('platform-admin', 'can_create', user.id_Emp);
            const access_edit = await userHelpers.hasAccess('platform-admin', 'can_edit', user.id_Emp);
            if (!access_create && !access_edit) {
                throw new ApolloError(i18nHelper.__('GRANT_ERROR'), 'GRANT_ERROR');
            }

            let response = [];
            if (!menuItemId || menuItemId === 0) {
                let data;
                for (let item of items) {
                    item.createdBy = user.id_Emp;
                    data.push(item);
                }
                response = await menuHelpers.create(data);
                if (!response) {
                    throw new ApolloError(i18nHelper.__('SERVER_ERROR'), 'SERVER_ERROR_CREATING_MENU_CATEGORY_PAGE');
                }
            } else {
                response = await menuHelpers.update(menuItemId, item);
                if (!response) {
                    throw new ApolloError(i18nHelper.__('SERVER_ERROR'), 'SERVER_ERROR_UPDATING_MENU_CATEGORY_PAGE');
                }
            }

            return response;
        },
    }
}

module.exports = resolvers;
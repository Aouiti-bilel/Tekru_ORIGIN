import contentHelpers from './helpers';
import userHelpers from '../user/helpers';
import i18nHelper from '../../helpers/i18n.helper';
import utilsHelpers from '../../helpers/utils.helper';
import { ApolloError } from "apollo-server-express"
import config from '../../config';

const resolvers = {
    Query: {
        async contents(_, args, {
                user
            }) {
            // Make sure user is logged in
            if (!user) {
                throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
            }

            // Check access
            const access = await userHelpers.hasAccess('content', 'can_view', user.id_Emp);
            if (!access) {
                throw new ApolloError(i18nHelper.__('GRANT_ERROR'), 'GRANT_ERROR');
            }

            // Get the options
            const contents = await contentHelpers.getData(args.ids, user.id_Emp, await userHelpers.hasAccess('content', 'can_edit', user.id_Emp));

            return await contents;
        }
    },

    Mutation: {
        /**
         * Update content
         */
        async content(_, {
            content
        }, {
            user
        }) {
            // Make sure user is logged in
            if (!user) {
                throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
            }

            // Check access
            const access = await userHelpers.hasAccess('content', (content.id ? 'can_edit' : 'can_create'), user.id_Emp);
            if (!access) {
                throw new ApolloError(i18nHelper.__('GRANT_ERROR'), 'GRANT_ERROR');
            }

            let response = 0;
            if (content.id === undefined || content.id === 0) {
                content.author_id = user.id_Emp;
                response = await contentHelpers.create(content);
                if (!response) {
                    throw new ApolloError(i18nHelper.__('SERVER_ERROR'), 'SERVER_ERROR_CREATING_CONTENT');
                }
            } else {
                if (!await contentHelpers.update(content)) {
                    throw new ApolloError(i18nHelper.__('SERVER_ERROR'), 'SERVER_ERROR_UPDATING_CONTENT');
                } else {
                    response = content.id;
                }
            }

            return response;
        },

        /**
         * Delete content
         */
        async deleteContent(_, {
            ids
        }, {
            user
        }) {
            // Make sure user is logged in
            if (!user) {
                throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
            }

            // Check access
            const access = await userHelpers.hasAccess('content', 'can_delete', user.id_Emp);
            if (!access) {
                throw new ApolloError(i18nHelper.__('GRANT_ERROR'), 'GRANT_ERROR');
            }

            if (!await contentHelpers.delete(ids)) {
                throw new ApolloError(i18nHelper.__('SERVER_ERROR'), 'SERVER_ERROR');
            }

            return true;
        },

        /**
         * Increment views on a Content
         */
        async incrementViewsOnContent(_, {
            id
        }, {
            user
        }) {
            // Make sure user is logged in
            if (!user) {
                throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
            }

            // Check access
            const access = await userHelpers.hasAccess('content', 'can_view', user.id_Emp);
            if (!access) {
                throw new ApolloError(i18nHelper.__('GRANT_ERROR'), 'GRANT_ERROR');
            }

            if (!await contentHelpers.incrementViews(id)) {
                throw new ApolloError(i18nHelper.__('SERVER_ERROR'), 'SERVER_ERROR');
            }

            return true;
        },


        /**
         * Upload an image for content
         */
        async uploadImageForContent(_, {
            file,
            id,
            type
        }, {
            user
        }) {
            // Make sure user is logged in
            if (!user) {
                throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
            }

            // Check access
            const access1 = await userHelpers.hasAccess('content', 'can_create', user.id_Emp),
                  access2 = await userHelpers.hasAccess('content', 'can_edit', user.id_Emp);
            if (!access1 && !access2) {
                throw new ApolloError(i18nHelper.__('GRANT_ERROR'), 'GRANT_ERROR');
            }

            // What to do with tht image
            if (type === undefined || type === null || type === '') {
                type = 'in-content';
            }

            // Upload the file
            const {
                mimetype
            } = await file;
            
            const today = new Date();
            const mimeType_temp = mimetype.split('/');
            const uploadedFile = await utilsHelpers.uploadFile({
                destination: config.folders.upload_content_image,
                file: file,
                allowedFileMime: ['image/jpeg', 'image/jpg', 'image/png'],
                savedFileName: 'content-' + today.getFullYear() + ("0" + (today.getMonth() + 1)).slice(-2) + today.getDate() + '-' + today.getTime() + '-' + user.id_Emp + '.' + mimeType_temp[1]
            });

            if (!uploadedFile) {
                console.error('[OriginServer] Error saving the file.');
                throw new ApolloError(i18nHelper.__('SERVER_ERROR'), 'ERROR_UPLOADING_FILE');
            }

            let op = true;
            // Special treatments
            switch (type) {
                // Save the cover image in the post data
                case 'cover-image':
                    op = await contentHelpers.update({
                        id: id,
                        featured_image: uploadedFile,
                    })
                    break;
            
                default:
                    break;
            }

            if (!op) {
                console.error('[OriginServer] Error saving the file.');
                throw new ApolloError(i18nHelper.__('SERVER_ERROR'), 'ERROR_POST_IMAGE_TREATMENT');
            }

            return await utilsHelpers.renderFilePublicUrl(uploadedFile, config.folders.upload_content_image);
        },
    }
}

module.exports = resolvers;
import configHelpers from './helpers';
import userHelpers from '../user/helpers';
import utilsHelpers from '../../helpers/utils.helper';
import i18nHelper from '../../helpers/i18n.helper';
import { ApolloError } from "apollo-server-express";
import config from '../../config';

const resolvers = {
    Query: {
        async options(_, args, { user }) {
            // Get the options
            const options = await configHelpers.getData(args.slugs);

            // Let's check the rights
            let access = false;
            if (user) {
                access = await userHelpers.hasAccess('config', 'can_view', user.id_Emp);
            }
            let returnData = [];
            
            options.forEach(element => {
                if (element.access === 'public' || (user && access)) {
                    returnData.push(element);
                }
            });

            return await returnData;
        }
    },

    Mutation: {
        async updateOptions(_, {
            options
        }, {
            user
        }) {
            // Make sure user is logged in
            if (!user) {
                throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
            }

            // Check access
            const access = await userHelpers.hasAccess('config', 'can_edit', user.id_Emp);
            if (!access) {
                throw new ApolloError(i18nHelper.__('GRANT_ERROR'), 'GRANT_ERROR');
            }

            // Execute the operation
            if (!await configHelpers.updateData(options)) {
                throw new ApolloError(i18nHelper.__('SERVER_ERROR'), 'SERVER_ERROR');
            }

            return true;
        },

        /**
         * Update home_background_image
         * This function uploads and updathe the home_background_image option
         */
        async updateHomeBackgroundImageOption(_, {
            file
        }, {
            user
        }) {
            // Make sure user is logged in
            if (!user) {
                throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
            }

            // Check access
            const access = await userHelpers.hasAccess('config', 'can_edit', user.id_Emp);
            if (!access) {
                throw new ApolloError(i18nHelper.__('GRANT_ERROR'), 'GRANT_ERROR');
            }

            // Upload the file
            const {
                mimetype
            } = await file;
            
            const today = new Date();
            const mimeType_temp = mimetype.split('/');
            const uploadedFile = await utilsHelpers.uploadFile({
                destination: config.folders.upload_misc_image,
                file: file,
                allowedFileMime: ['image/jpeg', 'image/jpg', 'image/png'],
                savedFileName: 'background-' + today.getFullYear() + ("0" + (today.getMonth() + 1)).slice(-2) + today.getDate() + '-' + today.getTime() + '-' + user.id_Emp + '.' + mimeType_temp[1]
            });

            if (!uploadedFile) {
                console.error('[OriginServer] Error saving the file.');
                throw new ApolloError(i18nHelper.__('SERVER_ERROR'), 'SERVER_ERROR');
            }

            // Update the DB
            const data = [{
                name: 'home_background_image',
                value: uploadedFile,
            }];
            if (!await configHelpers.updateData(data)) {
                throw new ApolloError(i18nHelper.__('SERVER_ERROR'), 'SERVER_ERROR');
            }

            return await utilsHelpers.renderFilePublicUrl(uploadedFile, config.folders.upload_misc_image);
        },

        /**
         * Update misc photos
         */
        async uploadImage(_, {
            file,
            attachedTo,
            attachtedId
        }, {
            user
        }) {
            // Make sure user is logged in
            if (!user) {
                throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
            }

            // Check access
            const access_1 = await userHelpers.hasAccess('config', 'can_edit', user.id_Emp);
            const access_2 = await userHelpers.hasAccess('platform-admin', 'can_edit', user.id_Emp);
            if (!access_1 && !access_2) {
                throw new ApolloError(i18nHelper.__('GRANT_ERROR'), 'GRANT_ERROR');
            }

            // Upload the file
            const {
                mimetype
            } = await file;
            
            const today = new Date();
            const mimeType_temp = mimetype.split('/');
            let destination = config.folders.upload_misc_image;
            const slug = (attachedTo ? attachedTo.replace('-', '_') : 'misc');
            if (config.folders['upload_' + slug]) {
                destination = config.folders['upload_' + slug];
            }   
            console.log(config.folders);
            console.log('upload_' + slug);
            console.log(config.folders['upload_' + slug]);
            console.log(slug);
            const uploadedFile = await utilsHelpers.uploadFile({
                destination,
                file: file,
                allowedFileMime: ['image/jpeg', 'image/jpg', 'image/png'],
                savedFileName: slug + '-' + today.getFullYear() + ("0" + (today.getMonth() + 1)).slice(-2) + today.getDate() + '-' + today.getTime() + '-' + user.id_Emp + '.' + mimeType_temp[1]
            });

            if (!uploadedFile) {
                console.error('[OriginServer] Error saving the file.');
                throw new ApolloError(i18nHelper.__('SERVER_ERROR'), 'SERVER_ERROR');
            }

            return await utilsHelpers.renderFilePublicUrl(uploadedFile, destination);
        },
    }
}

module.exports = resolvers;
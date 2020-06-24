import userHelpers from './helpers';
import accessHelpers from '../access/helpers';
import utilsHelpers from '../../helpers/utils.helper';
import mailHelper from '../../helpers/email.helper';
import jsonwebtoken from 'jsonwebtoken';
import { ApolloError } from "apollo-server-express"
import i18nHelper from '../../helpers/i18n.helper';
import { ApolloServer } from 'apollo-server-express';
import config from '../../config';

const resolvers = {
  Upload: ApolloServer.GraphQLUpload,

  Query: {
    // fetch the profile of currently authenticated user
    async me (_, args, { user }) {
      // make sure user is logged in
      if (!user) {
        throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
      }

      // user is authenticated
      return await userHelpers.getUserById(user.id_Emp);
    },
  },

  Mutation: {
    // User signup handler
    // !!! Not tested, not to be useed
    async signup (_, { userName, courriel, pswd }) {
      // ToDo
    },

    // User login handler
    async login (_, { courriel, pswd }) {
      const user = await userHelpers.verifyEmailPassword(courriel, pswd);
      if (!user) {
        throw new ApolloError(i18nHelper.__('BAD_USER_PASSWORD'), 'BAD_USER_PASSWORD');
      }

      // Get the user if active
      if (!user.actif) {
        throw new ApolloError(i18nHelper.__('USER_DEACTIVATED'), 'USER_DEACTIVATED');
      }

      // Get session duration
      const sessionDuration = await utilsHelpers.getOption('token_life');

      // Generate the Json Web Token
      const token = jsonwebtoken.sign({
          id_Emp: user.id_Emp,
          courriel: user.courriel
        },
        config.jwt_secret, {
          expiresIn: sessionDuration
        }
      );
      
      return {
        token: token,
        user: user,
      }
    },

    /**
     * Verify the token and resend a newer one
     */
    async token (_, {}, { user }) {
      // Make sure the token is good
      if (!user) {
        throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
      }
      
      // Get the user
      user = await userHelpers.getUserById(user.id_Emp);
      if (!user.actif) {
        throw new ApolloError(i18nHelper.__('USER_DEACTIVATED'), 'USER_DEACTIVATED');
      }
      
      // Get session duration
      const sessionDuration = await utilsHelpers.getOption('token_life');
      // Generate the Json Web Token
      const newtoken = jsonwebtoken.sign({
          id_Emp: user.id_Emp,
          courriel: user.courriel
        },
        config.jwt_secret, {
          expiresIn: sessionDuration
        }
      )

      return {
        token: newtoken,
        user: user,
      }
    },

    // Forget the password handler
    async forgetpassword (_, { courriel }) {
      // Verify email server
      const mailTransporter = await mailHelper.createTransport();
      if (!await mailTransporter.verify()) {
        throw new ApolloError(i18nHelper.__('MAIL_SERVER_ERROR'), 'MAIL_SERVER_ERROR');
      }

      // ToDo (Security) add an IP and User Agent verification
      let { user, token } = await userHelpers.getForgetPasswordToken(courriel);

      if (!token) { // Check if user exists
        throw new ApolloError(i18nHelper.__('NO_USER_FOUND'), 'NO_USER_FOUND');
      }
      
      const resetlink = await utilsHelpers.fromUrl("auth/reset-password/" + token);
      
      // Get the email node modules
      const helperOptions = {
        from: await mailHelper.getNoReplyEmail(),
        to: await userHelpers.getUserEmailAdressWithName(user.id_Emp),
        subject: await mailHelper.renderEmailSubject('PWD_FORGET_SUBJECT'),
        template: 'forgetpassword',
        context: {
          name: user.prenom,
          sexe: user.sexe,
          action_url: resetlink
        }
      };
      
      mailTransporter.sendMail(helperOptions, (error, info) => {
        if (error) {
          // ToDo log the error and send the email later
          throw new Error(error);
        }
        let nodemailer = require('nodemailer');
        console.log(info);
        console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));
        return true;
      });
      
      return true;
    },

    async setForgotPassword (_, { token, newpassword }) {
      // Check if token exists and not used
      const userId = await userHelpers.verifyPasswordToken(token);
      
      if (!userId) { // Check if token exists and not used
        throw new ApolloError(i18nHelper.__('RESET_TOKEN_ERROR'), 'RESET_TOKEN_ERROR');
      }
      
      // Update the password
      const user = await userHelpers.setNewPassword(newpassword, userId, token);
      if (!user) {
        throw new ApolloError(i18nHelper.__('SERVER_ERROR'), 'SERVER_ERROR');
      }

      const mailTransporter = await mailHelper.createTransport();

      // If OK, send email
      // Get the email node modules
      const helperOptions = {
        from: await mailHelper.getNoReplyEmail(),
        to: await userHelpers.getUserEmailAdressWithName(user.id_Emp),
        subject: await mailHelper.renderEmailSubject('PWD_RESTED_SUBJECT'),
        template: 'resetpassword',
        context: {
          name: user.prenom,
          sexe: user.sexe
        }
      };
      
      // Verify email server
      if (!await mailTransporter.verify()) {
        throw new ApolloError(i18nHelper.__('MAIL_SERVER_ERROR'), 'MAIL_SERVER_ERROR');
      }

      mailTransporter.sendMail(helperOptions, (error, info) => {
        if (error) {
          // ToDo log the error and send the email later
          throw new Error(error);
        }
        let nodemailer = require('nodemailer');
        console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));
        return true;
      });

      return true;
    },

    /**
     * Change the user password
     * @param oldpassword String 
     * @param newpassword String 
     * @param newpassword2 String 
     */
    async setNewPassword(_, {
        oldpassword,
        newpassword,
        newpassword2
      }, {
        user
      }) {
      
      // Make sure user is logged in
      if (!user) {
        throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
      }

      // Check if the two passwords are the same
      if (newpassword == '' || newpassword != newpassword2 || newpassword == oldpassword) {
        throw new ApolloError(i18nHelper.__('PASSWORDS_NOT_OK'), 'PASSWORDS_NOT_OK');
      }

      // Get the employee by the token email
      if ( ! await userHelpers.verifyEmailPassword(user.courriel, oldpassword) ) {
        throw new ApolloError(i18nHelper.__('OLD_PASSWORD_NOT_OK'), 'OLD_PASSWORD_NOT_OK');
      }

      // Update the password
      user = await userHelpers.setNewPassword(newpassword, user.id_Emp);
      if (!user) {
        throw new ApolloError(i18nHelper.__('SERVER_ERROR'), 'SERVER_ERROR');
      }

      const fromEmail = await mailHelper.getNoReplyEmail();
      const mailTransporter = await mailHelper.createTransport();

      // If OK, send email
      // Get the email node modules
      const helperOptions = {
        from: fromEmail,
        to: await userHelpers.getUserEmailAdressWithName(0, user),
        subject: await mailHelper.renderEmailSubject('PWD_RESTED_SUBJECT'),
        template: 'resetpassword',
        context: {
          name: user.prenom,
          sexe: user.sexe
        }
      };

      const r = mailTransporter.verify((error, success) => {
        if (error) {
          throw new Error(error);
        } else {
          mailTransporter.sendMail(helperOptions, (error, info) => {
            if (error) {
              throw new Error(error);
            }
            let nodemailer = require('nodemailer');
            console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));

            return info.response;
          });
          return true;
        }
      });
      return true;
    },

    /**
     * Change the user group
     * @param integer groupId
     */
    async setUserGroup(_, {
        groupId
      }, {
        user
      }) {
      
      // Make sure user is logged in
      if (!user) {
        throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
      }

      // Check access
      const access = await userHelpers.hasAccess('users', 'can_edit', user.id_Emp);
      if (!access) {
        throw new ApolloError(i18nHelper.__('GRANT_ERROR'), 'GRANT_ERROR');
      }

      // Get the employee by the token email
      if (!await userHelpers.changeGroup(groupId, user.id_Emp)) {
        throw new ApolloError(i18nHelper.__('SERVER_ERROR'), 'SERVER_ERROR');
      }

      return true;
    },

    /**
     * Activate the user
     * TODO correct, this function is not getting user to activate/desactivate
     */
    async activateDeactivateUser(_, {}, {
        user
      }) {
      // Make sure user is logged in
      if (!user) {
        throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
      }

      // Check access
      const access = await userHelpers.hasAccess('users', 'can_edit', user.id_Emp);
      if (!access) {
        throw new ApolloError(i18nHelper.__('GRANT_ERROR'), 'GRANT_ERROR');
      }

      // Get the employee by the token email
      if (!await userHelpers.activateDeactivate(user.id_Emp)) {
        throw new ApolloError(i18nHelper.__('SERVER_ERROR'), 'SERVER_ERROR');
      }

      return true;
    },

    /**
     * Activate the user
     */
    async abulkActivateDeactivateUser(_, {
        ids,
        state
      }, {
        user
      }) {
      // Make sure user is logged in
      if (!user) {
        throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
      }

      // Check access
      const access = await userHelpers.hasAccess('users', 'can_edit', user.id_Emp);
      if (!access) {
        throw new ApolloError(i18nHelper.__('GRANT_ERROR'), 'GRANT_ERROR');
      }

      return await userHelpers.bulkActivateDeactivate(ids, state);
    },

    /**
     * Check access
     */
    async userHasAccess(_, {
        accessSlug
      }, {
        user
      }) {
      // Make sure user is logged in
      if (!user) {
        throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
      }

      // Get the employee by the token email
      if (!await userHelpers.hasAccess(accessSlug, user.id_Emp)) {
        return false;
      }

      return true;
    },

    async setProfilePicture(_, {
        file
      }, {
        user
      }) {
      // Make sure user is logged in
      if (!user) {
        throw new ApolloError(i18nHelper.__('NOT_AUTHENTICATED'), 'NOT_AUTHENTICATED');
      }

      // Upload the file
      const { mimetype } = await file;
      const today = new Date();
      const mimeType_temp = mimetype.split('/');
      const newProfilePicture = await utilsHelpers.uploadFile({
        destination: config.folders.upload_user,
        file: file,
        allowedFileMime: ['image/jpeg', 'image/jpg', 'image/png'],
        savedFileName: '' + today.getFullYear() + ("0" + (today.getMonth() + 1)).slice(-2) + today.getDate() + '-' + today.getTime() + '-' + user.id_Emp + '.' + mimeType_temp[1]
      });
      
      if (!newProfilePicture) {
        console.error('[OriginServer] Error saving the file.');
        throw new ApolloError(i18nHelper.__('SERVER_ERROR'), 'SERVER_ERROR');
      }

      // Update the DB
      const picutreUrl = await userHelpers.setProfilePicture(user.id_Emp, newProfilePicture);
      if (!picutreUrl) {
        console.error('[OriginServer] Error updating the profile in DB.');
        throw new ApolloError(i18nHelper.__('SERVER_ERROR'), 'SERVER_ERROR');
      }

      return picutreUrl;
    }

  }
}

module.exports = resolvers;
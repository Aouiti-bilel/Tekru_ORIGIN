import {
    tblEmployes,
    tblEmployes_Niveaux,
    tblPasswordReset,
    Access,
    accessValue
} from '../../models';
import moment from 'moment';
import bcrypt from 'bcrypt';
import utilsHelpers from '../../helpers/utils.helper';
import accessHelpers from '../access/helpers';

const userController = {
    // Set the user val
    user: null,
    passwordToken: [],

    /**
     * Creat a user into the database
     * @param {} userData 
     */
    async creat(userData) {
        // Handel
    },

    /**
     * Get the user by id
     * @param integer id    The user ID
     */
    async getUserById(id) {
        return await this.init(id);
    },

    /**
     * Verify user email and password
     * @param String email 
     * @param String password (not crypted) 
     */
    async verifyEmailPassword(email, password) {
        const user = await this.init(null, {
            'courriel': email
        }); // check
        // if user doesn't exist
        if (!user) {
            return false;
        }
        // check password
        if (await bcrypt.compare(password, user.cpwd)) {
            return user;
        }
        return false;
    },

    /**
     * Get the forget password Token
     * @param String courriel 
     * @returns
     *  false: boolean no user with 
     *  token: string
     */
    async getForgetPasswordToken(courriel) {
        // TODO (Security) add an IP and User Agent verification
        const user = await tblEmployes.findOne({ where: { courriel } })

        if (!user) { // Check if user exists
            return false;
        }

        // Generat a token and save in to the DB
        let token = await bcrypt.hash(user.courriel, 10);
        await tblPasswordReset.create({
            ID_Emp: user.id_Emp,
            token: token,
        });

        return {
            user,
            token
        };
    },

    async setNewPassword(newPassword, userId, token) {
        // Get the user
        const user = await this.init(userId); // check
        
        // Check if record exists in db 
        if (!user) {
            return false;
        }

        // Update and return
        return await user.update({
            'cpwd': await bcrypt.hash(newPassword, 10) // Update the user password
        }).then(() => { // if OK
            // Check for the token modal
            if (this.passwordToken[token]) { // Check if token exists and not used
                this.passwordToken[token].update({
                    'used': true // Set the token to Used
                }).then(() => {
                    this.passwordToken[token] = null; // Destroy the stored model to null
                });
            }
            return user;
        }).catch(function (err) {
            return false;
        });
    },

    async verifyPasswordToken(token) {
        // Check if token exists and not used
        this.passwordToken[token] = await tblPasswordReset.findOne({
            where: {
                token
            }
        });

        if (!this.passwordToken[token] || this.passwordToken[token].used == true) { // Check if token exists and not used
            return false;
        }

        // Check if the token did not expire
        const tokenDate = moment(this.passwordToken.createdAt);
        const diff = moment.duration(moment().diff(tokenDate)).as('seconds');
        if (diff >= (1 * 24 * 60 * 60)) {
            return false;
        }

        return this.passwordToken[token].ID_Emp;
    },

    async setProfilePicture(userId, fileName) {
        // Get the user
        const user = await this.init(userId); // check

        // Check if record exists in db 
        if (!user) {
            return false;
        }

        // Get the full url of the picture
        const fullURLProfilePicture = await utilsHelpers.renderProfilePictureUrl(fileName);
        
        // Update and return
        return await user.update({
            'picture': fileName // Update the user profile picture
        }).then(() => { // if OK
            return fullURLProfilePicture;
        }).catch(function (err) {
            return false;
        });
    },

    /**
     * Activate / deactivate a user
     * @param integer id
     */
    async activateDeactivate(userId) {
        const user = await this.init(userId); // check

        // Check if user exists in db 
        if (!user) {
            return false;
        }

        // Update and return
        return await user.update({
            'actif': !user.actif
        }).then(() => {
            return true;
        }).catch(function (err) {
            return false;
        });
    },

    /**
     * Bulk activate users
     * @param array ids
     */
    async bulkActivateDeactivate(ids, state) {
        // Verify and clean data
        ids = ids.filter(item => typeof item === 'number');
        if (!Array.isArray(ids) || ids.length <= 0 || typeof state !== "boolean") {
            return false;
        }
        // Update the database
        if (! await tblEmployes.update({
            actif: state
        }, {
            where: {
                'id_Emp': ids
            }
        }) ) {
            return false;
        }
        return true;
    },

    /**
     * Change the user access group
     * @param integer groupId 
     * @param integer userId
     */
    async changeGroup(groupId, userId) {
        const user = await this.init(userId); // check

        // Get the tblEmployes_Niveaux
        const userGroup = tblEmployes_Niveaux.findOne({
            where: {
                'Niveau': groupId
            }
        });

        // Check if user and userGroup exists in db 
        if (!user || !userGroup) {
            return false;
        }

        // Update and return
        return await user.update({
            'niveau': groupId
        }).then(() => {
            return true;
        }).catch(function (err) {
            return false;
        });
    },

    /**
     * Check if user has access to an access slug
     * @param string slug
     * @param string privilege
     * @param integer id
     */
    async hasAccess(slug, privilege, userId) {
        // Check the user id 
        userId = parseInt(userId); // parse the int
        if (isNaN(userId) || userId == 0) {
            return false;
        }
        
        // Get the slug access id
        const access = await Access.findOne({
            where: {
                'slug': slug
            }
        });
        
        if (!access) {
            return false;
        }

        return await this.hasAccessByAccessID(access.id, privilege, userId);
    },

    /**
     * Check if user has access
     * @param integer accessId 
     * @param integer id
     */
    async hasAccessByAccessID(accessId, privilege, userId) {
        const user = await this.init(userId); // check

        // Check if user exists in db 
        if (!user) {
            return false;
        }
        
        // Get the data
        let level;
        if (typeof user.niveau == 'object' && user.niveau.niveau) {
            level = user.niveau.niveau;
        } else if (typeof user.niveau == 'number') {
            level = user.niveau;
        } else {
            return false
        }
        
        // Get the access value
        const access = await accessValue.findOne({
            where: {
                'levelId': level,
                'accessId': accessId,
            }
        });
        
        if (!access || !( access[privilege] === true )) {
            return false;
        }

        return true;
    },

    async getUserEmailAdressWithName(userId, user) {
        if (!user) { // If the called did not pass a user object
            user = await this.init(userId); // check
        }
        if (!user) { // if user don't exist
            return false
        }
        return "" + user.prenom + " " + user.nomFamille + " <" + user.courriel + ">";
    },

    async init(id, where) { 
        if (!where) {
            where = {
                'id_Emp': id
            }
        }
        const user = await tblEmployes.findOne({
            where: where,
            include: [{
                model: tblEmployes_Niveaux
            }]
        });
        if (!user) {
            return false;
        }
        if (user.picture != '') {
            user.picture = await utilsHelpers.renderProfilePictureUrl(user.picture);
        }
        user.niveau = user.tblEmployes_Niveaux;
        // Get accesses array
        const levels = await accessHelpers.getLevels([user.niveau.niveau]);
        user.accesses = [{
            id: 0,
            name: "Logged user",
            slug: "login",
            can_view: true,
            can_view_own: true,
            can_create: true,
            can_edit: true,
            can_delete: true,
        }]; // Initiale the login access
        levels[0].accesses.forEach(element => {
            user.accesses.push(element);
        });
        return user;
    }
}

module.exports = userController;
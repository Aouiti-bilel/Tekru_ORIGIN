import db, {
    tblEmployes,
    tblEmployes_Niveaux,
    Access,
    accessValue
} from '../../models';
import slugify from 'slugify';

const accessHelpers = {
    // name of the helper, important for the server log
    name: 'Accesses helper',

    // Set the user val
    level: null,
    levels: null,
    access: null,

    FLAGS: {
        PAGE_FLAG: 1
    },

    /**
     * Get levels details
     * @param integer id
     */
    async getLevels(ids) {
        let whereData = {};
        // Verify and clean data
        if (ids != null) {
            ids = ids.filter(item => typeof item === 'number');
            if (!Array.isArray(ids) || ids.length <= 0) {
                return false;
            }
            whereData = {
                'niveau': ids
            };
        }
        
        // Get data
        const levels = await tblEmployes_Niveaux.findAll({
            where: whereData,
            include: [{
                model: Access,
                as: 'accesses',
                attributes: ['id', 'accessName', 'slug'],
                through: {
                    attributes: ['id', 'value', 'can_view', 'can_view_own', 'can_edit', 'can_create', 'can_delete'],
                }
            }]
        });

        // Get the access value from child and add it the the access
        levels.forEach(element => {
            element.accesses.forEach(access => {
                access.aid = access.accessValue.id;
                access.name = access.accessName;
                access.value = access.accessValue.value;
                access.can_view = (access.accessValue.can_view === true);
                access.can_view_own = (access.accessValue.can_view_own === true);
                access.can_edit = (access.accessValue.can_edit === true);
                access.can_create = (access.accessValue.can_create === true);
                access.can_delete = (access.accessValue.can_delete === true);
            });
        });

        return levels;
    },

    /**
     * Get accesses details
     * @param integer id
     */
    async getAccesses(ids) {
        let where = {};

        if (ids !== undefined) {
            // Verify and clean data
            ids = ids.filter(item => typeof item === 'number');
            if (!Array.isArray(ids) || ids.length <= 0) {
                return false;
            }
            where = {
                'id': ids
            }
        }

        // Get the data
        const accesses = await Access.findAll({
            where: where
        });

        // Reforme the object and init the can_* attribute
        accesses.forEach(access => {
            access.name = access.accessName;
            access.can_view = false;
            access.can_view_own = false;
            access.can_edit = false;
            access.can_create = false;
            access.can_delete = false;
        });
        return accesses;
    },

    /**
     * Grant or disgrant access to a level
     * @param integer levelId
     * @param integer accessId
     * @param string privilege
     * @returns boolean
     */
    async changeAccess(levelId, accessId, privilege) {
        // Validate input
        if (typeof levelId != 'number' || levelId <= 0 || typeof accessId != 'number' || accessId <= 0) {
            return false;
        }

        // Get the access params
        const access = await accessValue.findOne({
            where: {
                'levelId': levelId,
                'accessId': accessId
            }
        });
        
        // Check if access exists
        if (!access) {
            // Creat the access value
            await accessValue.create({
                    'levelId': levelId,
                    'accessId': accessId,
                    [privilege]: true, // Set the value by default to true
                }, {
                // Force the ORM to not add the [id] column
                fields: ['levelId', 'accessId', privilege]
            }).then(() => {
                return true;
            }).catch(function (err) {
                return false;
            });
            return true;
        }

        // Update and return
        return await access.update({
            [privilege]: !(access[privilege] === true)
        }).then(() => {
            return true;
        }).catch(function (err) {
            return false;
        });
    },

    /**
     * Bulk update an access
     * @param integer accessId
     * @param string privilege
     * @param boolean access
     * @returns boolean
     */
    async bulkChangeAccess(accessId, privilege, access=false) {
        // Get the access params
        const accesses = await accessValue.findAll({
            where: {
                'accessId': accessId
            }
        });
        if (!accesses) {
            return false;
        }
        for (const item of accesses) {
            await item.update({
                [privilege]: access
            }).then(() => {
                
            }).catch(function (err) {
                console.log(err);
            });
                
        }
        return true;
    },

    /**
     * Create an Access in the DB
     * @param string name The name of the Access
     * @param string slug The slug of the Access
     * @returns boolean
     */
    async create(name, {slug, flag}) {
        const item = {
            accessName: name,
        }
        if (!slug) {
            item.slug = slugify(name).replace(':', '').toLowerCase();
        }
        if (flag) {
            flag = parseInt(flag);
            switch (flag) {
                case this.FLAGS.PAGE_FLAG:
                    item.pageFlag = true;
                    break;
                default:
                    break;
            }
        }

        let id = 0;
        await Access.create(item)
            .then((result) => {
                id = result.id;
            }).catch(function (err) {
                console.log(err);
            });

        if (!id) {
            return false;
        }

        return id;
    },

    /**
     * Delete an Access in the DB
     * @param integer name The name of the Access
     * @param boolean slug The slug of the Access
     * @returns boolean
     */
    async delete(id, force=false) {
        if (!id) {
            return false;
        }

        const accessValue = await Access.findOne({
            where: {
                id
            },
            attributes: ['pageFlag'],
        });

        if (accessValue.pageFlag || force) {
            return await Access.destroy({
                where: {
                    id
                }
            }).then(async () => {
                await accessValue.destroy({
                    where: {
                        accessId: id
                    }
                }).then(() => {
                    return true;
                }).catch(() => {
                    return false;
                });
            }).catch(() => {
                return false;
            });
        }
        
        return false;
    },

    /**
     * Check if a level has a privilege to an acces
     */
    async hasAccessByLevel(accessId, privilege, levelId) {
        // Get the access value
        const access = await accessValue.findOne({
            where: {
                'levelId': levelId,
                'accessId': accessId,
            }
        });

        if (!access || !(access[privilege] === true)) {
            return false;
        }

        return true;
    },

    /**
     * Clean the DB of unsed accesses
     */
    async cleanOnServerStart() {
        let ops = 0;
        // Get unneeded accesses
        const accesses = await db.sequelize.query('SELECT "id" FROM "tblAccess" WHERE "pageFlag" = 1 AND "id" NOT IN (SELECT "accessId" FROM "tblMenuItems" WHERE "accessId" IS NOT NULL)', {
            type: db.sequelize.QueryTypes.SELECT,
            model: Access,
        });
        if (accesses.length > 0) {
            await Access.destroy({
                where: {
                    id: accesses.map(item => item.id)
                }
            }).then(async () => {
                ops++;
                await accessValue.destroy({
                    where: {
                        accessId: accesses.map(item => item.id)
                    }
                }).then(() => {
                    ops++;
                }).catch(console.log);
            }).catch(console.log);
        }
        // Get the unneeded accessValues
        const accessValues = await db.sequelize.query('SELECT "id" FROM "tblAccessValues" WHERE "accessId" NOT IN (SELECT "id" FROM "tblAccess")', {
            type: db.sequelize.QueryTypes.SELECT,
            model: accessValue,
        });
        if (accessValues.length > 0) {
            await accessValue.destroy({
                where: {
                    id: accessValues.map(item => item.id)
                }
            }).then(() => {
                ops++;
            }).catch(console.log);
        }
        return (ops > 0);
    },

    async init(id) {
        // Get the user if not already in object
        if (!this.user || (id != null && this.user.id_Emp != id)) {
            this.user = await tblEmployes.findOne({
                where: {
                    'id_Emp': id
                }
            });
        }
    }
}

module.exports = accessHelpers;
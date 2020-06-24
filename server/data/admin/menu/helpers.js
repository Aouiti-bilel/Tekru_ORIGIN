import db,{
    MenuItems,
    MenuItemsCategoryPages,
    tblEmployes,
    Access,
    accessValue,
    tblEmployes_Niveaux,
    sequelize
} from '../../../models';
import utilsHelpers from '../../../helpers/utils.helper';
import excerptHelper from '../../../helpers/excerpt.helper';
import userHelpers from '../../user/helpers';
import accessHelpers from '../../access/helpers';
import config from '../../../config';
import slugify from 'slugify';
import jsdom from 'jsdom';

const menuItem = {
    // name of the helper, important for the server log
    name: 'Menues helper',

    /**
     * Get data
     * @param array ids
     */
    async get(parent=0, userId=0, admin=false) {
        // Where
        let where = {
            parentId: null
        }
        if (parent) {
            where = {
                parentId: parent
            };
        }
        // Get data
        const tempData = await MenuItems.findAll({
            where,
            include: [{
                model: Access,
                as: 'access'
            }, {
                model: MenuItemsCategoryPages,
                as: 'data',
                attributes: ['id', 'menuItemId', 'title', 'image', 'color_background', 'color_text', 'link', 'external', 'order'],
            }],
            order: [
                ['order', 'ASC']
            ],
            attributes: ['id', 'type', 'name', 'icon', 'color', 'order', 'link', 'external'],
        });

        // Special traitments
        const data = [];
        for (let element of tempData) {
            if (element.access === null) {
                if (admin) {
                    element.auths = await tblEmployes_Niveaux.findAll({
                        attributes: ['niveau', 'description'],
                    });
                } else {
                    element.access = {
                        name: 'Utilisateur connecté',
                        slug: 'login',
                    }
                }
            } else {
                if (admin) {
                    const levels = await accessValue.findAll({
                        where: {
                            accessId: element.access.id,
                            can_view: true,
                        },
                        attributes: ['levelId'],
                    });
                    element.access.name = element.access.accessName;
                    delete element.access.accessName;
                    element.auths = await tblEmployes_Niveaux.findAll({
                        where: {
                            niveau: levels.map(item => item.levelId)
                        },
                        attributes: ['niveau', 'description'],
                    });
                } else {
                    element.access.name = element.access.accessName;
                    delete element.access.accessName;
                }
            }
            element.children = await this.get(element.id, userId, admin);
            // Get access
            if (!admin) {
                const hasAccess = userHelpers.hasAccess(element.access.slug, 'can_view', userId);
                const hasChildren = (element.children && element.children.length > 0);
                if (!hasAccess) {
                    element.link = '#';
                }
                if (hasAccess || (!hasAccess && hasChildren)) {
                    data.push(element);
                }
            } else {
                data.push(element);
            }
        }

        return data;
    },

    /**
     * Handling a bulk update
     * @param array items Menu items for update/create
     * @param array idsForDelete ids to delete
     * @param integer user_id The user ID
     * @return boolean
     */
    async handle(items, idsForDelete, user_id) {
        // Verify and clean data
        if (!items || items.length <= 0) {
            return false;
        }

        // Generale data handeling
        const accesses_ = {}
        for (let item of items) {
            if (item) {
                if (item.accessSlug) {
                    if (accesses_[item.accessSlug] === undefined) {
                        const tmp = await Access.findOne({
                            where: {
                                slug: item.accessSlug
                            }
                        });
                        accesses_[item.accessSlug] = (tmp && tmp.id ? tmp.id : null);
                    }
                    item.accessId = accesses_[item.accessSlug];
                } else if (item.id) {
                    const tmp = await MenuItems.findOne({
                        where: {
                            id: item.id
                        },
                        include: [{
                            model: Access,
                            as: 'access'
                        }],
                        attributes: ['id'],
                    });
                    if (tmp.access) {
                        item.accessId = tmp.access.id;
                        item.accessSlug = tmp.access.slug;
                    }
                }
                // Handle access to the menu item
                item.accessId = await this.updateAccessForMenuItem({
                    accessId: item.accessId,
                    accessSlug: item.accessSlug,
                    auths: item.auths,
                    itemName: item.name
                });
                delete item.accessSlug;
                delete item.auths;
                if (!item.parentId) {
                    item.parentId = null;
                }
            }
        }
        
        // Get the data
        let dataForUpdate = [],
            dataForInsert = [],
            dataForDelete = [];
        for (let item of items) {
            if (item.id) {
                dataForUpdate.push(item);
            } else {
                if (user_id) {
                    item.createdBy = user_id;
                }
                dataForInsert.push(item);
            }
        }

        // Clean the remove ids
        if (!idsForDelete) {
            idsForDelete = [];
        }
        idsForDelete = idsForDelete.map(id => parseInt(id));
        dataForDelete = idsForDelete.filter(id => id > 0);

        let errors = [];

        // Insert data
        if (dataForInsert.length > 0) {
            for (const item of dataForInsert) {
                if (item.id) delete item.id;
                let categories = [];
                if (item.data && item.data.length > 0) {
                    categories = item.data;
                    delete item.data;
                }
                await MenuItems.create(
                        item, {
                        fields: Object.keys(item) // Force the ORM to not add the [id] column
                    }).then(async (result) => {
                        await this.saveCategoryData(categories, result.id, user_id);
                    }).catch(function (err) {
                        console.error(err);
                        errors.push(err);
                    });
            }
        }

        // Update data
        if (dataForUpdate.length > 0) {
            for (const item of dataForUpdate) {
                const {id} = item;
                delete item.id;
                const tmp = await MenuItems.findOne({
                    where: {
                        'id': id,
                    }
                });
                if (tmp) {
                    let categories = [];
                    if (item.data && item.data.length > 0) {
                        categories = item.data;
                        delete item.data;
                    }
                    await tmp.update(item)
                        .then(async () => {
                            await this.saveCategoryData(categories, id, user_id);
                        }).catch(function (err) {
                            errors.push(err);
                        });
                }
            }
        }

        // Delete data
        if (dataForDelete.length > 0) {
            for (const id of dataForDelete) {
                const item = await MenuItems.findOne({
                    where: {
                        id,
                    },
                    attributes: ['accessId'],
                });
                if (item) {
                    await MenuItems.destroy({
                        where: {
                            id
                        }
                    }).then(async () => {
                        await this.saveCategoryData(null, item.id, user_id);
                        if (item.accessId) {
                            await accessHelpers.delete(item.accessId, false);
                        }
                    }).catch(function (err) {
                        errors.push(err);
                    });
                }
            }
        }

        if (errors.length > 0) {
            return false;
        }

        return true;
    },

    /**
     * Update access data
     * @param array data
     * @param integer id
     * @return boolean
     */
    async updateAccessForMenuItem({accessId, accessSlug, auths, itemName}) {
        // Get levels count
        if (!this.levelsCount) {
            this.levelsCount = await tblEmployes_Niveaux.count();
        }
        if (accessId) { // If the access exists
            await accessHelpers.bulkChangeAccess(accessId, 'can_view', false);
            for (const e of auths) {
                // Make can view
                await accessHelpers.changeAccess(e.niveau, accessId, 'can_view');
            }
        } else {
            if (auths && auths.length === this.levelsCount) { // Every one can view
                accessId = null; // Every logged person can view
            } else {
                // Create an access
                let name = accessSlug;
                const options_ = {};
                if (!name || name === 'login') {
                    name = 'Page: ' + itemName;
                    options_.flag = accessHelpers.FLAGS.PAGE_FLAG;
                }
                accessId = await accessHelpers.create(name, options_);
                if (accessId) {
                    for (const e of auths) {
                        // Make can view
                        await accessHelpers.changeAccess(e.niveau, accessId, 'can_view');
                    }
                }
            }
        }
        return accessId;
    },

    /**
     * Save category data
     * @param array data
     * @param integer id
     * @return boolean
     */
    async saveCategoryData(data, id, user_id=null) {
        if (!id) {
            return false;
        }
        
        // delete all previous data
        await MenuItemsCategoryPages.destroy({
            where: {
                'menuItemId': id
            }
        }).then(() => {
            // Silence is gold
        }).catch((err) => {
            errors.push(err);
        });

        if (!data || data.length <= 0) {
            return false;
        }

        const errors = [];
        const dataForInsert = [];
        let i = 1;
        for (const item of data) {
            dataForInsert.push({
                menuItemId: id,
                title: item.title,
                image: item.image,
                color_text: item.color_text,
                color_background: item.color_background,
                link: item.link,
                external: Boolean(item.external),
                order: i,
                createdBy: user_id,
            });
            i++;
        }
        
        if (dataForInsert.length > 0) {
            await MenuItemsCategoryPages.bulkCreate(
                dataForInsert, {
                    fields: Object.keys(dataForInsert[0]) // Force the ORM to not add the [id] column
                }).then((result) => {
                // Handel data
            }).catch((err) => {
                errors.push(err);
            });
        }

        if (errors.length > 0) {
            return false;
        }

        return true;
    },

    /**
     * Create an item
     * @param object data
     * @return int
     */
    async create(row_data) {
        // Verify and clean data
        if (!row_data || row_data.length <= 0) {
            return false;
        }

        // Get the data
        let data = row_data;
        
        // Clean data
        data.createdBy = parseInt(data.createdBy);
        data.type = parseInt(row_data.type);
        data.order = parseInt(row_data.order);
        data.external = Boolean(row_data.order);
        if (row_data.id) {
            delete data.id;
        }
        if (row_data.color && row_data.color.indexOf('#') >= 0) {
            data.color = row_data.color.slice(1);
        }
        if (row_data.type) {
            data.type = 1;
        }
        
        // Required data
        if (data.type <= 0 || data.name === '') {
            return false;
        }
        
        let errors = [];
        await MenuItems.create(
            data
        ,{
            fields: Object.keys(data) // Force the ORM to not add the [id] column
        }).then((result) => {
            data = result;
        }).catch(function (err) {
            console.error(err);
            errors.push(err);
        });

        if (errors.length > 0) {
            return false;
        }

        return data.id;
    },

    /**
     * Update an item
     * @param array data
     * @return boolean
     */
    async update(data) {
        // Verify and clean data
        if (!data || data.length <= 0 || !data.id) {
            return false;
        }

        const errors = [],
              { id } = data;
        delete data.id;
        await MenuItems.update(
            data
        ,{
            where: {
                id
            }
        }).then(() => {
            // Silence is gold
        }).catch(function (err) {
            errors.push(err);
        });

        if (errors.length > 0) {
            return false;
        }

        return true;
    },

    /**
     * Reorder an item
     * @param int id
     * @param int order
     * @return boolean
     */
    async reorder(id, order) {
        // Verify and clean data
        if (!id || !order) {
            return false;
        }

        const errors = [];
        await MenuItems.update(
            {
                order
            }
        ,{
            where: {
                id
            }
        }).then(() => {
            MenuItems.update({
                order: Sequelize.literal('order + 1')
            }, {
                where: {
                    order: {
                        [Op.gte]: order
                    }
                }
            })
        }).catch(function (err) {
            errors.push(err);
        });

        if (errors.length > 0) {
            return false;
        }

        return true;
    },

    /**
     * Delete data
     * @param array data
     * @return boolean
     */
    async delete(ids) {
        // Verify and clean data
        if (!ids) {
            return false;
        }
        // Filter the input
        ids = ids.map(Number).filter(item => item > 0);
        if (!Array.isArray(ids) || ids.length <= 0) {
            return false;
        }

        //destroy

        let errors = [];
        await MenuItems.destroy({
                where: {
                    'id': ids,
                    'parentId': ids
                }
            }).then(() => {
                MenuItemsCategoryPages.destroy({
                    where: {
                        'menuItemId': ids
                    }
                })
            }).catch(function (err) {
                errors.push(err);
            });

        if (errors.length > 0) {
            return false;
        }

        return true;
    },

    /**
     * Clean the DB of unsed accesses
     */
    async cleanOnServerStart() {
        let ops = 0;
        // Get unneeded categories pages
        const items = await db.sequelize.query('SELECT "id" FROM "tblMenuItemsCategoryPages" WHERE "menuItemId" NOT IN (SELECT "id" FROM "tblMenuItems")', {
            type: db.sequelize.QueryTypes.SELECT,
            model: MenuItemsCategoryPages,
        });
        if (items.length > 0) {
            await MenuItemsCategoryPages.destroy({
                where: {
                    'id': items.map(item => item.id)
                }
            }).then(async () => {
                ops++;
            }).catch(console.log);
        }
        return (ops > 0);
    },
}

module.exports = menuItem;
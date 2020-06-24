'use strict';
module.exports = (sequelize, DataTypes) => {
  const MenuItems = sequelize.define('MenuItems', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    type: DataTypes.INTEGER,
    name: DataTypes.STRING(259),
    icon: DataTypes.STRING(50),
    color: DataTypes.STRING(7),
    order: DataTypes.INTEGER,
    link: DataTypes.STRING(200),
    external: DataTypes.BOOLEAN,
    accessId: DataTypes.INTEGER,
    parentId: {
      type: DataTypes.INTEGER,
      references: {
        key: 'id'
      }
    }, 
    createdBy: DataTypes.INTEGER
  }, {
    tableName: 'tblMenuItems',
  });
  MenuItems.associate = function (models) {
    models.MenuItems.belongsTo(models.tblEmployes, {
      as: 'creator',
      foreignKey: 'createdBy'
    });
    models.MenuItems.belongsTo(models.Access, {
      as: 'access',
      foreignKey: 'accessId'
    });
    models.MenuItems.hasMany(models.MenuItems, {
      as: 'children',
      foreignKey: 'parentId',
    });
    models.MenuItems.hasMany(models.MenuItemsCategoryPages, {
      as: 'data',
      foreignKey: 'menuItemId',
    });
  };
  return MenuItems;
};
'use strict';
module.exports = (sequelize, DataTypes) => {
  const MenuItemsCategoryPages = sequelize.define('MenuItemsCategoryPages', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    menuItemId: DataTypes.INTEGER,
    title: DataTypes.STRING(250),
    image: DataTypes.STRING(300),
    color_text: DataTypes.STRING(7),
    color_background: DataTypes.STRING(7),
    link: DataTypes.STRING(200),
    external: DataTypes.BOOLEAN,
    order: DataTypes.INTEGER,
    createdBy: DataTypes.INTEGER,
  }, {
    tableName: 'tblMenuItemsCategoryPages',
  });
  MenuItemsCategoryPages.associate = function (models) {
    models.MenuItemsCategoryPages.belongsTo(models.tblEmployes, {
      as: 'creator',
      foreignKey: 'createdBy'
    });
    models.MenuItemsCategoryPages.belongsTo(models.MenuItems, {
      as: 'parent',
      foreignKey: 'menuItemId',
      targetKey: 'id'
    });
  };
  return MenuItemsCategoryPages;
};
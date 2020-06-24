'use strict';
module.exports = (sequelize, DataTypes) => {
  const Access = sequelize.define('Access', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    accessName: DataTypes.STRING,
    slug: DataTypes.STRING,
    pageFlag: DataTypes.BOOLEAN,
  }, {
    freezeTableName: true,
    tableName: 'tblAccess'
  });
  Access.associate = function (models) {
    models.Access.belongsToMany(models.tblEmployes_Niveaux, {
      through: {
        model: models.accessValue,
      },
      as: 'aValue',
      foreignKey: 'accessId'
    });
  };
  return Access;
};
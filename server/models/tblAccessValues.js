'use strict';
module.exports = (sequelize, DataTypes) => {
  const accessValue = sequelize.define('accessValue', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    levelId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'tblEmployes_Niveaux',
        key: 'niveau'
      }
    },
    accessId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Access',
        key: 'id'
      }
    },
    value: DataTypes.BOOLEAN,
    can_view: DataTypes.BOOLEAN,
    can_view_own: DataTypes.BOOLEAN,
    can_edit: DataTypes.BOOLEAN,
    can_create: DataTypes.BOOLEAN,
    can_delete: DataTypes.BOOLEAN,
  }, {
    tableName: 'tblAccessValues',
    freezeTableName: true,
  });
  accessValue.associate = function (models) {
    // associations can be defined here
  };
  return accessValue;
};
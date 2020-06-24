'use strict';
module.exports = (sequelize, DataTypes) => {
  const Options = sequelize.define('Options', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    name: DataTypes.STRING,
    value: DataTypes.STRING,
    access: DataTypes.STRING
  }, {
    tableName: 'tblOptions',
  });
  Options.associate = function (models) {
    // No association
  };
  return Options;
};
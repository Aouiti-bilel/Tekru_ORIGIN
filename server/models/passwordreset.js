'use strict';
module.exports = (sequelize, DataTypes) => {
  const tblPasswordReset = sequelize.define('tblPasswordReset', {
    ID_Emp: DataTypes.INTEGER,
    token: DataTypes.STRING,
    used: DataTypes.BOOLEAN,
  }, {
    freezeTableName: true,
  });
  tblPasswordReset.associate = function(models) {
    // associations can be defined here
  };
  class tblPasswordResetExtend extends tblPasswordReset {}
  tblPasswordResetExtend.init({}, {
    freezeTableName: true,
    tableName: 'tblPasswordReset',
    sequelize
  });
  tblPasswordReset.sync();

  return tblPasswordReset;
};
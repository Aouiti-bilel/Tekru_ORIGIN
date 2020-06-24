'use strict';
module.exports = (sequelize, DataTypes) => {
  const tblEmployes_Niveaux = sequelize.define('tblEmployes_Niveaux', {
    niveau: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    description: DataTypes.STRING
  }, {
    freezeTableName: true,
  });
  tblEmployes_Niveaux.associate = function (models) {
    models.tblEmployes_Niveaux.belongsToMany(models.Access, {
      through: {
        model: models.accessValue,
      },
      foreignKey: 'levelId',
      as: 'accesses'
    });
  };
  return tblEmployes_Niveaux;
};
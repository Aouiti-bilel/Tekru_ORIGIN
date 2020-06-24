'use strict';

export default (sequelize, DataTypes) => {
  const tblEmployes = sequelize.define('tblEmployes', {
    code: DataTypes.INTEGER,
    userName: DataTypes.STRING,
    courriel: DataTypes.STRING,
    NomEmploye: DataTypes.STRING,
    nomFamille: DataTypes.STRING,
    prenom: DataTypes.STRING,
    actif: DataTypes.BOOLEAN,
    sexe: DataTypes.STRING,
    fonction: DataTypes.STRING,
    id_Emp: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    pswd: DataTypes.STRING,
    cpwd: DataTypes.STRING,
    picture: DataTypes.STRING,
    niveau: DataTypes.INTEGER,
    codePostal: DataTypes.STRING,
    telBureau: DataTypes.STRING,
    telFax: DataTypes.STRING,
    telCellulaire: DataTypes.STRING,
    telDomicile: DataTypes.STRING,
    telAutre: DataTypes.STRING,
    TauxHoraire: DataTypes.FLOAT
  }, {});
  tblEmployes.associate = function(models) {
    models.tblEmployes.belongsTo(models.tblEmployes_Niveaux, {
      foreignKey: 'niveau'
    });
  };

  return tblEmployes;
};
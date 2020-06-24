'use strict';
module.exports = (sequelize, DataTypes) => {
  const Contents = sequelize.define('Contents', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    author_id: DataTypes.INTEGER,
    title: DataTypes.STRING,
    content: DataTypes.STRING,
    status: DataTypes.INTEGER,
    category: DataTypes.INTEGER,
    excerpt: DataTypes.STRING,
    slug: DataTypes.STRING,
    views: DataTypes.INTEGER,
    featured_image: DataTypes.STRING,
    publishedAt: DataTypes.STRING,
  }, {
    tableName: 'tblContents',
  });
  Contents.associate = function (models) {
    models.Contents.belongsTo(models.tblEmployes, {
      as: 'author',
      foreignKey: 'author_id'
    });
  };
  return Contents;
};
'use strict';
export default (sequelize, DataTypes) => {
  const CalendarHolidays = sequelize.define('CalendarHolidays', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    name: DataTypes.STRING,
    date: DataTypes.STRING,
  }, {
    tableName: 'tblCalendarHolidays',
  });
  return CalendarHolidays;
};
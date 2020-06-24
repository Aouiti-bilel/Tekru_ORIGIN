import { Options } from "../../models";
import utilsHelpers from "../../helpers/utils.helper";
import config from "../../config";
import db, { tblEmployes, CalendarHolidays } from "../../models";
import moment from 'moment';

const helpers = {
  /**
   * Get data
   * @param array slugs
   */
  async widgetReceivedFolder(user) {
		// Get the employee name
		const employee = await tblEmployes.findOne({
      where: {
        id_Emp: user.id_Emp,
      },
		});
		// Prepare the date
		const d = new Date();
		const calendar = {};
		calendar.thisMonth = d.getMonth()+1;
		calendar.lastMonth = {
      month: calendar.thisMonth === 1 ? 12 : calendar.thisMonth - 1,
      year: calendar.thisMonth === 1 ? d.getFullYear() - 1 : d.getFullYear(),
    };
		calendar.thisYear = d.getFullYear();

		// Get the items
    const items = await db.sequelize.query(
      this.trimSQLString(`
				DECLARE @responsable NVARCHAR(250) = '${employee.NomEmploye}';
				DECLARE @daylimit DATE = CONVERT (date, GETDATE());
				SELECT 
					COUNT([tblDossier].[NumeroDossier]) folders,
					SUM(CASE WHEN [tblDossier].[DateMandat] > DATEADD(WEEK, -1, @daylimit) THEN 1 ELSE 0 END) this_week,
					SUM(CASE WHEN 
						[tblDossier].[DateMandat] > DATEADD(WEEK, -2, @daylimit)
						AND [tblDossier].[DateMandat] <= DATEADD(WEEK, -1, @daylimit)
						THEN 1 ELSE 0 END
					) last_week,
					SUM(CASE WHEN [tblDossier].[DateMandat] > DATEADD(MONTH, -1, @daylimit) THEN 1 ELSE 0 END) this_month,
					SUM(CASE WHEN 
						[tblDossier].[DateMandat] > DATEADD(MONTH, -2, @daylimit)
						AND [tblDossier].[DateMandat] <= DATEADD(MONTH, -1, @daylimit)
						THEN 1 ELSE 0 END
					) last_month,
					SUM(CASE WHEN [tblDossier].[DateMandat] > DATEADD(MONTH, -3, @daylimit) THEN 1 ELSE 0 END) this_quarter,
					SUM(CASE WHEN 
						[tblDossier].[DateMandat] > DATEADD(MONTH, -6, @daylimit)
						AND [tblDossier].[DateMandat] <= DATEADD(MONTH, -3, @daylimit)
						THEN 1 ELSE 0 END
					) last_quarter
				FROM [tblDossier]
				WHERE [tblDossier].[Responsable] = @responsable AND [tblDossier].[DateFerme] IS NULL; 
			`),
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    const graphData = await db.sequelize.query(
      this.trimSQLString(`
				WITH CTE AS
				(
					SELECT convert(date, GETDATE()) [date]
					UNION ALL SELECT DATEADD(DAY, -1, [date]) FROM CTE WHERE [date] > DATEADD(DAY, -29, GETDATE())
				)
				SELECT 
					[date],
					COUNT([tblDossier].[NumeroDossier]) AS [openCases]
				FROM [CTE]
				LEFT JOIN [tblDossier] ON
					[CTE].[date] >= [tblDossier].[DateMandat] 
					AND [CTE].[date] < [tblDossier].[DateFerme] 
					AND [tblDossier].[Responsable] = '${employee.NomEmploye}'
				GROUP BY [CTE].[date]
			`),
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
		if (items && items[0]) {
			return {
				active: items[0].folders,
				graph: graphData.map(e => ({
					name: e['date'],
					value: e['openCases'],
				})),
        data: [
          {
            type: "7_days",
            value: items[0].this_week,
            change: this.calcChangePourcentage(
              items[0].last_week,
              items[0].this_week
            ),
          },
          {
            type: "this_month",
            value: items[0].this_month,
            change: this.calcChangePourcentage(
              items[0].last_month,
              items[0].this_month
            ),
          },
          {
            type: "this_quarter",
            value: items[0].this_quarter,
            change: this.calcChangePourcentage(
              items[0].last_quarter,
              items[0].this_quarter
            ),
          },
        ],
      };
    }
		
		return null;
	},

  /**
   * Get data for Widget 2
   * @param object user
	 * @param object options
   */
  async widgetIncome(user, options) {
		// Get the employee name
		const employee = await tblEmployes.findOne({
      where: {
        id_Emp: user.id_Emp,
			},
			attributes: ['NomEmploye', 'TauxHoraire']
		});

		const d = new Date();
		const calendar = {};
		calendar.thisMonth = d.getMonth() + 1;
		calendar.thisYear = d.getFullYear();
		if (calendar.thisMonth >= 10) { // October
			calendar.firstYear = d.getFullYear();
			calendar.secondYear = d.getFullYear() + 1;
		} else {
			calendar.firstYear = d.getFullYear() - 1;
			calendar.secondYear = d.getFullYear();
		}
		// Get the data
		const incomeData = await db.sequelize.query( // Year(Getdate())
			this.trimSQLString(`
			SELECT 
					[Income], [Year], [Month], [Day],
					SUM([Income]) OVER ( ORDER BY [Year], [Month], [Day] ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW ) as [CumulativeSum]
			FROM
					(
							SELECT 
									SUM([tblFactures].[MontantFacture]) AS Income,
									YEAR([tblFactures].[DateFacturation]) AS Year, 
									MONTH([tblFactures].[DateFacturation]) AS Month,
									DAY([tblFactures].[DateFacturation]) AS Day
							FROM [tblFactures]
							WHERE 
							( 
								( YEAR([tblFactures].[DateFacturation]) = ${calendar.firstYear} AND MONTH([tblFactures].[DateFacturation]) >= 10 )
								OR 
								( YEAR([tblFactures].[DateFacturation]) = ${calendar.secondYear} AND MONTH([tblFactures].[DateFacturation]) < 10 )
							) AND [tblFactures].[NumeroDossier] IN ( SELECT [NumeroDossier] FROM [tblDossier] WHERE [responsable] = '${employee.NomEmploye}'  )
							GROUP BY YEAR([tblFactures].[DateFacturation]), MONTH([tblFactures].[DateFacturation]), DAY([tblFactures].[DateFacturation])
					) AS SumTable
			ORDER BY [Year], [Month], [Day]
		`), { type: db.sequelize.QueryTypes.SELECT, });
		
		// TODO render it dynamicly
		const goalsOptions = {
			weekCount: 52, // (52-4),
			hoursGoal: 1200,
		}
		
		// Year day count
		let dayCount = 365;
		if (calendar.thisYear % 400 === 0 || (calendar.thisYear % 100 !== 0 && calendar.thisYear % 4 === 0)) {
			dayCount = 366;
		}
		const dailyGoal = goalsOptions.hoursGoal / dayCount;

		const data = [
			{
				name: 'income',
				data: [],
			},
			{
				name: 'cumulativeIncome',
				data: [],
			},
			{
				name: 'goal',
				data: [],
			},
		];

		const dateStart = moment(`${calendar.firstYear}-10-01`);
		const dateEnd = moment().add(1, 'days');
		let key = 0;
		let lastCumulativeSumNoneZero = 0;
		while (!dateEnd.isSame(dateStart, 'days')) {
			const day = {
				y: parseInt(dateStart.format('YYYY')),
				m: parseInt(dateStart.format('M')),
				d: parseInt(dateStart.format('D')),
			};
			const dateString = dateStart.format();
			const income = incomeData.find(item => item['Year'] === day.y && item['Month'] === day.m && item['Day'] === day.d);
			if (income && income['CumulativeSum'] !== 0) lastCumulativeSumNoneZero = income['CumulativeSum'];
			data[0].data[key] = { name: dateString, value: income ? income['Income'] : 0 };
			data[1].data[key] = { name: dateString, value: income && income['CumulativeSum'] !== 0 ? income['CumulativeSum'] : lastCumulativeSumNoneZero };
			data[2].data[key] = { name: dateString, value: dailyGoal * employee.TauxHoraire * (key + 1) };
			dateStart.add(1, 'days');
			key++;
		}
		
		return data;
	},


  /**
   * Get data for Widget 3
   * @param object user
	 * @param object options
   */
	async widgetSTEC(user, options) {
		// Get the employee name
		const employee = await tblEmployes.findOne({
			where: {
				id_Emp: user.id_Emp,
			},
			attributes: ['NomEmploye']
		});

		// Options
		const { period } = options || {};
		let months, groupBy = [];
		switch (period) {
			case 'year':
				months = 12;
				groupBy = ["YEAR", "MONTH"];
				break;
			case 'month':
				months = 1;
				groupBy = ["YEAR", "MONTH", "DAY"];
				break;
			default:
				months = 3;
				groupBy = ["YEAR", "MONTH", "DAY"];
				break;
		}
		const sqlPeriod = `DATEADD(MONTH, -${months}, GETDATE())`;
		const sqlGroup = `${groupBy.map(e => (`${e}([tblActivites].[DateActivite])`))}`;
		// Get the data
		const dbData = await db.sequelize.query(
      this.trimSQLString(`
			SELECT
    			SUM([tblActivites].[Heures] * [tblActivites].[TauxHoraire]) AS Amount,
					YEAR([tblActivites].[DateActivite]) AS Year, 
					MONTH([tblActivites].[DateActivite]) AS Month
					${months < 12 ? `, DAY([tblActivites].[DateActivite]) AS Day` : ""}
			FROM tblActivites
			WHERE 
					[tblActivites].[Categorie] <> 'Absence'
					AND [tblActivites].[DateActivite] >= ${sqlPeriod}
					AND [tblActivites].[FactureAffecte] IS NULL
					AND [tblActivites].[NumeroDossier] IS NOT NULL
					AND [tblActivites].[NomEmploye] = '${employee.NomEmploye}'
			GROUP BY ${sqlGroup}
			ORDER BY Year, Month ${months < 12 ? `, Day` : ""}
		`),
      { type: db.sequelize.QueryTypes.SELECT }
    );
		
		const data = [
			{
				name: 'inProgress',
				data: [],
			},
		];
		
		let step = months < 12 ? "days" : "months"
		const dateStart = moment().subtract(months, 'months');
		const dateEnd = moment().add(1, step);
		let key = 0;
		while (!dateEnd.isSame(dateStart, step)) {
			const day = {
				y: parseInt(dateStart.format('YYYY')),
				m: parseInt(dateStart.format('M')),
				d: parseInt(dateStart.format('D')),
			};
			const dateString = dateStart.format();
			const amount = dbData.find(item => item['Year'] === day.y && item['Month'] === day.m && (item['Day'] === day.d || months >= 12));
			data[0].data[key] = { name: dateString, value: amount ? amount['Amount'] : 0 };
			dateStart.add(1, step);
			key++;
		}

		return data;
	},
	
  /**
   * Get data for Widget 4
   * @param object user
	 * @param object options
   */
	async widgetBudgetAndDelais(user, options) {
		// Get the employee name
		const employee = await tblEmployes.findOne({
			where: {
				id_Emp: user.id_Emp,
			},
			attributes: ['NomEmploye']
		});

		// Options
		const { period } = options || {};
		let months;
		switch (period) {
			case 'year':
				months = 12;
				break;
			case 'month':
				months = 1;
				break;
			default:
				months = 3;
				break;
		}
		const sqlPeriod = `DATEADD(MONTH, -${months}, GETDATE())`;
		
		// Get the data
		const dbData = await db.sequelize.query(
      this.trimSQLString(`
			SELECT
				ROUND ( 
					( SUM([tblActivites].[Heures] * [tblActivites].[TauxHoraire]) * 100.0 / NULLIF([tblDossier].[Budget], 0) )
				, 3) as [Pourcentage],
				[tblActivites].[NumeroDossier],
				DATEDIFF(DAY, MIN([tblDossier].[DateMandat]), MIN(CASE WHEN [tblActivites].[Activite] LIKE '%Examen%' THEN [tblActivites].[DateActivite] END)) AS DelaiExam,
				DATEDIFF(DAY, MIN(CASE WHEN [tblActivites].[Activite] LIKE '%Examen%' THEN [tblActivites].[DateActivite] END), MIN(CASE WHEN [tblActivites].[Activite] LIKE '%Rédaction%' THEN [tblActivites].[DateActivite] END)) AS DelaiRedaction,
				DATEDIFF(DAY, MIN(CASE WHEN [tblActivites].[Activite] LIKE '%Rédaction%' THEN [tblActivites].[DateActivite] END), MIN(CASE WHEN [tblActivites].[Activite] LIKE '%Révision%' THEN [tblActivites].[DateActivite] END)) AS DelaiRevision,
				MIN([tblDossier].[DateMandat]) DateMandat,
				MIN(CASE WHEN [tblActivites].[Activite] LIKE '%Examen%' THEN [tblActivites].[DateActivite] END) DateExamain,
				MIN(CASE WHEN [tblActivites].[Activite] LIKE '%Rédaction%' THEN [tblActivites].[DateActivite] END) DateRedaction,
				MIN(CASE WHEN [tblActivites].[Activite] LIKE '%Révision%' THEN [tblActivites].[DateActivite] END) DateRevision
			FROM [tblActivites]
			LEFT JOIN [tblDossier] ON [tblActivites].[NumeroDossier] = [tblDossier].[NumeroDossier]
			WHERE
				[tblActivites].[Categorie] <> 'Absence'
				AND [tblDossier].[DatePerte] >= ${sqlPeriod}
				AND [tblDossier].[Responsable] = '${employee.NomEmploye}'
			GROUP BY [tblActivites].[NumeroDossier], [tblDossier].[Budget], [tblDossier].[DatePerte]
			ORDER BY [tblDossier].[DatePerte]
		`),
      { type: db.sequelize.QueryTypes.SELECT }
		);
		
		const dateArray = ["2019-06-28 09:10:52.000", "2019-07-02 00:00:00.000", "2019-07-04 00:00:00.000", null];
		
		const holidaysRaw = await CalendarHolidays.findAll({
			attributes: ['date']
		});
		const holidays = (holidaysRaw || []).map(e => e.date);

		const calcDelais = (dateArray) => {
			const delais = [0, 0, 0];
			const dateStart = moment(dateArray[0]);
			const dateEnd = moment(dateArray.reduce((acc, curr) => curr ? curr : acc));
			let k = 1;
			while (!dateEnd.isSame(dateStart, "days")) {
				const weekDay = dateStart.day() + 1;
				const isWeekend = (weekDay === 1 || weekDay === 7);
				const isHoliday = !!holidays.find(e => dateStart.isSame(moment(e), 'days'))
				if (dateStart.isBefore(dateArray[k])) {
					if (!isWeekend && !isHoliday) { delais[k - 1]++ }
				} else {
					if (!isWeekend && !isHoliday) { delais[k]++; }
					k++;
				}
				dateStart.add(1, "days");
			}
			return delais;
		}
		
		const data = [
			{
				name: 'budget',
				data: (dbData || []).map((folder) => ({
					name: folder["NumeroDossier"],
					value: folder["Pourcentage"],
				}))
			},
			{
				name: 'delais_exam',
				data: [],
			},
			{
				name: 'delais_redaction',
				data: [],
			},
			{
				name: 'delais_revision',
				data: [],
			},
		];

		(dbData || []).map((folder) => {
			const a = [folder.DateMandat, folder.DateExamain, folder.DateRedaction, folder.DateRevision];
			const d = calcDelais(a);
			data[1].data.push({ name: folder.NumeroDossier, value: d[0]});
			data[2].data.push({ name: folder.NumeroDossier, value: d[1]});
			data[3].data.push({ name: folder.NumeroDossier, value: d[2]});
		})

		return data;
	},
	
  /**
   * Get data for Widget 5
   * @param object user
	 * @param object options
   */
	async widgetBvNbHours(user, options) {
		// Get the employee name
		const employee = await tblEmployes.findOne({
			where: {
				id_Emp: user.id_Emp,
			},
			attributes: ['NomEmploye']
		});

		// Options
		const { count, dateSorter } = options;
		const sqlOptions = {
      dateSorter: "DateMandat",
      limit: parseInt(count) || 30,
		};
		// Data protection
		if (sqlOptions.limit > 100) { sqlOptions.limit = 100; }
		switch (dateSorter) {
      case 'closing_date':
				sqlOptions.dateSorter = "DateFerme";
        break;
      default:
				// None
        break;
    }
		// Get the data
		const dbData = await db.sequelize.query(
      this.trimSQLString(`
			SELECT TOP(${sqlOptions.limit})
				[tblActivites].[NumeroDossier],
				[tblClient].[TypeClient],
				[tblClient].[NomClient],
				MAX([tblDossier].[Budget]) as Budget,
				ROUND(SUM(CASE WHEN [tblActivites].[FactureAffecte] IS NOT NULL THEN [tblActivites].[Heures] ELSE 0 END), 3) AS SumBilled,
				ROUND(SUM(CASE WHEN [tblActivites].[FactureAffecte] IS NULL AND [tblActivites].[DateActivite] > [tblDossier].[DateFerme] THEN [tblActivites].[Heures] ELSE 0 END), 3) AS SumNoneBilled,
				ROUND(SUM(CASE WHEN [tblActivites].[FactureAffecte] IS NOT NULL THEN [tblActivites].[Heures] * [tblActivites].[TauxHoraire] ELSE 0 END), 3) AS AmountBilled,
				ROUND(SUM(CASE WHEN [tblActivites].[FactureAffecte] IS NULL AND [tblActivites].[DateActivite] > [tblDossier].[DateFerme] THEN [tblActivites].[Heures] * [tblActivites].[TauxHoraire] ELSE 0 END), 3) AS AmountmNoneBilled
			FROM [tblActivites]
			LEFT JOIN [tblDossier] ON [tblActivites].[NumeroDossier] = [tblDossier].[NumeroDossier]
			LEFT JOIN [tblDossierAClient] ON [tblActivites].[NumeroDossier] = [tblDossierAClient].[NumeroDossier]
			LEFT JOIN [tblClient] ON [tblDossierAClient].[NumeroClient] = [tblClient].[NumeroClient]
			WHERE
				[tblDossier].[DateFerme] IS NOT NULL
				AND [tblDossier].[Responsable] = '${employee.NomEmploye}'
			GROUP BY 
				[tblDossier].[${sqlOptions.dateSorter}], [tblActivites].[NumeroDossier], [tblClient].[TypeClient], [tblClient].[NomClient]
			HAVING
    		SUM(CASE WHEN [tblActivites].[FactureAffecte] IS NULL AND [tblActivites].[DateActivite] > [tblDossier].[DateFerme] THEN [tblActivites].[Heures] ELSE 0 END) > 0
			ORDER BY [tblDossier].[${sqlOptions.dateSorter}] DESC
		`),
      { type: db.sequelize.QueryTypes.SELECT }
    );

		// Get the count
		const dbData2 = await db.sequelize.query(
			this.trimSQLString(`
				SELECT COUNT(DISTINCT([tblActivites].[NumeroDossier])) as Count
				FROM [tblDossier]
				LEFT JOIN [tblActivites] ON [tblActivites].[NumeroDossier] = [tblDossier].[NumeroDossier]
				WHERE
						[tblDossier].[Responsable] = '${employee.NomEmploye}'
						AND [tblActivites].[DateActivite] > [tblDossier].[DateFerme]
						AND [tblActivites].[FactureAffecte] IS NULL;
			`),
			{ type: db.sequelize.QueryTypes.SELECT }
		);
		
		const data = (dbData || []).map((item) => ({
      folder: item["NumeroDossier"],
      customerType: item["TypeClient"],
      customerName: item["NomClient"],
      billed: item["SumBilled"],
      noneBilled: item["SumNoneBilled"],
      amountBilled: item["AmountBilled"],
      amountNoneBilled: item["AmountmNoneBilled"],
      budget: item["Budget"],
    }));

		return {
			count: dbData2[0]["Count"],
			table: data,
		};
	},
	
	calcChangePourcentage(lastValue, newValue) {
		const val = ((newValue - lastValue) / lastValue) * 100.0;
		return val && val !== Infinity ? val : 0;
	},

	trimSQLString(sqlString) {
		return sqlString.replace(/\t/g, '').replace(/\n/g, ' ').replace(/\s\s+/g, ' ').trim();
	}
};

module.exports = helpers;

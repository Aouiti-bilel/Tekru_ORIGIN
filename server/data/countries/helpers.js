import {
    tblcountries,
    tblRegions,
    tblCities
} from '../../models';

const countriesController = {

    /**
     * get all countries from database
     * @author Karim bouhnek
     * @returns  [coutry]
     */
    async getAllCountries() {
        let data = await tblcountries.findAll();
        return data;
    },

    /**
     * get all regions from database
     * @author Karim bouhnek
     * @returns  [region]
     */
    async getAllRegions() {
        let data = await tblRegions.findAll();
        return data;
    },

    /**
     * get all cities from database
     * @author Karim bouhnek
     * @returns  [city]
     */
    async getAllCities(cityFilter) {
        if (cityFilter != null){
            cityFilter = parseInt(cityFilter)
            const region = await tblRegions.findOne({
                where: {
                    'region_id': cityFilter,
                }
            });
            const data = await tblCities.findAll({
                where : {
                    province_code : region.short_name
                }
            });
            return data
        }else{
            const data = await tblCities.findAll();
            return data
        }
    },
}

module.exports = countriesController;

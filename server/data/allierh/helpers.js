import utilsHelpers from '../../helpers/utils.helper';

const helpers = {
    /**
     * Get Allié RH params
     * @param integer id
     */
    async allierh() {
        let data = {};
        
        // Get data
        data.url = utilsHelpers.getOption('allierh_url');

        return data;
    },
}

module.exports = helpers;
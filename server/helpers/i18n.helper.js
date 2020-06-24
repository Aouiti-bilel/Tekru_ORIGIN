import i18n from 'i18n';
import path from 'path';

// @ToDo detect the local language depending of the user header
i18n.configure({
	locales:['fr-fr'],
	defaultLocale: 'fr-fr',
    directory: path.join(__dirname, '../../public/assets/i18n')
});

module.exports = i18n;
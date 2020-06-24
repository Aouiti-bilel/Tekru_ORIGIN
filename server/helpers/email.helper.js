import nodemailer from 'nodemailer';
import handlebars from 'express-handlebars';
import hbs from 'nodemailer-express-handlebars';
import i18nHelper from './i18n.helper';
import utilsHelpers from './utils.helper';
import path from 'path';
import config from '../config';

const emailHelpers = {
	async createTransport() {
		// Creat the mail transporter
		const mailConfig = {
			host: config.email.host,
			port: parseInt(config.email.port),
			secure: config.email.secure,
			requireTLS: config.email.require_TLS,
			auth: {
				user: config.email.username,
				pass: config.email.password
			},
			tls: {
				ciphers: 'SSLv3'
			}
		};
		const mailTransport = nodemailer.createTransport(mailConfig);

		// Get the Handlebars optionq
		const hls = handlebars.create({
			extName: '.hbs',
			partialsDir: path.join(__dirname, '../../public/assets/views/email/partials'),
			layoutsDir: path.join(__dirname, '../../public/assets/views/email'),
			defaultLayout: false,
			helpers: {
				translate: function (str) {
					return (i18nHelper != undefined ? i18nHelper.__(str) : str);
				},
				greetingByGender: function (name, sexe) {
					if (sexe == undefined || sexe == 'M') {
						return i18nHelper.__('HELLO_M') + " " + name;
					} else {
						return i18nHelper.__('HELLO_F') + " " + name;
					}
				}
			}
		});

		const handlebarOptions = {
			viewEngine: hls,
			viewPath: path.join(__dirname, '../../public/assets/views/email'),
		};

		mailTransport.use('compile', hbs(handlebarOptions));

		return mailTransport;
	},
	async renderEmailSubject(subject) {
		const prefix = await utilsHelpers.getOption('email_subject_prefix');
		subject = i18nHelper.__(subject);
		if (prefix == '') {
			return subject
		}
		return prefix + ' | ' + subject;
	},
	async getNoReplyEmail() {
		const email = await utilsHelpers.getOption('email_default_address');
		const companyName = await utilsHelpers.getOption('email_defautl_sender_name');
		return companyName + ' <' + email + '>';
	}
}
module.exports = emailHelpers;
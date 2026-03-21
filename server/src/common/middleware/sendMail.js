/**
 * emailService.js
 * @description :: exports function used in sending mails using nodemailer
 */

import nodeMailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import { logo } from "../helper";

const sendMail = async (obj, template) => {
    let transporter = nodeMailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
        },
    });

    if (!Array.isArray(obj.to)) {
        obj.to = [obj.to];
    }

    const data = {
        ...obj,
        APP_NAME: process.env.APP_NAME,
        logo: logo(),
    };

    const htmlText = await ejs.renderFile(
        path.join(`${__dirname}/../../../views/email/${template}.ejs`),
        data
    );

    return await Promise.all(
        obj.to.map((emailId) => {
            let mailOpts = {
                from: `${process.env.APP_NAME} <${process.env.MAIL_SENDER}>`,
                to: emailId,
                subject: obj.subject,
                html: htmlText,
            };
            transporter.sendMail(mailOpts, function (err, response) {
                if (err) {
                    console.log(`Mail error : ${err}`);
                } else {
                    console.log(`Mail sent : ${mailOpts.to}`);
                }
            });
        })
    );
};

module.exports = sendMail;

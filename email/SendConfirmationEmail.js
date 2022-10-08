import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

async function sendEmail(email, htmlPath, htmlReplacements) {
    const __dirname = path.dirname(new URL(import.meta.url).pathname)
    const filePath = path.join(__dirname, htmlPath);
    let source = fs.readFileSync(filePath, 'utf-8').toString();
    source=source.replace("<LINK_TO_CLICK>",htmlReplacements.linkToClick)
    // const template = Handlebars.compile(source);
    //
    // const htmlToSend = template(htmlReplacements);
    const transporter = nodemailer.createTransport({
        service: "Outlook365",
        auth: {
            user: process.env.EPIPRESTO_MAIL,
            pass: process.env.EPIPRESTO_MAIL_PASSWORD
        }
    });
    const mailOptions = {
        from: process.env.EPIPRESTO_MAIL,
        to: email,
        subject: 'Confirmation de votre é-mail/ E-mail validation',
        html: source,
    };
    await transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    })
}

async function sendConfirmationEmail(email, token) {

    const linkToClick = process.env.WEB_APP_URL + `/verify/${token}`;
    await sendEmail(email, './htmls/AccountVerified.html', {linkToClick});
}

export {sendConfirmationEmail}

import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

async function sendEmail(email, htmlPath, htmlReplacements, subject) {
  const __dirname = path.dirname(new URL(import.meta.url).pathname)
  const filePath = path.join(__dirname, htmlPath);
  let source = fs.readFileSync(filePath, 'utf-8').toString();
  for (let i = 0; i < htmlReplacements.length; i += 2) {
    source = source.replace(htmlReplacements[i], htmlReplacements[i + 1]);
  }
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
    subject: subject,
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
  await sendEmail(email, './htmls/AccountVerified.html', ["<LINK_TO_CLICK>", linkToClick], 'Confirmation de votre é-mail/ E-mail validation');
}

async function sendUpdateStatusEmail(email, orderNumber, newStatus) {
  await sendEmail(email, './htmls/UpdateOrderStatus.html', ["<NEW_STATUS>", newStatus, "<ORDER_NUMBER>", orderNumber], 'Votre commande a été mise à jour/ Your order has been updated');
}

export {sendConfirmationEmail, sendUpdateStatusEmail}

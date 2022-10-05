import nodemailer from "nodemailer";

async function sendConfirmationEmail(email, token) {
    const transporter = nodemailer.createTransport({
        service: "hotmail",
        auth: {
            user: "adam.naoui@outlook.fr",
            pass: "Jirensama11!"
        }
    });
    const linkToClick = process.env.WEB_APP_URL + `/verify?token=${token}`;
    const mailOptions = {
        from: "adam.naoui@outlook.fr",
        to: process.env.EPIPRESTO_MAIL,
        subject: 'Confirmation de votre mail/E-mail validation',
        text: 'Click this link to confirm your email: ' + linkToClick
    };
    await transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        }
    );
}

export {sendConfirmationEmail}

import nodemailer from "nodemailer";

import ejs from "ejs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const currentFilePath = import.meta.url;
const currentDirectory = dirname(fileURLToPath(currentFilePath));
console.log(currentDirectory);

const mail = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: "manikantadon675@gmail.com",
    pass: "avgkooakcusxdaze",
  },
});

// send mail
const sendEmailVerificationLink = async (email, token, name) => {
  try {
    const renderedContent = await ejs.renderFile(
      `${currentDirectory}/../templates/confirmEmail.ejs`,
      { token, name }
    );
    const mailOptions = {
      from: "manikantadon675@gmail.com",
      to: email,
      subject: "Email Verification",
      html: renderedContent,
    };
    const verificationInfo = await mail.sendMail(mailOptions);
    return verificationInfo;
  } catch (error) {
    return error;
  }
};
const sendPasswordResetLink = async (email, token, name) => {
  try {
    const renderedContent = await ejs.renderFile(
      `${currentDirectory}/../templates/reset_password_email.ejs`,
      { token, name }
    );
    const mailOptions = {
      from: "manikantadon675@gmail.com",
      to: email,
      subject: "StoryTime : Password Reset",
      html: renderedContent,
    };
    const verificationInfo = await mail.sendMail(mailOptions);
    return verificationInfo;
  } catch (error) {
    return error;
  }
};

export default sendEmailVerificationLink;
const name = "Manikanta";

export { sendEmailVerificationLink, sendPasswordResetLink };

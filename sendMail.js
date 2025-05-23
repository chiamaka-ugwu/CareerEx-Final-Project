const nodemailer = require("nodemailer");

const sendForgotPasswordEmail = async (email, token) => {
  try {
    const mailTransport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: `${process.env.EMAIL}`,
        pass: `${process.env.EMAIL_PASSWORD}`,
      },
    });

    const mailDetails = {
      from: `${process.env.EMAIL}`,
      to: `${email}`,
      subject: "Reset Password Notification",
      html: `
        <div style="font-family: Arial, sans-serif; background: #f7f7f7; padding: 40px 0;">
          <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 32px;">
            <h2 style="color: #2d3748; text-align: center;">Reset Your Password</h2>
            <p style="color: #444; font-size: 16px;">
              We received a request to reset your password. Please click the button below to proceed:
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://www.yourcareerex.com/reset-password/${token}" 
                 style="background: #007bff; color: #fff; padding: 14px 32px; border-radius: 5px; text-decoration: none; font-size: 16px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #444; font-size: 15px;">
              If the button above does not work, please copy and paste the following link into your browser:
            </p>
            <div style="background: #f1f1f1; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 14px;">
              <a href="https://www.yourcareerex.com/reset-password/${token}" style="color: #007bff;">
                https://www.yourcareerex.com/reset-password/${token}
              </a>
            </div>
            <p style="color: #888; font-size: 13px; margin-top: 32px;">
              If you did not request a password reset, please ignore this email.<br>
              <br>
              <strong>Your reset token:</strong> <span style="color: #007bff;">${token}</span>
            </p>
            <p style="color: #bbb; font-size: 12px; text-align: center; margin-top: 40px;">
              &copy; ${new Date().getFullYear()} CareerEx. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    await mailTransport.sendMail(mailDetails);
  } catch (error) {
    console.log(error);
  }
};

const validEmail = (email) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

module.exports = {
  sendForgotPasswordEmail,
  validEmail,
};

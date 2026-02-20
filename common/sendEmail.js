const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  secure: true,
  port: 587,
});

if (process.env.NODE_ENV !== "production") {
  transporter.verify((error, success) => {
    if (error) {
      console.log("Email configuration error:", error);
    } else {
      console.log("Email service ready");
    }
  });
}

const sendOtpEmail = async (email, otp, name) => {
  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "Van Pooling System"}" <${
        process.env.EMAIL_USER
      }>`,
      to: email,
      subject: "Email Verification - OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Email Verification</h2>
            
            <p style="color: #666; font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 30px;">
              Your One-Time Password (OTP) for email verification is:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <span style="background-color: #007bff; color: white; padding: 15px 30px; font-size: 28px; font-weight: bold; border-radius: 5px; letter-spacing: 5px;">
                ${otp}
              </span>
            </div>
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 20px 0;">
              This OTP will expire in 5 minutes
            </p>
            
            <p style="color: #666; font-size: 14px; margin: 20px 0;">
              If you didn't request this verification, please ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} Van Pooling Management System. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("OTP email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send OTP email");
  }
};

const sendWelcomeEmail = async (email, name, role) => {
  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "Van Pooling System"}" <${
        process.env.EMAIL_USER
      }>`,
      to: email,
      subject: "Welcome to Van Pooling Management System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #007bff; text-align: center; margin-bottom: 20px;">Welcome!</h1>
            
            <p style="color: #666; font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 15px;">
              Thank you for registering with Van Pooling Management System as a <strong>${role}</strong>.
            </p>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
              Your account has been successfully created. You now logged in to access all features.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} Van Pooling Management System. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };
    // <div style="text-align: center; margin: 30px 0;">
    //   <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login"
    //      style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
    //     Go to Login
    //   </a>
    // </div>

    const info = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw new Error("Failed to send welcome email");
  }
};

const sendDriverApprovalEmail = async (email, name, approved) => {
  try {
    const status = approved ? "Approved" : "Rejected";
    const message = approved
      ? "Congratulations! Your application has been approved. You can now start accepting bookings."
      : "Unfortunately, your application has been rejected. Please contact support for more information.";
    const backgroundColor = approved ? "#28a745" : "#dc3545";

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "Van Pooling System"}" <${
        process.env.EMAIL_USER
      }>`,
      to: email,
      subject: `Driver Application ${status}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: ${backgroundColor}; text-align: center; margin-bottom: 20px;">Application ${status}</h2>
            
            <p style="color: #666; font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
              ${message}
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <span style="background-color: ${backgroundColor}; color: white; padding: 12px 30px; border-radius: 5px; font-weight: bold;">
                Status: ${status}
              </span>
            </div>
            
            <p style="color: #666; font-size: 14px; margin: 20px 0;">
              If you have any questions, please contact our support team.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} Van Pooling Management System. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Driver approval email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending driver approval email:", error);
    throw new Error("Failed to send driver approval email");
  }
};

const sendPasswordResetEmail = async (email, name) => {
  try {
    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/reset-password?email=${email}`;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "Van Pooling System"}" <${
        process.env.EMAIL_USER
      }>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Password Reset</h2>
            
            <p style="color: #666; font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
              We received a request to reset your password. Click the button below to set a new password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                 style="background-color: #ffc107; color: #333; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 20px 0;">
              This link will expire in 30 minutes
            </p>
            
            <p style="color: #666; font-size: 14px; margin: 20px 0;">
              If you didn't request a password reset, please ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} Van Pooling Management System. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

const sendBookingConfirmationEmail = async (email, name, bookingDetails) => {
  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "Van Pooling System"}" <${
        process.env.EMAIL_USER
      }>`,
      to: email,
      subject: "Booking Confirmation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #28a745; text-align: center; margin-bottom: 20px;">Booking Confirmed</h2>
            
            <p style="color: #666; font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
              Your booking has been confirmed. Here are the details:
            </p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Booking ID:</strong> ${
                bookingDetails.bookingId || "N/A"
              }</p>
              <p style="margin: 10px 0;"><strong>Date:</strong> ${
                bookingDetails.date || "N/A"
              }</p>
              <p style="margin: 10px 0;"><strong>Time:</strong> ${
                bookingDetails.time || "N/A"
              }</p>
              <p style="margin: 10px 0;"><strong>Pickup Location:</strong> ${
                bookingDetails.pickupLocation || "N/A"
              }</p>
              <p style="margin: 10px 0;"><strong>Destination:</strong> ${
                bookingDetails.destination || "N/A"
              }</p>
              <p style="margin: 10px 0;"><strong>Total Cost:</strong> Rs. ${
                bookingDetails.cost || "0"
              }</p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin: 20px 0;">
              Please arrive 5 minutes before the scheduled pickup time.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} Van Pooling Management System. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Booking confirmation email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending booking confirmation email:", error);
    throw new Error("Failed to send booking confirmation email");
  }
};

const sendEmail = async (mailOptions) => {
  try {
    const defaultFrom = `"${
      process.env.EMAIL_FROM_NAME || "Van Pooling System"
    }" <${process.env.EMAIL_USER}>`;
    const options = {
      from: defaultFrom,
      ...mailOptions,
    };

    const info = await transporter.sendMail(options);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

module.exports = {
  sendOtpEmail,
  sendWelcomeEmail,
  sendDriverApprovalEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendEmail,
};

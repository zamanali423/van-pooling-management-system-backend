const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { pool } = require("../../utils/dbConnection");
const {
  sendOtpEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
} = require("../../common/sendEmail");

const registerUser = async (req, res) => {
  try {
    const { full_name, email, phone, password, role } = req.body;
    const profile_photo = req.files?.profile_photo?.[0]?.path;

    console.log("Registration attempt:", { full_name, email, phone, role });

    if (!full_name || !email || !phone || !password || !role)
      return res.status(400).json({ message: "Missing required fields" });

    // Check for duplicate email
    const emailExists = await pool.query(
      "SELECT id FROM users WHERE LOWER(email)=LOWER($1)",
      [email],
    );

    if (emailExists.rows.length > 0) {
      console.log("Email already exists:", email);
      return res.status(409).json({
        message: "Email already registered",
        field: "email",
      });
    }

    const phoneExists = await pool.query(
      "SELECT id FROM users WHERE phone=$1",
      [phone],
    );

    if (phoneExists.rows.length > 0) {
      console.log("Phone already exists:", phone);
      return res.status(409).json({
        message: "Phone number already registered",
        field: "phone",
      });
    }

    const hash = await bcrypt.hash(password, 10);

    await pool.query("BEGIN");

    const user = await pool.query(
      `
      INSERT INTO users(full_name,email,phone,password,role,profile_photo,is_verified)
      VALUES ($1,$2,$3,$4,$5,COALESCE($6,''),false)
      RETURNING id
    `,
      [full_name, email, phone, hash, role, profile_photo],
    );

    const userId = user.rows[0].id;

    if (role === "DRIVER") {
      await pool.query(
        `
        INSERT INTO driver_documents(driver_id,driver_license,id_card,vehicle_docs,vehicle_photo,number_plate,is_verified)
        VALUES ($1,$2,$3,$4,$5,$6,false)
      `,
        [
          userId,
          req.files?.driver_license?.[0]?.path,
          req.files?.id_card?.[0]?.path,
          req.files?.vehicle_docs?.[0]?.path,
          req.files?.vehicle_photo?.[0]?.path,
          req.files?.number_plate?.[0]?.path,
        ],
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await pool.query(
      `
      INSERT INTO users_otp(user_id,otp,expires_at)
      VALUES($1,$2,NOW() + interval '5 minutes')
    `,
      [userId, otp],
    );

    await pool.query("COMMIT");

    try {
      await sendOtpEmail(email, otp, full_name);
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
    }

    res.status(201).json({ message: "Registered. Verify OTP." });
  } catch (err) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  }
};

const loginUser = async (req, res) => {
  const { email, phone, password } = req.body;

  try {
    const u = await pool.query(
      `
    SELECT u.id,u.full_name,u.email,u.phone,u.password,u.is_verified,u.role,da.is_approved
    FROM users u LEFT JOIN driver_approvals da ON u.id=da.driver_id WHERE email=$1
  `,
      [email],
    );

    if (!u.rowCount)
      return res.status(400).json({ message: "Invalid credentials" });

    const user = u.rows[0];
    const driverApproval = await pool.query(
      "SELECT is_approved FROM driver_approvals WHERE driver_id=$1",
      [user.id],
    );

    if (!user.is_verified)
      return res.status(403).json({ message: "Verify OTP first" });
    if (user.role === "DRIVER" && !driverApproval)
      return res.status(403).json({
        message:
          "Police record verification is in progress. Please try again later.",
      });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.status(400).json({ message: "Email or password incorrect" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || "1d" },
    );

    try {
      await sendWelcomeEmail(email, user.full_name, user.role);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    return res
      .status(200)
      .json({ message: "Login successful", role: user.role, token });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  const { email, phone, otp } = req.body;

  try {
    const r = await pool.query(
      `
    SELECT u.id FROM users u
    JOIN users_otp o ON o.user_id=u.id
    WHERE u.email=$1 AND o.otp=$2 AND o.status='PENDING' AND o.expires_at>NOW()
  `,
      [email, otp],
    );

    if (!r.rowCount)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    await pool.query("UPDATE users SET is_verified=true WHERE id=$1", [
      r.rows[0].id,
    ]);
    await pool.query(
      "UPDATE users_otp SET status='VERIFIED', otp='' WHERE user_id=$1",
      [r.rows[0].id],
    );

    return res.status(200).json({ message: "OTP verified" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const resendOtp = async (req, res) => {
  const { email, phone } = req.body;
  try {
    const r = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (!r.rowCount) return res.status(400).json({ message: "User not found" });
    const userId = r.rows[0].id;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await pool.query(
      `
      INSERT INTO users_otp(user_id,otp,expires_at)
      VALUES($1,$2,NOW() + interval '5 minutes')
    `,
      [userId, otp],
    );

    try {
      const user = await pool.query(
        "SELECT full_name, email FROM users WHERE id=$1",
        [userId],
      );
      if (user.rowCount) {
        await sendOtpEmail(user.rows[0].email, otp, user.rows[0].full_name);
      }
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
    }

    return res.status(200).json({ message: "OTP resent" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const r = await pool.query(
      "SELECT id, full_name FROM users WHERE email=$1",
      [email],
    );
    if (!r.rowCount) return res.status(400).json({ message: "User not found" });
    const userId = r.rows[0].id;
    const fullName = r.rows[0].full_name;
    // const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // await pool.query(
    //   `
    //   INSERT INTO users_otp(user_id,otp,expires_at)
    //   VALUES($1,$2,NOW() + interval '15 minutes')
    // `,
    //   [userId, otp]
    // );
    try {
      // await sendOtpEmail(email, otp, fullName);
      await sendPasswordResetEmail(email, fullName);
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
    }
    res.status(200).json({
      message: "Check your email, link sent for password reset on your email.",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const r = await pool.query(
      `
    SELECT id FROM users WHERE email=$1`,
      [email],
    );
    if (!r.rowCount) return res.status(404).json({ message: "User not found" });
    const userId = r.rows[0].id;
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password=$1 WHERE id=$2", [
      hash,
      userId,
    ]);
    // await pool.query(
    //   "UPDATE users_otp SET status='VERIFIED', otp='' WHERE user_id=$1",
    //   [userId]
    // );
    res.status(200).json({ message: "Password reset successful." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
};

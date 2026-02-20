const { pool } = require("../../utils/dbConnection");
const bcrypt = require("bcryptjs");

getUser = async (req, res) => {
  try {
    return res.status(200).json({ user: req.user });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

editUserDetails = async (req, res) => {
  try {
    const { full_name, phone, email, password, profile_photo } = req.body;
    const user_id = req.user.id;

    const exists = await pool.query("SELECT id FROM users WHERE id=$1", [
      user_id,
    ]);
    if (!exists.rows.length)
      return res.status(404).json({ message: "User not found" });

    let hash = null;
    if (password) {
      hash = await bcrypt.hash(password, 10);
    }

    const result = await pool.query(
      `UPDATE users SET 
          full_name = COALESCE($1, full_name),
          phone = COALESCE($2, phone),
          email = COALESCE($3, email),
          password = COALESCE($4, password),
          profile_photo = COALESCE($5, profile_photo)
       WHERE id=$6
       RETURNING id, full_name, phone, email, profile_photo`,
      [full_name, phone, email, hash, profile_photo, user_id]
    );

    return res
      .status(200)
      .json({ message: "Profile updated", user: result.rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

deleteUser = async (req, res) => {
  try {
    const user_id = req.user.id;

    const exists = await pool.query("SELECT id FROM users WHERE id=$1", [
      user_id,
    ]);
    if (!exists.rows.length)
      return res.status(404).json({ message: "User not found" });

    await pool.query("DELETE FROM users WHERE id=$1", [user_id]);

    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

module.exports = { getUser, editUserDetails, deleteUser };

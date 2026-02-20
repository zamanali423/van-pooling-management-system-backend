const { pool } = require("../../utils/dbConnection");

getAllSchools = async (req, res) => {
  try {
    const schools = await pool.query(
      "SELECT s.id,s.address,u.full_name FROM schools s LEFT JOIN users u ON u.id=s.user_id WHERE s.service_active=true AND s.is_active=true"
    );
    res.json(schools.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getAllSchools,
};

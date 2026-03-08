const { pool } = require("../../utils/dbConnection");

getAllSchools = async (req, res) => {
  try {
    const schools = await pool.query(
      `SELECT s.id,
      s.school_name,
      s.city,
      u.full_name,
      JSONB_AGG(to_jsonb(sb.*)) AS school_branches
       FROM schools s LEFT JOIN school_branches sb ON sb.school_id=s.id LEFT JOIN users u ON u.id=s.owner_user_id
       WHERE s.service_active=true AND s.is_active=true
       GROUP BY s.id, u.full_name
       `,
    );
    res.json(schools.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

allDrivers = async (req, res) => {
  try {
    await pool.query("BEGIN");
    const r = await pool.query(
      `SELECT u.*,
       da.status,
       r.name AS route_name,
       v.number_plate AS van_number,
       COALESCE(SUM(dr.rating) / COUNT(dr.driver_id), 0) AS total_rating,
       COALESCE(AVG(dr.rating), 0) AS average_rating,
       COUNT(DISTINCT b.id) AS total_bookings,
       (
        (COALESCE(AVG(dr.rating),0) / 5) * 0.5 +
        (COUNT(DISTINCT b.id)::float / NULLIF((SELECT COUNT(*) FROM bookings),0)) * 0.3 +
        (CASE WHEN da.status='VERIFIED' THEN 1 ELSE 0 END) * 0.2
       ) AS performance_score,
       COUNT(c.id) AS total_complaints
      FROM users u
        LEFT JOIN driver_approvals da ON da.driver_id = u.id
        LEFT JOIN vans v ON v.driver_id = u.id
        LEFT JOIN routes r ON r.van_id = v.id
        LEFT JOIN bookings b ON b.van_id = v.id
        LEFT JOIN driver_ratings dr ON dr.driver_id = u.id
        LEFT JOIN complaints c ON c.driver_id = u.id
        LEFT JOIN school_branches sb ON sb.id = da.branch_id
        LEFT JOIN schools s ON s.id = sb.school_id
      
      WHERE u.role='DRIVER' AND u.is_verified = true AND s.id = $1 GROUP BY u.id, da.status, r.name, v.number_plate ORDER BY u.created_at DESC`,
      [req.user.id],
    );
    await pool.query("COMMIT");
    res.json(r.rows);
  } catch (e) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  }
};

allComplaints = async (req, res) => {
  try {
    await pool.query("BEGIN");
    const r = await pool.query(
      `SELECT c.* ,
         u.full_name AS driver_name,
         child.full_name AS child_name,
         child.grade,
         p.full_name,
         p.phone
      
      FROM complaints c LEFT JOIN users u ON u.id = c.driver_id LEFT JOIN users p ON p.id = c.parent_id LEFT JOIN children child ON child.parent_id = c.parent_id WHERE c.school_id=$1 ORDER BY c.created_at DESC`,
      [req.user.id],
    );
    await pool.query("COMMIT");
    res.json(r.rows);
  } catch (e) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  }
};

verifyComplaint = async (req, res) => {
  const { complaintId } = req.params;
  const { status } = req.body;
  console.log(complaintId, status);
  try {
    if (!complaintId || !status) {
      return res
        .status(400)
        .json({ message: "Complaint id and status required" });
    }
    await pool.query("BEGIN");
    const r = await pool.query(`UPDATE complaints SET status=$1 WHERE id=$2`, [
      status,
      complaintId,
    ]);
    await pool.query("COMMIT");
    res.json({ message: `Complaint ${status}` });
  } catch (e) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  }
};

viewSpecificDriverComplaints = async (req, res) => {
  const { driverId } = req.params;
  try {
    await pool.query("BEGIN");
    const r = await pool.query(
      `SELECT c.* ,
         u.full_name AS driver_name,
         child.full_name AS child_name,
         child.grade,
         p.full_name,
         p.phone
      FROM complaints c
        LEFT JOIN users u ON u.id = c.driver_id
        LEFT JOIN users p ON p.id = c.parent_id
        LEFT JOIN children child ON child.parent_id = c.parent_id
      WHERE c.driver_id = $1
      ORDER BY c.created_at DESC`,
      [driverId],
    );
    await pool.query("COMMIT");
    res.json(r.rows);
  } catch (e) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  }
};

driverMatrics = async (req, res) => {
  try {
    await pool.query("BEGIN");
    const r = await pool.query(
      `SELECT u.full_name,
      COALESCE(AVG(dr.rating), 0) AS average_rating,
       (
        (COALESCE(AVG(dr.rating),0) / 5) * 0.5 +
        (COUNT(DISTINCT b.id)::float / NULLIF((SELECT COUNT(*) FROM bookings),0)) * 0.3 +
        (CASE WHEN da.status='VERIFIED' THEN 1 ELSE 0 END) * 0.2
       ) AS performance_score,
         COUNT(c.id) AS total_complaints,
         da.status AS verification_status
      FROM users u
        LEFT JOIN driver_approvals da ON da.driver_id = u.id
        LEFT JOIN driver_ratings dr ON dr.driver_id = u.id
        LEFT JOIN complaints c ON c.driver_id = u.id
        LEFT JOIN vans v ON v.driver_id = u.id
        LEFT JOIN bookings b ON b.van_id = v.id
        LEFT JOIN school_branches sb ON sb.id = da.branch_id
        LEFT JOIN schools s ON s.id = sb.school_id
        WHERE s.id = $1 AND u.role='DRIVER' AND u.is_verified = true
        GROUP BY u.full_name, da.status
      `,
      [req.user.id],
    );
    await pool.query("COMMIT");
    res.json(r.rows);
  } catch (e) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getAllSchools,
  allDrivers,
  allComplaints,
  verifyComplaint,
  viewSpecificDriverComplaints,
  driverMatrics,
};

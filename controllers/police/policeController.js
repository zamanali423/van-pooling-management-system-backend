const { pool } = require("../../utils/dbConnection");

driverApplications = async (req, res) => {
  try {
    await pool.query("BEGIN");
    const policeId = req.user.id;
    const { rows: police } = await pool.query(
      "SELECT * FROM users WHERE id=$1 AND role='POLICE'",
      [policeId],
    );
    if (police.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(403).json({ message: "Access denied" });
    }
    const r = await pool.query(
      `
      SELECT 
    U.id,
    U.full_name,
    U.email,
    U.phone,
    U.created_at,
    DA.approved_at AS approval_date,
    DA.status,
     ARRAY_AGG(DISTINCT V.number_plate) 
          FILTER (WHERE V.id IS NOT NULL) AS vans,
    JSONB_AGG(DISTINCT DD) FILTER (WHERE DD.id IS NOT NULL) AS driver_documents
    FROM users U
    LEFT JOIN driver_approvals DA ON U.id = DA.driver_id
    LEFT JOIN driver_documents DD ON U.id = DD.driver_id
    LEFT JOIN vans V ON U.id = V.driver_id
    WHERE U.role = 'DRIVER' 
      AND U.is_verified = true
    GROUP BY 
        U.id,
        U.full_name,
        U.email,
        U.phone,
        U.created_at,
        DA.status,
        DA.approved_at;
    `,
    );
    await pool.query("COMMIT");
    const drivers = {
      drivers: r.rows,
      police: police[0],
    };
    res.json(drivers);
  } catch (e) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  }
};

verifyDriver = async (req, res) => {
  const { driver_id } = req.params;
  const { is_approved } = req.body;
  try {
    await pool.query("BEGIN");
    await pool.query(
      `UPDATE driver_approvals SET status=$1, approved_at=CURRENT_TIMESTAMP,
       approved_by=$2 WHERE driver_id=$3`,
      [is_approved ? "VERIFIED" : "REJECTED", req.user.id, driver_id],
    );
    await pool.query(
      `UPDATE driver_documents SET is_verified=$1, verified_at=CURRENT_TIMESTAMP, verified_by=$2 WHERE driver_id=$3`,
      [is_approved, req.user.id, driver_id],
    );
    const police = await pool.query(
      `UPDATE driver_police_verifications SET status=$1, verified_at=CURRENT_TIMESTAMP,police_id=$2 driver_id=$3 WHERE driver_id=$3`,
      [is_approved ? "VERIFIED" : "REJECTED", req.user.id, driver_id],
    );
    if (police.rowCount === 0) {
      await pool.query(
        `INSERT INTO driver_police_verifications (driver_id, police_id, status, verified_at,created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [driver_id, req.user.id, is_approved ? "VERIFIED" : "REJECTED"],
      );
    }
    await pool.query("COMMIT");
    res.json({
      message: `Driver ${is_approved ? "approved" : "rejected"} successfully`,
    });
  } catch (e) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  }
};

report = async (req, res) => {
  try {
    await pool.query("BEGIN");
    const report = await pool.query(
      `
      SELECT COUNT(DD.driver_license) AS total_drivers_licensed,
      COUNT(DD.id_card) AS total_drivers_id_card, 
      COUNT(DD.vehicle_docs) AS total_drivers_vehicle_docs,
      COUNT(DD.vehicle_photo) AS total_drivers_vehicle_photo,
      COUNT(DD.number_plate) AS total_drivers_number_plate,
      COUNT(CASE WHEN DA.status = 'VERIFIED' THEN 1 END) AS total_verified_drivers,
      COUNT(CASE WHEN DA.status = 'REJECTED' THEN 1 END) AS total_rejected_drivers
      from driver_documents DD
      JOIN driver_approvals DA ON DA.driver_id=DD.driver_id
      JOIN driver_police_verifications DPV ON DPV.driver_id=DD.driver_id
      WHERE DPV.police_id=$1
      GROUP BY DPV.police_id
      `,
      [req.user.id],
    );
    await pool.query("COMMIT");
    res.json(report.rows[0]);
  } catch (e) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  }
};

module.exports = { driverApplications, verifyDriver, report };

// CASE
//         WHEN DA.is_approved = true THEN 'VERIFIED'
//         WHEN DA.is_approved = false THEN 'REJECTED'
//         ELSE 'PENDING'
//         END AS status,

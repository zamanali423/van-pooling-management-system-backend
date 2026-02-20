const { pool } = require("../../utils/dbConnection");

const createNewRoute = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { van_id, school_id, name } = req.body;

    const van = await pool.query(
      "SELECT * FROM vans WHERE id=$1 AND driver_id=$2",
      [van_id, driverId]
    );
    if (!van.rowCount) return res.status(403).json({ message: "Not your van" });

    const r = await pool.query(
      "INSERT INTO routes(van_id,school_id,name) VALUES($1,$2,$3) RETURNING *",
      [van_id, school_id, name]
    );
    res.status(201).json({ route: r.rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

getDriverRoutes = async (req, res) => {
  try {
    const r = await pool.query(
      `
    SELECT r.*, s.name AS school
    FROM routes r
    JOIN schools s ON s.id=r.school_id
    JOIN vans v ON v.id=r.van_id
    WHERE v.driver_id=$1`,
      [req.user.id]
    );
    res.json({ routes: r.rows });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

const updateRouteLocation = async (req, res) => {
  try {
    const driverId = req.user.id;
    const routeId = req.params.routeId;
    const { latitude, longitude } = req.body;

    const result = await pool.query(
      `UPDATE routes
       SET latitude = $1, longitude = $2
       WHERE id = $3 AND driver_id = $4
       RETURNING *`,
      [latitude, longitude, routeId, driverId]
    );

    if (!result.rowCount)
      return res.status(404).json({ message: "Route not found" });

    res.json({ message: "Route location updated", route: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteRoute = async (req, res) => {
  try {
    const driverId = req.user.id;
    const routeId = req.params.routeId;

    const result = await pool.query(
      `DELETE FROM routes
       WHERE id = $1 AND driver_id = $2
       RETURNING id`,
      [routeId, driverId]
    );

    if (!result.rowCount)
      return res.status(404).json({ message: "Route not found" });

    res.json({ message: "Route deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

viewAssignedStudents = async (req, res) => {
  try {
    const q = await pool.query(
      `
    SELECT 
      c.id,c.full_name,
      u.full_name AS parent_name,
      b.id AS booking_id
    FROM bookings b
    JOIN children c ON c.id=b.child_id
    JOIN users u ON u.id=c.parent_id
    JOIN vans v ON v.id=b.van_id
    WHERE v.driver_id=$1 AND b.status='ACTIVE'
  `,
      [req.user.id]
    );
    res.json({ students: q.rows });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

const viewStudentDetails = async (req, res) => {
  try {
    const driverId = req.user.id;
    const childId = req.params.studentId;

    const result = await pool.query(
      `
      SELECT 
        ROW_TO_JSON(C) AS child_info,

        JSON_BUILD_OBJECT(
          'van_id', B.van_id,
          'status', B.status,
          'booking_date', B.booking_date
        ) AS booking_info,

        JSON_BUILD_OBJECT(
          'parent_address', P.address,
          'user', JSON_BUILD_OBJECT(
            'id', U.id,
            'username', U.username,
            'email', U.email,
            'contact', U.contact,
            'role', U.role
          )
        ) AS parent_data,

        JSON_BUILD_OBJECT(
          'driver_id', D.id,
          'username', DU.username,
          'email', DU.email,
          'contact', DU.contact,
          'role', DU.role
        ) AS driver_data

      FROM bookings B
      JOIN children C ON C.id = B.child_id
      JOIN parents P ON C.parent_id = P.id
      JOIN users U ON U.id = P.user_id
      JOIN vans V ON V.id = B.van_id
      JOIN drivers D ON D.id = V.driver_id
      JOIN users DU ON DU.id = D.user_id

      WHERE V.driver_id = $1 AND C.id = $2
    `,
      [driverId, childId]
    );

    if (!result.rowCount)
      return res.status(404).json({ message: "Student not found" });

    res.json({ student: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

getEarningByYear = async (req, res) => {
  try {
    const q = await pool.query(
      `
    SELECT TO_CHAR(date_trunc('month',payment_date),'YYYY-MM') AS month,
           SUM(amount) total
    FROM cash_payments cp
    JOIN bookings b ON b.id=cp.booking_id
    JOIN vans v ON v.id=b.van_id
    WHERE v.driver_id=$1 AND payment_date>=CURRENT_DATE-INTERVAL '12 months'
    GROUP BY 1 ORDER BY 1
  `,
      [req.user.id]
    );
    res.json({ earnings: q.rows });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

viewPaymentHistory = async (req, res) => {
  try {
    const q = await pool.query(
      `
    SELECT cp.amount,cp.payment_date,c.full_name AS child
    FROM cash_payments cp
    JOIN bookings b ON b.id=cp.booking_id
    JOIN children c ON c.id=b.child_id
    JOIN vans v ON v.id=b.van_id
    WHERE v.driver_id=$1
    ORDER BY cp.payment_date DESC
  `,
      [req.user.id]
    );
    res.json({ payments: q.rows });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

const leaveAndAssignNewDriver = async (req, res) => {
  const oldDriverId = req.user.id;
  const { newDriverId, reason } = req.body;

  try {
    await pool.query("BEGIN");

    const verify = await pool.query(
      `
      SELECT 1 FROM driver_documents 
      WHERE driver_id=$1 AND is_verified=true
    `,
      [newDriverId]
    );

    if (!verify.rowCount) throw "New driver not verified";

    const vans = await pool.query(
      `
      UPDATE vans 
      SET driver_id=$1 
      WHERE driver_id=$2 
      RETURNING id
    `,
      [newDriverId, oldDriverId]
    );

    if (!vans.rowCount) throw "No vans assigned";

    for (const v of vans.rows) {
      await pool.query(
        `
        INSERT INTO driver_assign(old_driver,new_driver,van_id,reason)
        VALUES($1,$2,$3,$4)
      `,
        [oldDriverId, newDriverId, v.id, reason]
      );
    }

    await pool.query("COMMIT");

    res.json({ message: "Driver reassigned", vans: vans.rowCount });
  } catch (err) {
    await pool.query("ROLLBACK");
    res.status(400).json({ message: err.toString() });
  }
};

const restoreDriver = async (req, res) => {
  const { oldDriverId } = req.body;

  try {
    await pool.query("BEGIN");

    const logs = await pool.query(
      `
      SELECT * FROM driver_assign 
      WHERE old_driver=$1
    `,
      [oldDriverId]
    );

    if (!logs.rowCount) throw "Nothing to restore";

    for (const row of logs.rows) {
      await pool.query(
        `
        UPDATE vans SET driver_id=$1 WHERE id=$2
      `,
        [oldDriverId, row.van_id]
      );
    }

    await pool.query("COMMIT");

    res.json({ message: "Driver restored", vans: logs.rowCount });
  } catch (err) {
    await pool.query("ROLLBACK");
    res.status(400).json({ message: err.toString() });
  }
};

getFeedback = async (req, res) => {
  try {
    const { parent_id, child_id, rating, comments } = req.body;
    await pool.query(
      `
    INSERT INTO parent_ratings(parent_id,driver_id,child_id,rating,comments)
    VALUES($1,$2,$3,$4,$5)
    ON CONFLICT (driver_id,child_id,parent_id)
    DO UPDATE SET rating=$4,comments=$5
  `,
      [parent_id, req.user.id, child_id, rating, comments]
    );
    res.json({ message: "Rating saved" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

const getFeedbackHistory = async (req, res) => {
  try {
    const driver_id = req.user.id;

    const feedbacks = await pool.query(
      `
      SELECT 
        r.rating,
        r.comments,
        r.created_at,
        u.full_name AS parent_name,
        c.full_name AS child_name
      FROM parent_ratings r
      JOIN users u ON u.id = r.parent_id
      JOIN children c ON c.id = r.child_id
      WHERE r.driver_id = $1
      ORDER BY r.created_at DESC
    `,
      [driver_id]
    );

    return res.status(200).json({ feedbacks: feedbacks.rows });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

doComplaints = async (req, res) => {
  try {
    const { parent_id, description } = req.body;
    await pool.query(
      `
    INSERT INTO complaints(parent_id,driver_id,description,status)
    VALUES($1,$2,$3,'OPEN')
  `,
      [parent_id, req.user.id, description]
    );
    res.json({ message: "Complaint filed" });
  } catch (error) {
    console.error("PG ERROR:", error);
    console.error("DETAIL:", error.detail);
    console.error("CONSTRAINT:", error.constraint);

    return res.status(500).json({
      message: "Server Error",
      error: error.detail,
      constraint: error.constraint,
    });
  }
};

getComplaintsHistory = async (req, res) => {
  try {
    const driver_id = req.user.id;
    const complaints = await pool.query(
      "SELECT * FROM COMPLAINTS WHERE driver_id=$1 ORDER BY created_at DESC",
      [driver_id]
    );
    return res.status(200).json({ complaints: complaints.rows });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

module.exports = {
  createNewRoute,
  getDriverRoutes,
  updateRouteLocation,
  deleteRoute,
  viewAssignedStudents,
  viewStudentDetails,
  getEarningByYear,
  viewPaymentHistory,
  leaveAndAssignNewDriver,
  restoreDriver,
  getFeedback,
  getFeedbackHistory,
  doComplaints,
  getComplaintsHistory,
};

// getEarningByMonth = async (req, res) => {
//   try {
//     const driverId = req.user.id;
//     const { month, year } = req.query;
//     let filters = [`V.driver_id = $1`];
//     let values = [driverId];
//     let paramIndex = 2;

//     if (month) {
//       filters.push(`EXTRACT(MONTH FROM P.payment_date) = $${paramIndex}`);
//       values.push(month);
//       paramIndex++;
//     }

//     if (year) {
//       filters.push(`EXTRACT(YEAR FROM P.payment_date) = $${paramIndex}`);
//       values.push(year);
//       paramIndex++;
//     }

//     const query = `
//       SELECT COALESCE(SUM(P.amount), 0) AS total_earnings
//       FROM PAYMENTS P
//       JOIN BOOKINGS B ON P.booking_id = B.id
//       JOIN VANS V ON B.van_id = V.id
//       WHERE ${filters.join(" AND ")}
//     `;

//     const result = await pool.query(query, values);

//     return res
//       .status(200)
//       .json({ total_earnings: result.rows[0].total_earnings });
//   } catch (error) {
//     return res
//       .status(500)
//       .json({ message: "Server Error", error: error.message });
//   }
// };

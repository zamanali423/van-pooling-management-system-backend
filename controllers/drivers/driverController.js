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
      SELECT 
        R.id,
        R.name,
        R.is_active,

        -- School Info
        JSONB_BUILD_OBJECT(
          'id', S.id,
          'address', S.school_name,
          'start_time', S.start_time,
          'end_time', S.end_time
        ) AS school,

        -- Stops Count
        (
          SELECT COUNT(*) 
          FROM route_stops RS 
          WHERE RS.route_id = R.id
        ) AS total_stops,

        -- Students Count (active bookings in this van)
        (
          SELECT COUNT(*) 
          FROM bookings B
          WHERE B.van_id = R.van_id
          AND B.status = 'ACTIVE'
        ) AS total_students,

        -- Ordered Stops
        (
          SELECT JSONB_AGG(
            JSONB_BUILD_OBJECT(
              'sequence_no', RS.sequence_no,
              'latitude', RS.latitude,
              'longitude', RS.longitude
            )
            ORDER BY RS.sequence_no
          )
          FROM route_stops RS
          WHERE RS.route_id = R.id
        ) AS stops

      FROM routes R
      JOIN vans V ON V.id = R.van_id
      JOIN schools S ON S.id = R.school_id

      WHERE V.driver_id = $1
      `,
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
      b.id AS booking_id,
      s.id AS school_id,
      s.school_name AS school_address,
      s.start_time - INTERVAL '40 minutes' AS pickup_time,
      s.end_time AS drop_off_time
    FROM bookings b
    JOIN children c ON c.id=b.child_id
    JOIN schools s ON s.id=c.school_id
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

allStudents = async (req, res) => {
  try {
    const q = await pool.query(
      `
     SELECT 
    TO_JSONB(C) AS child_info,

    JSONB_BUILD_OBJECT(
        'id', S.id,
        'address', S.school_name,
        'pickup_time', SB.start_time - INTERVAL '30 minutes',
        'drop_off_time', SB.end_time
    ) AS school_info,

    JSONB_BUILD_OBJECT(
        'id', R.id,
        'name', R.name
    ) AS route_info,

    JSONB_BUILD_OBJECT(
        'van_id', B.van_id,
        'status', B.status,
        'booked_at', B.booked_at
    ) AS booking_info,

    JSONB_BUILD_OBJECT(
        'id', PU.id,
        'full_name', PU.full_name,
        'email', PU.email,
        'phone', PU.phone,
        'role', PU.role
    ) AS parent_data,

    JSONB_BUILD_OBJECT(
        'id', DU.id,
        'full_name', DU.full_name,
        'email', DU.email,
        'phone', DU.phone,
        'role', DU.role
    ) AS driver_data,

    -- Attendance Info (scalar JSON)
    JSONB_BUILD_OBJECT(
        'total_working_days', COALESCE(aw.total_working_days, 0),
        'present_days', COALESCE(aw.present_days, 0),
        'attendance_percentage', COALESCE(aw.attendance_percentage, 0)
    ) AS attendance_info

FROM bookings B
JOIN children C ON C.id = B.child_id
JOIN vans V ON V.id = B.van_id
JOIN users DU ON DU.id = V.driver_id
JOIN users PU ON PU.id = C.parent_id
JOIN routes R ON R.van_id = V.id
JOIN school_branches SB ON SB.id = C.branch_id
JOIN schools S ON S.id = SB.school_id

-- Attendance subquery per child
LEFT JOIN LATERAL (
    SELECT 
        COUNT(DISTINCT SWD.working_date) AS total_working_days,
        COUNT(DISTINCT DATE(GV.verification_time)) AS present_days,
        ROUND(
            (COUNT(DISTINCT DATE(GV.verification_time)) * 100.0) /
            NULLIF(COUNT(DISTINCT SWD.working_date), 0),
            2
        ) AS attendance_percentage
    FROM school_working_days SWD
    LEFT JOIN guard_verifications GV 
        ON GV.child_id = C.id 
        AND DATE(GV.verification_time) = SWD.working_date
    WHERE SWD.school_id = S.id
      AND SWD.is_working = TRUE
) aw ON TRUE

WHERE V.driver_id = $1
  AND B.status = 'ACTIVE';

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
        -- Child Info
        TO_JSONB(C) AS child_info,

        -- School Info
        JSONB_BUILD_OBJECT(
          'id', S.id,
          'address', S.school_name,
          'pickup_time', SB.start_time - INTERVAL '30 minutes',
          'drop_off_time', SB.end_time
        ) AS school_info,

        -- Route Info
        JSONB_BUILD_OBJECT(
          'id', R.id,
          'name', R.name
        ) AS route_info,

        -- Booking Info
        JSONB_BUILD_OBJECT(
          'van_id', B.van_id,
          'status', B.status,
          'booked_at', B.booked_at
        ) AS booking_info,

        -- Parent Info
        JSONB_BUILD_OBJECT(
          'id', PU.id,
          'full_name', PU.full_name,
          'email', PU.email,
          'phone', PU.phone,
          'role', PU.role
        ) AS parent_data,

        -- Driver Info
        JSONB_BUILD_OBJECT(
          'id', DU.id,
          'full_name', DU.full_name,
          'email', DU.email,
          'phone', DU.phone,
          'role', DU.role
        ) AS driver_data

      FROM bookings B
      JOIN children C ON C.id = B.child_id
      JOIN vans V ON V.id = B.van_id
      JOIN users DU ON DU.id = V.driver_id
      JOIN users PU ON PU.id = C.parent_id
      JOIN routes R ON R.van_id = V.id
      JOIN school_branches SB ON SB.id = C.branch_id
      JOIN schools S ON S.id = SB.school_id

      WHERE DU.driver_id = $1 AND C.id = $2
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
    SELECT 
    TO_CHAR(date_trunc('month', cp.payment_date), 'YYYY-MM') AS month,

    SUM(cp.amount) AS total,

    COUNT(DISTINCT r.id) AS route_count,

    COUNT(DISTINCT b.child_id) AS child_count,
    (SELECT COUNT(DISTINCT b.child_id) FROM bookings b WHERE b.status = 'ACTIVE') AS active_child_count

FROM cash_payments cp
JOIN bookings b ON b.id = cp.booking_id
JOIN vans v ON v.id = b.van_id
LEFT JOIN routes r ON r.van_id = v.id

WHERE v.driver_id = $1
  AND cp.payment_date >= CURRENT_DATE - INTERVAL '12 months'

GROUP BY date_trunc('month', cp.payment_date)

ORDER BY month;

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

delayReports = async (req, res) => {
  try {
    const driver_id = req.user.id;
    const reports = await pool.query(
      `SELECT DR.*,R.name AS route_name FROM DELAY_REPORTS DR JOIN ROUTES R ON R.id=DR.route_id
       WHERE DR.driver_id=$1 ORDER BY DR.reported_at DESC`,
      [driver_id]
    );
    return res.status(200).json({ reports: reports.rows });
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
  allStudents,
  delayReports,
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

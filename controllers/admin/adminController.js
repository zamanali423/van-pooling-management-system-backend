const { pool } = require("../../utils/dbConnection");

const pendingVerificationDriversRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    if (page < 1 || offset < 0) {
      return res.status(400).json({ message: "Invalid page or offset values" });
    }

    const query = `
      SELECT 
        U.id AS user_id,
        U.full_name,
        U.email,
        U.phone,
        D.id AS document_id,
        D.driver_license,
        D.vehicle_docs,
        D.vehicle_photo,
        D.number_plate,
        D.is_verified
      FROM users U
      INNER JOIN driver_documents D ON U.id = D.driver_id
      WHERE U.role='DRIVER' AND D.is_verified = FALSE
      ORDER BY D.id DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "No pending driver verification requests found" });
    }

    return res.status(200).json({
      message: "Pending verification drivers fetched successfully",
      page: Number(page),
      limit: Number(limit),
      total: result.rowCount,
      data: result.rows,
    });
  } catch (error) {
    console.error("Pending Driver Verification Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateDriverVerification = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { is_verified } = req.body;

    const docCheck = await pool.query(
      "SELECT is_verified FROM driver_documents WHERE id = $1",
      [documentId]
    );

    if (!docCheck.rows[0]) {
      return res.status(404).json({ message: "Driver document not found" });
    }

    if (docCheck.rows[0].is_verified) {
      return res.status(400).json({ message: "Driver already verified" });
    }

    const updateQuery = `
      UPDATE driver_documents
      SET is_verified = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [is_verified, documentId]);

    return res.status(200).json({
      message: "Driver verification status updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const allComplaints = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT C.*,
             U.full_name AS parent_name,
             D.full_name AS driver_name,
             S.name AS school_name
      FROM complaints C
      LEFT JOIN users U ON U.id = C.parent_id
      LEFT JOIN users D ON D.id = C.driver_id
      LEFT JOIN schools S ON S.id = C.school_id
      ORDER BY C.id DESC
    `);

    return res.status(200).json({
      message: "Complaints fetched successfully",
      data: result.rows,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};


complaintDetails = async (req, res) => {
  try {
    const id = req.params.complaintId;
    const result = await pool.query("SELECT * FROM complaints WHERE id = $1", [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Complaint not found" });
    }
    return res.status(200).json({
      message: "Complaint details fetched successfully",
      data: result.rows[0],
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

isComplaintSolved = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_solved } = req.body;
    const updateQuery =
      "UPDATE complaints SET is_solved = $1 WHERE id = $2 RETURNING id, is_solved";
    const result = await pool.query(updateQuery, [is_solved, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Complaint not found" });
    }
    return res.status(200).json({
      message: "Complaint status updated successfully",
      complaint: result.rows[0],
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

const allUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        U.id,
        U.full_name,
        U.email,
        U.phone,
        U.role,
        U.is_verified,
        COUNT(C.id) AS total_children
      FROM users U
      LEFT JOIN children C ON C.parent_id = U.id
      WHERE U.role != 'ADMIN'
      GROUP BY U.id
      ORDER BY U.id DESC
    `);

    return res.status(200).json({
      message: "Users fetched successfully",
      data: result.rows,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};


const viewUserDetails = async (req, res) => {
  try {
    const userId = req.params.userId;

    const result = await pool.query(
      `
      SELECT 
        U.id,
        U.full_name,
        U.email,
        U.phone,
        U.role,
        U.is_verified,

        -- For parents: total children
        CASE 
          WHEN U.role = 'PARENT' THEN (
            SELECT COUNT(*) 
            FROM children C 
            WHERE C.parent_id = U.id
          )
          ELSE NULL
        END AS total_children,

        -- For drivers: driver documents
        CASE
          WHEN U.role = 'DRIVER' THEN (
            SELECT json_agg(json_build_object(
              'document_id', D.id,
              'driver_license', D.driver_license,
              'vehicle_docs', D.vehicle_docs,
              'vehicle_photo', D.vehicle_photo,
              'number_plate', D.number_plate,
              'is_verified', D.is_verified
            ))
            FROM driver_documents D
            WHERE D.driver_id = U.id
          )
          ELSE NULL
        END AS driver_documents

      FROM users U
      WHERE U.id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User details fetched successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};


blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_blocked } = req.body;
    const result = await pool.query(
      "UPDATE users SET is_blocked = $1 WHERE id = $2 RETURNING id, is_blocked",
      [is_blocked, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({
      message: "User blocked successfully",
      data: result.rows[0],
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({
      message: "User deleted successfully",
      data: result.rows[0],
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

const allDrivers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        U.id AS driver_id,
        U.full_name,
        U.email,
        U.phone,
        U.is_verified,
        COALESCE(D.docs, '[]') AS driver_documents
      FROM users U
      LEFT JOIN (
        SELECT 
          driver_id,
          json_agg(json_build_object(
            'document_id', id,
            'driver_license', driver_license,
            'vehicle_docs', vehicle_docs,
            'vehicle_photo', vehicle_photo,
            'number_plate', number_plate,
            'is_verified', is_verified
          )) AS docs
        FROM driver_documents
        GROUP BY driver_id
      ) D ON U.id = D.driver_id
      WHERE U.role = 'DRIVER'
      ORDER BY U.id DESC
    `);

    return res.status(200).json({
      message: "Drivers fetched successfully",
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};


const showDriverDetails = async (req, res) => {
  try {
    const driverId = req.params.driverId;

    const result = await pool.query(`
      SELECT 
        U.id AS driver_id,
        U.full_name,
        U.email,
        U.phone,
        U.is_verified,
        COALESCE(V.vans, '[]') AS vans,
        COALESCE(D.docs, '[]') AS driver_documents
      FROM users U
      LEFT JOIN (
        SELECT driver_id, json_agg(json_build_object(
          'van_id', id,
          'number_plate', number_plate,
          'capacity', capacity,
          'fare', fare,
          'is_girls_only', is_girls_only,
          'is_active', is_active
        )) AS vans
        FROM vans
        GROUP BY driver_id
      ) V ON U.id = V.driver_id
      LEFT JOIN (
        SELECT driver_id, json_agg(json_build_object(
          'document_id', id,
          'driver_license', driver_license,
          'vehicle_docs', vehicle_docs,
          'vehicle_photo', vehicle_photo,
          'number_plate', number_plate,
          'is_verified', is_verified
        )) AS docs
        FROM driver_documents
        GROUP BY driver_id
      ) D ON U.id = D.driver_id
      WHERE U.id = $1 AND U.role = 'DRIVER';
    `, [driverId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }

    return res.status(200).json({
      message: "Driver details fetched successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};


const updateStatusDriver = async (req, res) => {
  try {
    const driverId = req.params.id;
    const { is_verified, availability_status } = req.body;

    const driverCheck = await pool.query(
      "SELECT is_verified FROM users WHERE id = $1 AND role = 'DRIVER'",
      [driverId]
    );

    if (driverCheck.rows.length === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }

    if (driverCheck.rows[0].is_verified && availability_status === "active") {
      return res.status(400).json({ message: "Driver already verified and active" });
    }

    const update = await pool.query(
      "UPDATE users SET is_verified = $1 WHERE id = $2 RETURNING id, is_verified",
      [is_verified, driverId]
    );

    return res.status(200).json({
      message: "Driver verification status updated successfully",
      driver: update.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};


const topRatedDrivers = async (req, res) => {
  try {
    const { minRating = 4, limit, page = 1 } = req.query;
    const offset = (page - 1) * (limit || 0);

    if (minRating < 4 || offset < 0) {
      return res.status(400).json({
        message: "Minimum rating should be at least 4 and offset should be non-negative",
      });
    }

    let values = [minRating];
    let query = `
      SELECT 
        U.id AS driver_id,
        U.full_name,
        U.email,
        U.phone,
        COALESCE(F.avg_rating, 0) AS avg_rating,
        COALESCE(F.feedbacks, '[]') AS feedbacks
      FROM users U
      LEFT JOIN (
        SELECT 
          driver_id,
          AVG(rating) AS avg_rating,
          json_agg(json_build_object('rating', rating, 'feedback', feedback)) AS feedbacks
        FROM feedback
        GROUP BY driver_id
      ) F ON U.id = F.driver_id
      WHERE U.role = 'DRIVER' AND COALESCE(F.avg_rating, 0) >= $1
      ORDER BY avg_rating DESC
    `;

    if (limit) {
      query += ` LIMIT $2 OFFSET $3`;
      values.push(limit, offset);
    }

    const result = await pool.query(query, values);

    return res.status(200).json({
      message: "Top-rated drivers fetched successfully",
      data: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};


const allDriversWithDocuments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        U.id AS driver_id,
        U.full_name,
        U.email,
        U.phone,
        COALESCE(D.docs, '[]') AS documents
      FROM users U
      LEFT JOIN (
        SELECT driver_id, json_agg(json_build_object(
          'document_id', id,
          'driver_license', driver_license,
          'vehicle_docs', vehicle_docs,
          'vehicle_photo', vehicle_photo,
          'number_plate', number_plate,
          'is_verified', is_verified
        )) AS docs
        FROM driver_documents
        GROUP BY driver_id
      ) D ON U.id = D.driver_id
      WHERE U.role = 'DRIVER'
      ORDER BY U.id DESC
    `);

    return res.status(200).json({
      message: "Drivers with documents fetched successfully",
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};


const driversDocumentsDetails = async (req, res) => {
  try {
    const driverId = req.params.driverId;

    const result = await pool.query(`
      SELECT *
      FROM driver_documents
      WHERE driver_id = $1
      ORDER BY id DESC
    `, [driverId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Driver documents not found" });
    }

    return res.status(200).json({
      message: "Driver documents fetched successfully",
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const verifyDriversDocuments = async (req, res) => {
  try {
    const { id } = req.params; // document ID
    const { driver_license, id_card, vehicle_registration, vehicle_photo, number_plate } = req.body;

    const doc = await pool.query("SELECT * FROM driver_documents WHERE id = $1", [id]);
    if (doc.rowCount === 0) {
      return res.status(404).json({ message: "Driver documents not found" });
    }

    const updateQuery = `
      UPDATE driver_documents
      SET
        driver_license = COALESCE($1, driver_license),
        id_card = COALESCE($2, id_card),
        vehicle_registration = COALESCE($3, vehicle_registration),
        vehicle_photo = COALESCE($4, vehicle_photo),
        number_plate = COALESCE($5, number_plate),
        is_verified = TRUE
      WHERE id = $6
      RETURNING *
    `;

    const updatedResult = await pool.query(updateQuery, [
      driver_license,
      id_card,
      vehicle_registration,
      vehicle_photo,
      number_plate,
      id,
    ]);

    return res.status(200).json({
      message: "Driver documents verified successfully",
      data: updatedResult.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};


const allRoutesWithDriversAndStops = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        R.*,
        json_build_object(
          'driver', json_build_object(
            'id', U.id,
            'name', U.full_name,
            'phone', U.phone
          ),
          'van', json_build_object(
            'van_id', V.id,
            'number_plate', V.number_plate
          )
        ) AS driver_info,
        json_agg(json_build_object(
          'child_id', C.id,
          'child_name', C.name,
          'pickup_location', C.pickup_location
        )) AS children
      FROM routes R
      INNER JOIN users U ON U.id = R.driver_id AND U.role = 'DRIVER'
      INNER JOIN vans V ON V.id = R.van_id
      INNER JOIN children C ON C.van_id = R.van_id
      GROUP BY R.id, U.id, V.id
      ORDER BY R.id DESC
    `);

    return res.status(200).json({
      message: "Routes fetched successfully",
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};


const routeDetails = async (req, res) => {
  try {
    const routeId = req.params.routeId;

    // Check if route exists
    const checkRoute = await pool.query("SELECT * FROM routes WHERE id = $1", [routeId]);
    if (checkRoute.rowCount === 0) {
      return res.status(404).json({ message: "Route not found" });
    }

    const result = await pool.query(`
      SELECT 
        R.*,
        json_build_object(
          'driver', json_build_object(
            'id', U.id,
            'name', U.full_name,
            'phone', U.phone
          ),
          'van', json_build_object(
            'van_id', V.id,
            'number_plate', V.number_plate
          )
        ) AS driver_info,
        json_agg(json_build_object(
          'child_id', C.id,
          'child_name', C.name,
          'pickup_location', C.pickup_location
        )) AS children
      FROM routes R
      INNER JOIN users U ON U.id = R.driver_id AND U.role = 'DRIVER'
      INNER JOIN vans V ON V.id = R.van_id
      INNER JOIN children C ON C.van_id = R.van_id
      WHERE R.id = $1
      GROUP BY R.id, U.id, V.id
    `, [routeId]);

    return res.status(200).json({
      message: "Route fetched successfully",
      data: result.rows[0],
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};


const deleteRoute = async (req, res) => {
  try {
    const routeId = req.params.routeId;

    const checkRoute = await pool.query("SELECT * FROM routes WHERE id = $1", [routeId]);
    if (checkRoute.rowCount === 0) {
      return res.status(404).json({ message: "Route not found" });
    }

    const result = await pool.query(
      "DELETE FROM routes WHERE id = $1 RETURNING *",
      [routeId]
    );

    return res.status(200).json({
      message: "Route deleted successfully",
      data: result.rows[0],
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};


const addSchools = async (req, res) => {
  try {
    const { name, address, start_time, end_time } = req.body;

    const existing = await pool.query("SELECT id FROM schools WHERE address = $1", [address]);
    if (existing.rowCount > 0) {
      return res.status(400).json({ message: "School already added" });
    }

    const result = await pool.query(
      "INSERT INTO schools (name, address, start_time, end_time) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, address, start_time, end_time]
    );

    return res.status(201).json({
      message: "School added successfully",
      data: result.rows[0],
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

getSchoolData = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM schools where id = $1", [
      id,
    ]);
    if (result.rowCount == 0) {
      return res.status(404).json({ message: "School not found" });
    }
    return res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

updateSchoolData = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, start_time, end_time } = req.body;
    const result = await pool.query(
      "UPDATE schools SET name = $1, address = $2, start_time = $3, end_time = $4 WHERE id = $5 RETURNING *",
      [name, address, start_time, end_time, id]
    );
    if (result.rowCount == 0) {
      return res.status(404).json({ message: "School not found" });
    }
    return res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM schools WHERE id = $1", [id]);
    if (result.rowCount == 0) {
      return res.status(404).json({ message: "School not found" });
    }
    return res.status(200).json({ message: "School deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

module.exports = {
  pendingVerificationDriversRequests,
  updateDriverVerification,
  allComplaints,
  complaintDetails,
  isComplaintSolved,
  allUsers,
  viewUserDetails,
  blockUser,
  deleteUser,
  allDrivers,
  showDriverDetails,
  updateStatusDriver,
  topRatedDrivers,
  allDriversWithDocuments,
  driversDocumentsDetails,
  verifyDriversDocuments,
  allRoutesWithDriversAndStops,
  routeDetails,
  deleteRoute,
  addSchools,
  getSchoolData,
  updateSchoolData,
  deleteSchool,
};

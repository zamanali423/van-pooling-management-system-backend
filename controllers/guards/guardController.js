const { verify } = require("jsonwebtoken");
const { pool } = require("../../utils/dbConnection");
const cron = require("node-cron");

const getActiveVans = async (req, res) => {
  try {
    const guard_id = req.user.id;

    const vans = await pool.query(
      `
      SELECT DISTINCT
        V.*,
        U.username AS driver_name,
        (SELECT COUNT(*) FROM children C WHERE C.van_id = V.id) AS total_children
      FROM guards G
      JOIN routes R ON R.school_id = G.school_id
      JOIN vans V ON V.id = R.van_id
      JOIN drivers D ON D.id = V.driver_id
      JOIN users U ON U.id = D.user_id
      WHERE G.id = $1 AND V.status='active'
    `,
      [guard_id]
    );

    res.status(200).json({ vans: vans.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const studentsToVerify = async (req, res) => {
  try {
    const guard_id = req.user.id;

    const schoolResult = await pool.query(
      "SELECT school_id FROM guards WHERE id=$1",
      [guard_id]
    );
    if (!schoolResult.rows.length)
      return res.status(404).json({ message: "Guard not found" });

    const schoolId = schoolResult.rows[0].school_id;
    if (!schoolId)
      return res
        .status(400)
        .json({ message: "Guard is not assigned to a school" });

    const students = await pool.query(
      `SELECT 
          C.*, 
          V.license_plate, 
          V.status
       FROM children C
       LEFT JOIN vans V ON C.van_id = V.id
       WHERE C.school_id = $1 AND COALESCE(C.is_verified,false) = false
         AND V.status='active'`,
      [schoolId]
    );

    if (!students.rows.length)
      return res.status(404).json({ message: "No children found to verify" });

    res.status(200).json({ students: students.rows });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const verifyToStudent = async (req, res) => {
  try {
    const childId = Number(req.params.studentId);
    const { is_verified } = req.body;
    const guardId = req.user.id;

    const childData = await pool.query(
      `SELECT C.school_id, V.driver_id
       FROM children C
       JOIN vans V ON C.van_id = V.id
       WHERE C.id=$1`,
      [childId]
    );

    if (!childData.rows.length)
      return res.status(400).json({ message: "Invalid child or van" });

    const { school_id, driver_id } = childData.rows[0];

    const isGuardAssigned = await pool.query(
      "SELECT 1 FROM guards WHERE id=$1 AND school_id=$2",
      [guardId, school_id]
    );
    if (!isGuardAssigned.rows.length)
      return res
        .status(400)
        .json({ message: "Guard not assigned to this school" });

    await pool.query(
      `INSERT INTO attendance_record_by_guard(guard_id, child_id, driver_id)
       VALUES ($1,$2,$3) ON CONFLICT (guard_id, child_id) DO NOTHING`,
      [guardId, childId, driver_id]
    );

    const result = await pool.query(
      "UPDATE children SET is_verified=$1 WHERE id=$2 RETURNING *",
      [is_verified, childId]
    );

    res.status(200).json({
      message: "Child verified successfully",
      child: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const verifyToAllStudents = async (req, res) => {
  try {
    const guard_id = req.user.id;

    const schoolResult = await pool.query(
      "SELECT school_id FROM guards WHERE id=$1",
      [guard_id]
    );
    if (!schoolResult.rows.length)
      return res.status(404).json({ message: "Guard not found" });

    const schoolId = schoolResult.rows[0].school_id;

    const childrenResult = await pool.query(
      `SELECT C.id AS child_id, V.driver_id
       FROM children C
       JOIN vans V ON C.van_id = V.id
       WHERE C.school_id=$1 AND COALESCE(C.is_verified,false)=false`,
      [schoolId]
    );
    if (!childrenResult.rows.length)
      return res
        .status(400)
        .json({ message: "All children are already verified" });

    const childIds = childrenResult.rows.map((r) => r.child_id);

    await pool.query(
      "UPDATE children SET is_verified=true WHERE id = ANY($1::int[])",
      [childIds]
    );

    await pool.query(
      `INSERT INTO attendance_record_by_guard(guard_id, child_id, driver_id)
       SELECT $1, C.id, V.driver_id
       FROM children C JOIN vans V ON C.van_id=V.id
       WHERE C.id = ANY($2::int[]) ON CONFLICT (guard_id, child_id) DO NOTHING`,
      [guard_id, childIds]
    );

    res.status(200).json({
      message: "All children verified successfully",
      verifiedCount: childIds.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const guard_id = req.user.id;

    const schoolResult = await pool.query(
      "SELECT school_id FROM guards WHERE id=$1",
      [guard_id]
    );
    if (!schoolResult.rows.length)
      return res.status(404).json({ message: "Guard not found" });

    const schoolId = schoolResult.rows[0].school_id;

    const students = await pool.query(
      `SELECT C.*, V.license_plate, V.status,
              U.username AS parent_name, U.contact AS parent_contact
       FROM children C
       JOIN vans V ON C.van_id=V.id
       JOIN parents P ON C.parent_id=P.id
       JOIN users U ON P.user_id=U.id
       WHERE C.school_id=$1`,
      [schoolId]
    );

    res.status(200).json({ students: students.rows });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const getStudentDetails = async (req, res) => {
  try {
    const childId = req.params.studentId;

    const student = await pool.query(
      `SELECT C.*, V.license_plate, V.status,
              U.username AS parent_name, U.contact AS parent_contact
       FROM children C
       JOIN vans V ON C.van_id=V.id
       JOIN parents P ON C.parent_id=P.id
       JOIN users U ON P.user_id=U.id
       WHERE C.id=$1`,
      [childId]
    );

    if (!student.rows.length)
      return res.status(404).json({ message: "Child not found" });

    res.status(200).json({ student: student.rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

cron.schedule("0 12 * * *", async () => {
  try {
    console.log("Running daily reset for children verification...");
    await pool.query(
      "UPDATE children SET is_verified=false WHERE school_id IS NOT NULL"
    );
    console.log("Verification statuses reset successfully.");
  } catch (error) {
    console.error("Cron Job Error:", error.message);
  }
});

module.exports = {
  getActiveVans,
  studentsToVerify,
  verifyToStudent,
  verifyToAllStudents,
  getAllStudents,
  getStudentDetails,
};

// 0 12 * * *
// │ │  │ │ │
// │ │  │ │ └── every day of the week
// │ │  │ └──── every month
// │ │  └────── every day
// │ └───────── hour = 12 PM
// └─────────── minute = 0

// ┌───────────── minute (0 - 59)
// │ ┌──────────── hour (0 - 23)
// │ │ ┌────────── day of month (1 - 31)
// │ │ │ ┌──────── month (1 - 12)
// │ │ │ │ ┌────── day of week (0 - 6) (0 = Sunday)
// │ │ │ │ │
// * * * * *

// 0 * * * *
// → Run at the start of every hour (e.g., 1:00, 2:00, 3:00...)

// 0 12 * * *
// → Runs at 12:00 PM daily

// 0 9 1 * *
// → Runs on the 1st of every month at 9 AM

// 0 6 * 1 *
// → Runs every day in January at 6 AM

// 0 10 * * 1
// → Runs every Monday at 10 AM

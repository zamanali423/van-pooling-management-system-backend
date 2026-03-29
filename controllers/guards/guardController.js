const { pool } = require("../../utils/dbConnection");
const cron = require("node-cron");

const getActiveVans = async (req, res) => {
  try {
    const guard_id = req.user.id;
    if (!guard_id)
      return res.status(400).json({ message: "guard_id is required" });

    const schoolResult = await pool.query(
      `SELECT branch_id FROM school_guards WHERE guard_id=$1 AND approval_status='APPROVED'`,
      [guard_id]
    );

    if (!schoolResult.rows.length)
      return res
        .status(404)
        .json({ message: "Guard not assigned to any school" });

    const branch_id = schoolResult.rows[0].branch_id;

    const vans = await pool.query(
      `
      SELECT 
        R.name AS route_name,
        SB.start_time,
        SB.end_time,
        COUNT(DISTINCT V.id) AS total_vans,
        COUNT(DISTINCT B.child_id) AS total_students
      FROM routes R
      JOIN vans V ON V.id = R.van_id
      LEFT JOIN bookings B ON B.van_id = V.id AND B.status='COMPLETED'
      JOIN school_branches SB ON SB.id = R.branch_id
      JOIN schools S ON S.id = SB.school_id
      WHERE R.branch_id = $1
        AND V.is_active = true
      GROUP BY R.name, SB.start_time, SB.end_time
      ORDER BY SB.start_time
      `,
      [branch_id]
    );

    const now = new Date();
    const schedule = vans.rows.map((route) => {
      const start = new Date(route.start_time);
      const end = new Date(route.end_time);
      let status = "Upcoming";
      if (now >= end) status = "Completed";
      else if (now >= start && now < end) status = "Ongoing";
      return {
        route_name: route.route_name,
        start_time: route.start_time,
        end_time: route.end_time,
        status,
        total_vans: Number(route.total_vans),
        total_students: Number(route.total_students),
      };
    });

    res.status(200).json({ schedule });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// const getGuardVans = async (req, res) => {
//   try {    const guard_id = req.user.id;
//     if (!guard_id)
//       return res.status(400).json({ message: "guard_id is required" });

//     const schoolResult = await pool.query(
//       `SELECT school_id FROM school_guards WHERE guard_id=$1 AND approval_status='APPROVED'`,
//       [guard_id],
//     );

//     if (!schoolResult.rows.length)
//       return res
//         .status(404)
//         .json({ message: "Guard not assigned to any school" });

//     const schoolId = schoolResult.rows[0].school_id;

// };

const studentsToVerify = async (req, res) => {
  try {
    const guard_id = req.user.id;

    const schoolResult = await pool.query(
      `SELECT school_id 
       FROM school_guards 
       WHERE guard_id = $1 
         AND approval_status = 'APPROVED'`,
      [guard_id]
    );

    if (!schoolResult.rows.length)
      return res
        .status(404)
        .json({ message: "Guard not assigned to any school" });

    const school_id = schoolResult.rows[0].school_id;

    const { verification_type } = req.query;
    if (!verification_type)
      return res.status(400).json({ message: "verification_type is required" });

    const students = await pool.query(
      `
      SELECT 
        C.id,
        C.full_name,
        C.grade,
        V.number_plate,
        U.full_name AS parent_name,
        U.phone AS parent_phone
      FROM children C
      JOIN vans V ON V.id = C.van_id
      JOIN parents P ON P.id = C.parent_id
      JOIN users U ON U.id = P.user_id
      WHERE C.school_id = $1
        AND NOT EXISTS (
          SELECT 1 
          FROM guard_verifications GV
          WHERE GV.child_id = C.id
            AND GV.verification_type = $2
            AND DATE(GV.verification_time) = CURRENT_DATE
        )
      `,
      [school_id, verification_type]
    );

    if (!students.rows.length)
      return res.status(404).json({ message: "No students to verify today" });

    res.status(200).json({ students: students.rows });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const verifyToStudent = async (req, res) => {
  try {
    const guard_id = req.user.id;
    const child_id = Number(req.params.studentId);
    const {
      van_id,
      school_id,
      verification_type,
      latitude,
      longitude,
      remarks,
    } = req.body;

    await pool.query(
      `
      INSERT INTO guard_verifications
      (guard_id, child_id, van_id, school_id, verification_type, latitude, longitude, remarks)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `,
      [
        guard_id,
        child_id,
        van_id,
        school_id,
        verification_type,
        latitude,
        longitude,
        remarks,
      ]
    );

    res.status(200).json({ message: "Verification successful" });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ message: "Already verified today" });
    }
    res.status(500).json({ message: error.message });
  }
};

const verifyToAllStudents = async (req, res) => {
  try {
    const guard_id = req.user.id;
    const { school_id, verification_type } = req.body;

    const students = await pool.query(
      `
      SELECT C.id, B.van_id
      FROM children C
      JOIN bookings B ON B.child_id=C.id AND B.status='COMPLETED'
      WHERE C.school_id=$1
      `,
      [school_id]
    );

    for (const student of students.rows) {
      await pool.query(
        `
        INSERT INTO guard_verifications
        (guard_id, child_id, van_id, school_id, verification_type)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT DO NOTHING
        `,
        [guard_id, student.id, student.van_id, school_id, verification_type]
      );
    }

    res.status(200).json({ message: "All students verified" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const guard_id = req.user.id;

    const schoolResult = await pool.query(
      `SELECT school_id 
       FROM school_guards 
       WHERE guard_id = $1 
         AND approval_status = 'APPROVED'`,
      [guard_id]
    );

    if (!schoolResult.rows.length)
      return res
        .status(404)
        .json({ message: "Guard not assigned to any school" });

    const school_id = schoolResult.rows[0].school_id;

    const students = await pool.query(
      `
      SELECT 
        C.id,
        C.full_name,
        C.grade,
        V.number_plate,
        U.full_name AS parent_name,
        U.phone AS parent_phone
      FROM children C
      LEFT JOIN bookings B ON B.child_id = C.id AND B.status='COMPLETED'
      LEFT JOIN vans V ON V.id = B.van_id
      LEFT JOIN users U ON U.id = C.parent_id
      WHERE C.school_id = $1
      `,
      [school_id]
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
      `
      SELECT 
        C.*,
        V.number_plate,
        U.full_name AS parent_name,
        U.phone AS parent_phone
      FROM children C
      LEFT JOIN bookings B ON B.child_id=C.id AND B.status='COMPLETED'
      LEFT JOIN vans V ON V.id=B.van_id
      LEFT JOIN users U ON U.id=C.parent_id
      WHERE C.id=$1
      `,
      [childId]
    );

    if (!student.rows.length)
      return res.status(404).json({ message: "Child not found" });

    res.status(200).json({ student: student.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const recentVerifiedStudents = async (req, res) => {
  try {
    const guard_id = req.user.id;
    const schoolResult = await pool.query(
      `SELECT branch_id 
       FROM school_guards 
       WHERE guard_id = $1 
         AND approval_status = 'APPROVED'`,
      [guard_id]
    );

    if (!schoolResult.rows.length)
      return res
        .status(404)
        .json({ message: "Guard not assigned to any school" });

    const branch_id = schoolResult.rows[0].branch_id;

    const students = await pool.query(
      `
      SELECT 
        C.id,
        C.full_name,
        GV.verification_time,
        GV.verification_type,
        V.number_plate,
        U.full_name AS driver_name
      FROM guard_verifications GV
      JOIN children C ON C.id = GV.child_id
      LEFT JOIN bookings B ON B.child_id = C.id AND B.status='COMPLETED'
      LEFT JOIN vans V ON V.id = B.van_id
      LEFT JOIN users U ON U.id = V.driver_id
      WHERE C.branch_id = $1
      `,
      [branch_id]
    );

    res.status(200).json({ students: students.rows });
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
  recentVerifiedStudents,
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

// const getActiveVans = async (req, res) => {
//   try {
//     const guard_id = req.user.id;
//     if (!guard_id)
//       return res.status(400).json({ message: "guard_id is required" });

//     // Get the school assigned to this guard
//     const schoolResult = await pool.query(
//       `SELECT school_id FROM school_guards WHERE guard_id=$1 AND approval_status='APPROVED'`,
//       [guard_id]
//     );

//     if (!schoolResult.rows.length)
//       return res.status(404).json({ message: "Guard not assigned to any school" });

//     const schoolId = schoolResult.rows[0].school_id;

//     // Get active vans and booking stats for the school's routes
//     const vans = await pool.query(
//       `
//       SELECT
//         R.name AS route_name,
//         S.start_time,
//         S.end_time,
//         COUNT(DISTINCT V.id) AS total_vans,
//         COUNT(DISTINCT B.child_id) AS total_students
//       FROM routes R
//       JOIN vans V ON V.id = R.van_id
//       LEFT JOIN bookings B ON B.van_id = V.id AND B.status='ACTIVE'
//       JOIN schools S ON S.id = R.school_id
//       WHERE R.school_id = $1
//         AND V.is_active = true
//       GROUP BY R.name, S.start_time, S.end_time
//       ORDER BY S.start_time
//       `,
//       [schoolId]
//     );

//     // Helper to format time in AM/PM
//     const formatTime = dateStr => {
//       const date = new Date(dateStr);
//       let hours = date.getHours();
//       const minutes = date.getMinutes().toString().padStart(2, '0');
//       const ampm = hours >= 12 ? 'PM' : 'AM';
//       hours = hours % 12;
//       hours = hours ? hours : 12; // handle 0 -> 12
//       return `${hours}:${minutes} ${ampm}`;
//     };

//     const now = new Date();
//     const schedule = vans.rows.map(route => {
//       const start = new Date(route.start_time);
//       const end = new Date(route.end_time);
//       let status = "Upcoming";
//       if (now >= end) status = "Completed";
//       else if (now >= start && now < end) status = "Ongoing";

//       return {
//         route_name: route.route_name,
//         time_range: `${formatTime(route.start_time)} - ${formatTime(route.end_time)}`,
//         status,
//         total_vans: Number(route.total_vans),
//         total_students: Number(route.total_students)
//       };
//     });

//     res.status(200).json({ schedule });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// };

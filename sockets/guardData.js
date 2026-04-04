const { pool } = require("../utils/dbConnection");
const jwt = require("jsonwebtoken");

const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const toRad = (val) => (val * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// 📍 SCHOOL LOCATION
const getLatLongBySchool = async (guardId) => {
  const result = await pool.query(
    `SELECT sb.latitude, sb.longitude, sb.branch_name FROM school_branches sb 
    JOIN schools s ON s.id = sb.school_id
    LEFT JOIN school_guards sg ON sg.branch_id = sb.id
    WHERE sg.guard_id = $1`,
    [guardId]
  );
  return {
    lat: result.rows[0].latitude,
    lng: result.rows[0].longitude,
    branch_name: result.rows[0].branch_name,
  };
};

const guardData = (io) => {
  // ✅ AUTH MIDDLEWARE (FIXED POSITION)
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Unauthorized: No token"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.user = decoded; // { id, role }

      next();
    } catch (err) {
      return next(new Error("Unauthorized: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Guard connected:", socket.id);

    // 🔥 GET ALL VAN STATUS
    socket.on("get-vans-status", async () => {
      try {
        const result = await pool.query(
          `
          SELECT 
  v.id AS van_id,
  v.number_plate,
  v.capacity,

  u.full_name AS driver_name,
  u.phone,

  vt.latitude,
  vt.longitude,
  vt.recorded_at,

  COUNT(DISTINCT c.id) AS total_students

FROM vans v
JOIN users u ON u.id = v.driver_id

-- ✅ ONLY LATEST LOCATION
LEFT JOIN LATERAL (
  SELECT latitude, longitude, recorded_at
  FROM van_tracking
  WHERE van_id = v.id
  ORDER BY recorded_at DESC
  LIMIT 1
) vt ON true

LEFT JOIN bookings b ON b.van_id = v.id
LEFT JOIN children c ON c.id = b.child_id
LEFT JOIN school_guards sg ON sg.branch_id = c.branch_id

WHERE sg.guard_id = $1

GROUP BY 
  v.id,
  v.number_plate,
  v.capacity,
  u.full_name,
  u.phone,
  vt.latitude,
  vt.longitude,
  vt.recorded_at

ORDER BY vt.recorded_at DESC;
        `,
          [socket.user.id]
        );

        const SCHOOL = await getLatLongBySchool(socket.user.id);

        const vans = result.rows.map((van) => {
          let status = "on-route";
          let distance = null;

          if (van.latitude && van.longitude) {
            distance = getDistanceInMeters(
              van.latitude,
              van.longitude,
              SCHOOL.lat,
              SCHOOL.lng
            );

            if (distance < 50) {
              status = "arrived";
            } else if (distance < 500) {
              status = "approaching";
            }
          }

          return {
            vanId: van.van_id,
            vanNumber: van.number_plate,
            driver: van.driver_name,
            phone: van.phone,
            students: `${van.total_students}/${van.capacity}`,
            lat: van.latitude,
            lng: van.longitude,
            lastUpdate: van.recorded_at,
            status,
            distance,
            branch_name: SCHOOL.branch_name,
            schoolLat: SCHOOL.lat,
            schoolLng: SCHOOL.lng,
          };
        });

        socket.emit("vans-status", vans);
      } catch (err) {
        console.error(err);
        socket.emit("error", "Failed to fetch vans");
      }
    });

    // 🔥 AUTO REFRESH EVERY 10s (REALTIME DASHBOARD)
    const interval = setInterval(async () => {
      try {
        const result = await pool.query(
          `
          SELECT 
  v.id AS van_id,
  v.number_plate,
  v.capacity,

  u.full_name AS driver_name,
  u.phone,

  vt.latitude,
  vt.longitude,
  vt.recorded_at,

  COUNT(DISTINCT c.id) AS total_students

FROM vans v
JOIN users u ON u.id = v.driver_id

-- ✅ ONLY LATEST LOCATION
LEFT JOIN LATERAL (
  SELECT latitude, longitude, recorded_at
  FROM van_tracking
  WHERE van_id = v.id
  ORDER BY recorded_at DESC
  LIMIT 1
) vt ON true

LEFT JOIN bookings b ON b.van_id = v.id
LEFT JOIN children c ON c.id = b.child_id
LEFT JOIN school_guards sg ON sg.branch_id = c.branch_id

WHERE sg.guard_id = $1

GROUP BY 
  v.id,
  v.number_plate,
  v.capacity,
  u.full_name,
  u.phone,
  vt.latitude,
  vt.longitude,
  vt.recorded_at

ORDER BY vt.recorded_at DESC;
        `,
          [socket.user.id]
        );

        const SCHOOL = await getLatLongBySchool(socket.user.id);

        const vans = result.rows.map((van) => {
          let status = "on-route";

          if (van.latitude && van.longitude) {
            const distance = getDistanceInMeters(
              van.latitude,
              van.longitude,
              SCHOOL.lat,
              SCHOOL.lng
            );

            if (distance < 50) status = "arrived";
            else if (distance < 500) status = "approaching";
          }

          return {
            vanId: van.van_id,
            vanNumber: van.number_plate,
            driver: van.driver_name,
            phone: van.phone,
            students: `${van.total_students}/${van.capacity}`,
            lat: van.latitude,
            lng: van.longitude,
            lastUpdate: van.recorded_at,
            status,
            distance,
            branch_name: SCHOOL.branch_name,
            schoolLat: SCHOOL.lat,
            schoolLng: SCHOOL.lng,
          };
        });

        socket.emit("vans-status", vans);
      } catch (err) {
        console.error(err);
      }
    }, 10000);

    socket.on("disconnect", () => {
      clearInterval(interval);
      console.log("Guard disconnected:", socket.id);
    });
  });
};

module.exports = guardData;

// LEFT JOIN LATERAL (
//   SELECT latitude, longitude, recorded_at
//   FROM van_tracking
//   WHERE van_id = v.id
//   ORDER BY recorded_at DESC
//   LIMIT 2
// ) vt ON true

// 👉 This runs for each van row individually

// BEST VERSION (NO GROUP BY MESS)
// WHY THIS IS BETTER

// ✔ No duplicate rows
// ✔ No heavy GROUP BY
// ✔ Faster for large data
// ✔ Easier to maintain

// SELECT
//   v.id AS van_id,
//   v.number_plate,
//   v.capacity,

//   u.full_name AS driver_name,
//   u.phone,

//   vt.latitude,
//   vt.longitude,
//   vt.recorded_at,

//   COALESCE(cs.total_students, 0) AS total_students

// FROM vans v
// JOIN users u ON u.id = v.driver_id

// -- ✅ latest location
// LEFT JOIN LATERAL (
//   SELECT latitude, longitude, recorded_at
//   FROM van_tracking
//   WHERE van_id = v.id
//   ORDER BY recorded_at DESC
//   LIMIT 1
// ) vt ON true

// -- ✅ student count (separate query)
// LEFT JOIN (
//   SELECT b.van_id, COUNT(DISTINCT c.id) AS total_students
//   FROM bookings b
//   JOIN children c ON c.id = b.child_id
//   GROUP BY b.van_id
// ) cs ON cs.van_id = v.id

// -- ✅ guard filter
// WHERE EXISTS (
//   SELECT 1
//   FROM bookings b
//   JOIN children c ON c.id = b.child_id
//   JOIN school_guards sg ON sg.branch_id = c.branch_id
//   WHERE b.van_id = v.id
//   AND sg.guard_id = $1
// )

// ORDER BY vt.recorded_at DESC;

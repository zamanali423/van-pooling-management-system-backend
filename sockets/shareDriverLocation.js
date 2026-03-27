const { pool } = require("../utils/dbConnection");
const jwt = require("jsonwebtoken");

// ✅ Distance function
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

const shareDriverLocation = (io) => {
  const socketDriverMap = {};
  const TIME_THRESHOLD = 15000;
  const DISTANCE_THRESHOLD = 20;

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
    console.log("User connected:", socket.id);

    // =========================
    // DRIVER JOIN
    // =========================
    socket.on("join-driver", async () => {
      try {
        if (!socket.user || socket.user.role !== "DRIVER") {
          return socket.emit("error", "Access denied");
        }

        const driverId = socket.user.id;

        socketDriverMap[socket.id] = driverId;

        const result = await pool.query(
          "SELECT id FROM vans WHERE driver_id = $1",
          [driverId],
        );

        if (result.rows.length === 0) return;

        const vanId = result.rows[0].id;
        console.log("driver van id",vanId)

        socket.join(`van-${vanId}`);
      } catch (err) {
        console.error("join-driver error:", err.message);
      }
    });

    // =========================
    // PARENT JOIN
    // =========================
    socket.on("join-parent", async (vanId) => {
      try {
        console.log("socket",socket)
        if (!socket.user || socket.user.role !== "PARENT") {
          return socket.emit("error", "Access denied");
        }

        // ⚠️ TODO: restrict parent to only their child's van
           console.log("parent van id",vanId)

        socket.join(`van-${vanId}`);

        const result = await pool.query(
          `SELECT latitude, longitude 
           FROM van_tracking 
           WHERE van_id = $1 
           ORDER BY recorded_at DESC 
           LIMIT 1`,
          [vanId],
        );

        if (result.rows.length > 0) {
          socket.emit("receive-location", result.rows[0]);
        }
      } catch (err) {
        console.error("join-parent error:", err.message);
      }
    });

    // =========================
    // DRIVER SEND LOCATION
    // =========================
    socket.on("send-location", async ({ lat, lng }) => {
      try {
        if (!socket.user || socket.user.role !== "DRIVER") return;

        const driverId = socket.user.id;

        const vanRes = await pool.query(
          "SELECT id FROM vans WHERE driver_id = $1",
          [driverId],
        );

        if (vanRes.rows.length === 0) return;

        const vanId = vanRes.rows[0].id;
           console.log("2 driver van id",vanId)

        // ✅ get last location
        const lastRes = await pool.query(
          `SELECT latitude, longitude, recorded_at 
           FROM van_tracking 
           WHERE van_id = $1 
           ORDER BY recorded_at DESC 
           LIMIT 1`,
          [vanId],
        );

        let shouldSave = true;

        if (lastRes.rows.length > 0) {
          const last = lastRes.rows[0];

          const distance = getDistanceInMeters(
            last.latitude,
            last.longitude,
            lat,
            lng,
          );

          const timeDiff = Date.now() - new Date(last.recorded_at).getTime();

          if (distance < DISTANCE_THRESHOLD && timeDiff < TIME_THRESHOLD) {
            shouldSave = false;
          }
        }

        if (!shouldSave) return;

        // ✅ Save history
        await pool.query(
          `INSERT INTO van_tracking (van_id, latitude, longitude, recorded_at)
           VALUES ($1, $2, $3, NOW())`,
          [vanId, lat, lng],
        );

        // ✅ Emit live
        io.to(`van-${vanId}`).emit("receive-location", {
          lat,
          lng,
        });
      } catch (err) {
        console.error("send-location error:", err.message);
      }
    });

    // =========================
    // DISCONNECT
    // =========================
    socket.on("disconnect", () => {
      delete socketDriverMap[socket.id];
      console.log("Disconnected:", socket.id);
    });
  });
};

module.exports = shareDriverLocation;

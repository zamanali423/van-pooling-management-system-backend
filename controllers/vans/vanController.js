const { pool } = require("../../utils/dbConnection");

getVans = async (req, res) => {
  try {
    const vans = await pool.query(`
      SELECT 
    v.id::int,
    v.driver_id::int,
    v.number_plate,
    v.capacity::int,
    v.fare::float,
    v.is_girls_only,
    v.photo_url,
    v.is_active,

    u.full_name AS driver_name,
    u.profile_photo AS driver_profile_photo,

    COALESCE(AVG(dr.rating), 0)::float AS average_rating,
    COUNT(DISTINCT dr.id)::int AS total_reviews,
    (v.capacity-COUNT(DISTINCT b.id))::float AS available_seats

  FROM vans v
  LEFT JOIN users u ON u.id = v.driver_id
  LEFT JOIN driver_ratings dr ON dr.driver_id = v.driver_id
  LEFT JOIN bookings b ON b.van_id = v.id
  WHERE v.is_active = true
  GROUP BY v.id, u.full_name, u.profile_photo
    `);

    res.json({ vans: vans.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

bookVan = async (req, res) => {
  const vanId = req.params.id;
  let { childId } = req.body;
  const parentId = req.user.id;

  console.log("Booking van:", vanId, "for child:", childId)

  try {
    await pool.query("BEGIN");

    const vanRes = await pool.query(
      "SELECT * FROM vans WHERE id=$1 AND is_active=true",
      [vanId]
    );
    if (!vanRes.rows.length) throw "Van not found or inactive";
    const van = vanRes.rows[0];

    if (!Array.isArray(childId)) childId = [childId];

    const bookings = [];

    for (let id of childId) {
      const childRes = await pool.query(
        "SELECT * FROM children WHERE id=$1 AND parent_id=$2",
        [id, parentId]
      );
      if (!childRes.rows.length) throw `Child with ID ${id} not found`;

      const child = childRes.rows[0];

      if (van.is_girls_only && !child.requires_girls_only)
        throw `Child ${child.full_name} cannot be booked on a girls-only van`;

      const usedRes = await pool.query(
        "SELECT COUNT(*) FROM bookings WHERE van_id=$1 AND status='ACTIVE'",
        [vanId]
      );
      if (parseInt(usedRes.rows[0].count) >= van.capacity)
        throw "Van is full";

      const existsRes = await pool.query(
        "SELECT 1 FROM bookings WHERE child_id=$1 AND status='ACTIVE'",
        [id]
      );
      if (existsRes.rows.length) throw `Child ${child.full_name} already has an active booking`;

      const bookingRes = await pool.query(
        "INSERT INTO bookings (child_id, van_id, status) VALUES ($1,$2,'ACTIVE') RETURNING *",
        [id, vanId]
      );

      await pool.query(
        "INSERT INTO cash_payments (booking_id, parent_id, amount) VALUES ($1,$2,$3)",
        [bookingRes.rows[0].id, parentId, van.fare]
      );

      bookings.push(bookingRes.rows[0]);
    }

    await pool.query("COMMIT");

    res.status(201).json({ message: "Booked successfully", bookings });
  } catch (err) {
    await pool.query("ROLLBACK");
    res.status(400).json({ error: err.toString() });
  }
};


getVanDetails = async (req, res) => {
  const { vanId } = req.params;

  const van = await pool.query(
    `
    SELECT 
      v.*,
      u.full_name AS driver_name,
      (SELECT COUNT(*) FROM bookings WHERE van_id=v.id AND status='ACTIVE') AS booked_seats
    FROM vans v
    LEFT JOIN users u ON u.id=v.driver_id
    WHERE v.id=$1
  `,
    [vanId]
  );

  if (!van.rows.length)
    return res.status(404).json({ message: "Van not found" });
  res.json({ van: van.rows[0] });
};

addVansByDriver = async (req, res) => {
  const driverId = req.user.id;
  const { number_plate, capacity, fare, is_girls_only, photo_url } = req.body;

  const exists = await pool.query("SELECT 1 FROM vans WHERE driver_id=$1", [
    driverId,
  ]);
  if (exists.rows.length)
    return res.status(400).json({ message: "Van already exists" });

  const van = await pool.query(
    `INSERT INTO vans (driver_id, number_plate, capacity, fare, is_girls_only, photo_url)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [driverId, number_plate, capacity, fare, is_girls_only, photo_url]
  );

  res.status(201).json({ van: van.rows[0] });
};

updateVanStatus = async (req, res) => {
  const { vanId } = req.params;
  const { is_active } = req.body;

  const v = await pool.query(
    "UPDATE vans SET is_active=$1 WHERE id=$2 RETURNING *",
    [is_active, vanId]
  );
  if (!v.rows.length) return res.status(404).json({ message: "Van not found" });
  res.json({ message: "Status updated", van: v.rows[0] });
};

module.exports = {
  getVans,
  bookVan,
  getVanDetails,
  updateVanStatus,
  addVansByDriver,
};

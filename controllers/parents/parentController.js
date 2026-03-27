const { pool } = require("../../utils/dbConnection");

addChildren = async (req, res) => {
  try {
    const {
      branch_id,
      school_id,
      full_name,
      date_of_birth,
      gender,
      grade,
      emergency_contact,
      disease,
      requires_girls_only,
      pickup_address,
    } = req.body;
    const parent_id = req.user.id;

    console.log({
      branch_id,
      school_id,
      parent_id,
      full_name,
      date_of_birth,
      gender,
      grade,
      emergency_contact,
      disease,
      requires_girls_only,
      pickup_address,
    });

    const parent = await pool.query(
      "SELECT id FROM users WHERE id=$1 AND role='PARENT'",
      [parent_id],
    );

    if (!parent.rows.length)
      return res.status(403).json({ message: "Parent not found" });

    const school = await pool.query(
      "SELECT id FROM schools WHERE id=$1 AND is_active=true AND service_active=true",
      [school_id],
    );
    if (!school.rows.length)
      return res.status(400).json({ message: "School service inactive" });

    let child_pic = req.files?.child_pic?.[0]?.path;
    const requiresGirlsOnly =
      requires_girls_only === "true" || requires_girls_only === true;

    const child = await pool.query(
      `INSERT INTO children (parent_id, branch_id, full_name, date_of_birth, gender, grade, emergency_contact, disease,
      requires_girls_only, child_pic, pickup_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [
        parent_id,
        branch_id,
        full_name,
        date_of_birth,
        gender.toUpperCase(),
        grade,
        emergency_contact,
        disease,
        requiresGirlsOnly,
        child_pic,
        pickup_address,
      ],
    );

    res.status(201).json({ message: "Child added", childId: child.rows[0].id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

getChildren = async (req, res) => {
  try {
    const children = await pool.query(
      `
      SELECT 
        c.*,
        s.school_name AS school_name,
        u.full_name AS guardian,
        v.number_plate
      FROM children c
      JOIN school_branches sb ON sb.id = c.branch_id
      JOIN schools s ON s.id=sb.school_id
      JOIN users u ON u.id = c.parent_id
      LEFT JOIN bookings b ON b.child_id = c.id
      LEFT JOIN vans v ON v.id = b.van_id
      WHERE c.parent_id = $1
      `,
      [req.user.id],
    );

    res.json(children.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

getChildDetails = async (req, res) => {
  const child = await pool.query(
    "SELECT * FROM children WHERE id=$1 AND parent_id=$2",
    [req.params.childId, req.user.id],
  );
  if (!child.rows.length) return res.status(404).json({ message: "Not found" });
  res.json(child.rows[0]);
};

updateChild = async (req, res) => {
  try {
    const {
      branch_id,
      school_id,
      full_name,
      date_of_birth,
      gender,
      grade,
      emergency_contact,
      disease,
      requires_girls_only,
      pickup_address,
    } = req.body;

    console.log({
      branch_id,
      school_id,
      full_name,
      date_of_birth,
      gender,
      grade,
      emergency_contact,
      disease,
      requires_girls_only,
      pickup_address,
    });

    const updates = [];
    const values = [];
    let index = 1;

    if (branch_id !== undefined) {
      updates.push(`branch_id=$${index}`);
      values.push(branch_id);
      index++;
    }

    if (full_name !== undefined) {
      updates.push(`full_name=$${index}`);
      values.push(full_name);
      index++;
    }

    if (date_of_birth !== undefined) {
      updates.push(`date_of_birth=$${index}`);
      values.push(date_of_birth);
      index++;
    }

    if (gender !== undefined) {
      updates.push(`gender=$${index}`);
      values.push(gender.toUpperCase());
      index++;
    }

    if (grade !== undefined) {
      updates.push(`grade=$${index}`);
      values.push(grade);
      index++;
    }

    if (emergency_contact !== undefined) {
      updates.push(`emergency_contact=$${index}`);
      values.push(emergency_contact);
      index++;
    }

    if (disease !== undefined) {
      updates.push(`disease=$${index}`);
      values.push(disease);
      index++;
    }

    if (requires_girls_only !== undefined) {
      updates.push(`requires_girls_only=$${index}`);
      const requiresGirlsOnly =
        requires_girls_only === "true" || requires_girls_only === true;
      values.push(requiresGirlsOnly);
      index++;
    }

    if (req.files?.child_pic?.[0]?.path) {
      updates.push(`child_pic=$${index}`);
      values.push(req.files.child_pic[0].path);
      index++;
    }

    if (pickup_address !== undefined) {
      updates.push(`pickup_address=$${index}`);
      values.push(pickup_address);
      index++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(req.params.childId, req.user.id);

    const query = `
      UPDATE children 
      SET ${updates.join(", ")}
      WHERE id=$${index} AND parent_id=$${index + 1} 
      RETURNING id
    `;

    const child = await pool.query(query, values);

    if (!child.rows.length)
      return res.status(404).json({ message: "Child not found" });
    res.json({ message: "Updated", childId: child.rows[0].id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

deleteChild = async (req, res) => {
  const del = await pool.query(
    "DELETE FROM children WHERE id=$1 AND parent_id=$2 RETURNING id",
    [req.params.childId, req.user.id],
  );
  if (!del.rows.length) return res.status(404).json({ message: "Not found" });
  res.json({ message: "Deleted" });
};

getFeedback = async (req, res) => {
  const { driver_id, child_id, rating, comments } = req.body;

  const exists = await pool.query(
    "SELECT id FROM users WHERE id=$1 AND role='DRIVER'",
    [driver_id],
  );
  if (!exists.rows.length)
    return res.status(404).json({ message: "Driver not found" });

  const fb = await pool.query(
    `INSERT INTO driver_ratings (driver_id,parent_id,child_id,rating,comments)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [driver_id, req.user.id, child_id, rating, comments],
  );

  res.status(201).json({ message: "Rating submitted", rating: fb.rows[0] });
};

getFeedbackHistory = async (req, res) => {
  const data = await pool.query(
    `SELECT d.full_name AS driver, r.rating, r.comments, r.created_at
     FROM driver_ratings r
     JOIN users d ON d.id=r.driver_id
     WHERE r.parent_id=$1
     ORDER BY r.created_at DESC`,
    [req.user.id],
  );
  res.json(data.rows);
};

doComplaints = async (req, res) => {
  const { driver_id, school_id, description } = req.body;

  const comp = await pool.query(
    `INSERT INTO complaints (parent_id,driver_id,school_id,description)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.id, driver_id, school_id, description],
  );

  res.status(201).json({ message: "Complaint filed", complaint: comp.rows[0] });
};

getComplaintsHistory = async (req, res) => {
  const rows = await pool.query(
    "SELECT * FROM complaints WHERE parent_id=$1 ORDER BY created_at DESC",
    [req.user.id],
  );
  res.json(rows.rows);
};

module.exports = {
  addChildren,
  getChildren,
  getChildDetails,
  updateChild,
  deleteChild,
  getFeedback,
  getFeedbackHistory,
  doComplaints,
  getComplaintsHistory,
};

// import axios from "axios";
// import pool from "../db"; // your PostgreSQL pool

// const addChildren = async (req, res) => {
//   try {
//     const {
//       branch_id,
//       school_id,
//       full_name,
//       date_of_birth,
//       gender,
//       grade,
//       emergency_contact,
//       disease,
//       requires_girls_only,
//       pickup_address,
//     } = req.body;
//     const parent_id = req.user.id;

//     // --- Check if we already have coordinates for this address ---
//     const cached = await pool.query(
//       "SELECT lat, lng FROM address_cache WHERE address = $1",
//       [pickup_address]
//     );

//     let location;

//     if (cached.rows.length) {
//       location = {
//         lat: cached.rows[0].lat,
//         lng: cached.rows[0].lng,
//       };
//       console.log("Using cached coordinates:", location);
//     } else {
//       // --- Fetch from Nominatim ---
//       const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
//         pickup_address
//       )}`;

//       const geoResp = await axios.get(nominatimUrl, {
//         headers: {
//           "User-Agent": "VanPoolingApp/1.0 (+yourdomain.com)",
//         },
//       });

//       if (!geoResp.data.length)
//         return res.status(400).json({ message: "Address not found" });

//       location = {
//         lat: parseFloat(geoResp.data[0].lat),
//         lng: parseFloat(geoResp.data[0].lon),
//       };

//       // --- Save coordinates to cache for future ---
//       await pool.query(
//         "INSERT INTO address_cache (address, lat, lng) VALUES ($1,$2,$3)",
//         [pickup_address, location.lat, location.lng]
//       );

//       console.log("Coordinates saved to cache:", location);
//     }

//     // --- Insert child into DB ---
//     // const child = await pool.query(
//     //   `INSERT INTO children
//     //    (parent_id, branch_id, full_name, date_of_birth, gender, grade, emergency_contact, disease,
//     //     requires_girls_only, pickup_address, lat, lng)
//     //    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
//     //    RETURNING id`,
//     //   [
//     //     parent_id,
//     //     branch_id,
//     //     full_name,
//     //     date_of_birth,
//     //     gender.toUpperCase(),
//     //     grade,
//     //     emergency_contact,
//     //     disease,
//     //     requires_girls_only === "true",
//     //     pickup_address,
//     //     location.lat,
//     //     location.lng,
//     //   ]
//     // );

//     res.status(201).json({ message: "Child added", coordinates: location });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ error: e.message });
//   }
// };

// export default addChildren;

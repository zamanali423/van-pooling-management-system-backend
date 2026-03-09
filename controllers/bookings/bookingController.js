const { pool } = require("../../utils/dbConnection");

const getBookings = async (req, res) => {
  try {
    const parentId = req.user.id;

    const bookings = await pool.query(`
      SELECT 
        b.id,
        b.status,
        b.booked_at,
        c.full_name AS child_name,
        v.id AS van_id,
        v.number_plate,
        v.fare,
        u.full_name AS driver_name,
        s.school_name AS van_address,
        sb.start_time-Interval '30 minutes' as pick_up_time,
        sb.end_time as drop_off_time,
        p.payment_status
      FROM bookings b
      JOIN cash_payments p ON p.booking_id = b.id
      JOIN children c ON c.id = b.child_id
      JOIN vans v ON v.id = b.van_id
      JOIN school_branches sb ON sb.id = c.branch_id
      JOIN schools s ON s.id = sb.school_id
      LEFT JOIN users u ON u.id = v.driver_id
      WHERE c.parent_id = $1
      ORDER BY b.booked_at DESC
    `,[parentId]);

    res.json({ bookings: bookings.rows });      
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const getBookingDetails = async (req,res)=>{
  try{
    const parentId = req.user.id;
    const { bookingId } = req.params;

    const booking = await pool.query(`
      SELECT 
        b.id,
        b.status,
        b.booked_at,
        c.full_name AS child_name,
        v.number_plate,
        v.fare,
        u.full_name AS driver_name
      FROM bookings b
      JOIN children c ON c.id = b.child_id
      JOIN vans v ON v.id = b.van_id
      LEFT JOIN users u ON u.id = v.driver_id
      WHERE b.id=$1 AND c.parent_id=$2
    `,[bookingId,parentId]);

    if(!booking.rowCount) return res.status(404).json({message:"Booking not found"});
    res.json({booking: booking.rows[0]});
  }catch(err){
    res.status(500).json({error:err.message});
  }
};


const cancelBooking = async (req,res)=>{
  try{
    const parentId = req.user.id;
    const { bookingId } = req.params;

    const ok = await pool.query(`
      UPDATE bookings b
      SET status='CANCELLED'
      FROM children c
      WHERE b.child_id=c.id AND c.parent_id=$1 AND b.id=$2
      RETURNING b.id
    `,[parentId,bookingId]);

    if(!ok.rowCount) return res.status(404).json({message:"Booking not found"});
    res.json({message:"Booking cancelled"});
  }catch(err){
    res.status(500).json({error:err.message});
  }
};


const reBooking = async (req,res)=>{
  try{
    const parentId = req.user.id;
    const { bookingId } = req.params;

    const old = await pool.query(`
      SELECT b.child_id, b.van_id
      FROM bookings b
      JOIN children c ON c.id=b.child_id
      WHERE b.id=$1 AND c.parent_id=$2
    `,[bookingId,parentId]);

    if(!old.rowCount) return res.status(404).json({message:"Booking not found"});

    const n = await pool.query(`
      INSERT INTO bookings(child_id,van_id,status)
      VALUES($1,$2,'ACTIVE')
      RETURNING *
    `,[old.rows[0].child_id, old.rows[0].van_id]);

    res.status(201).json({message:"Rebooked", booking:n.rows[0]});
  }catch(err){
    res.status(500).json({error:err.message});
  }
};


module.exports = {
  getBookings,
  getBookingDetails,
  cancelBooking,
  reBooking,
};

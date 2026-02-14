// src/admin.js
import express from "express";
import { pool, sql } from "./db.js";
import { authRequired, adminOnly } from "./auth.js";

const router = express.Router();

// helper wrapper
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/* =========================
 *  รายงานสรุปต่อวัน (Summary)
 *  GET /api/admin/summary?date=YYYY-MM-DD&centerId=1 (optional)
 *  - คืนจำนวนจองรวมต่อช่วงเวลา + ความจุ (capacity)
 * ========================= */
router.get("/summary", authRequired, adminOnly, wrap(async (req, res) => {
  const date = req.query.date;
  const centerId = req.query.centerId ? parseInt(req.query.centerId) : null;
  if (!date) return res.status(400).json({ error: "date required" });

  // ดึง Service ของศูนย์ (ถ้ามีกรอง)
  const svc = await pool.request()
    .input("centerId", sql.Int, centerId ?? null)
    .query(`
      SELECT s.ServiceID, s.CenterID, s.ServiceName, s.DurationMin, s.SlotCapacity,
             c.CenterName
      FROM dbo.Services s
      JOIN dbo.Centers c ON c.CenterID = s.CenterID
      WHERE s.IsActive=1
        ${centerId ? "AND s.CenterID=@centerId" : ""}
      ORDER BY c.CenterName, s.ServiceName;
    `);

  // นับจำนวนจองต่อ slot time (HH:MM) ในวันนั้น
  const q = await pool.request()
    .input("BookingDate", sql.Date, date)
    .query(`
      SELECT CenterID, ServiceID,
             CONVERT(varchar(5), SlotTime, 108) AS SlotHM,
             COUNT(*) AS Booked
      FROM dbo.Queues
      WHERE BookingDate=@BookingDate
        AND Status IN (N'Booked',N'CheckedIn',N'Completed')
      GROUP BY CenterID, ServiceID, CONVERT(varchar(5), SlotTime, 108);
    `);

  // แปลงเป็น map for quick lookup
  const bookedMap = new Map(
    q.recordset.map(r => [`${r.CenterID}-${r.ServiceID}-${r.SlotHM}`, r.Booked])
  );

  const summaries = [];

  for (const s of svc.recordset) {
    const openMin = 9 * 60, closeMin = 17 * 60;
    const rows = [];
    for (let m = openMin; m < closeMin; m += s.DurationMin) {
      const hh = String(Math.floor(m / 60)).padStart(2, "0");
      const mm = String(m % 60).padStart(2, "0");
      const hm = `${hh}:${mm}`;
      const key = `${s.CenterID}-${s.ServiceID}-${hm}`;
      const booked = bookedMap.get(key) || 0;
      rows.push({
        time: hm,
        capacity: s.SlotCapacity,
        booked,
        remaining: Math.max(0, s.SlotCapacity - booked)
      });
    }
    summaries.push({
      centerId: s.CenterID,
      centerName: s.CenterName,
      serviceId: s.ServiceID,
      serviceName: s.ServiceName,
      durationMin: s.DurationMin,
      slotCapacity: s.SlotCapacity,
      rows
    });
  }

  res.json({ date, summaries });
}));

/* =========================
 *  รายการจองของวันนั้น (Bookings list)
 *  GET /api/admin/bookings?date=YYYY-MM-DD&centerId=1 (optional)
 * ========================= */
router.get("/bookings", authRequired, adminOnly, wrap(async (req, res) => {
  const date = req.query.date;
  const centerId = req.query.centerId ? parseInt(req.query.centerId) : null;
  if (!date) return res.status(400).json({ error: "date required" });

  const r = await pool.request()
    .input("BookingDate", sql.Date, date)
    .input("CenterID", sql.Int, centerId ?? null)
    .query(`
      SELECT q.QueueID,
             q.BookingDate,
             CONVERT(varchar(5), q.SlotTime, 108) AS SlotTime,
             q.Status,
             q.TicketNo,
             u.Username, u.FullName,
             c.CenterName, s.ServiceName
      FROM dbo.Queues q
      JOIN dbo.Users   u ON u.UserID   = q.UserID
      JOIN dbo.Centers c ON c.CenterID = q.CenterID
      JOIN dbo.Services s ON s.ServiceID = q.ServiceID
      WHERE q.BookingDate=@BookingDate
        ${centerId ? "AND q.CenterID=@CenterID" : ""}
      ORDER BY q.SlotTime, s.ServiceName, u.FullName;
    `);

  res.json(r.recordset);
}));

/* =========================
 *  CENTERS CRUD (admin)
 * ========================= */

// GET centers (active & all)
router.get("/centers", authRequired, adminOnly, wrap(async (_req, res) => {
  const r = await pool.request().query(`
    SELECT CenterID, CenterCode, CenterName, Province, IsActive
    FROM dbo.Centers
    ORDER BY IsActive DESC, CenterName;
  `);
  res.json(r.recordset);
}));
router.post("/centers", authRequired, adminOnly, wrap(async (req, res) => {
  const { CenterCode, CenterName, Province, IsActive = 1 } = req.body || {};
  if (!CenterCode || !CenterName)
    return res.status(400).json({ error: "CenterCode, CenterName required" });

  const r = await pool.request()
    .input("CenterCode", sql.NVarChar(50), CenterCode)
    .input("CenterName", sql.NVarChar(200), CenterName)
    .input("Province",   sql.NVarChar(100), Province ?? null)
    .input("IsActive",   sql.Bit, IsActive ? 1 : 0)
    .query(`
      INSERT dbo.Centers (CenterCode, CenterName, Province, IsActive)
      VALUES (@CenterCode, @CenterName, @Province, @IsActive);
      SELECT SCOPE_IDENTITY() AS CenterID;
    `);

  res.json({ ok: true, id: r.recordset[0].CenterID });
}));

router.delete("/centers/:id", authRequired, adminOnly, wrap(async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error: "invalid id" });

  // soft delete
  await pool.request()
    .input("CenterID", sql.Int, id)
    .query(`UPDATE dbo.Centers SET IsActive=0 WHERE CenterID=@CenterID;`);

  res.json({ ok: true });
}));

/* =========================
 *  SERVICES CRUD (admin)
 * ========================= */
router.get("/services", authRequired, adminOnly, wrap(async (req, res) => {
  const centerId = req.query.centerId ? parseInt(req.query.centerId) : null;
  const r = await pool.request()
    .input("CenterID", sql.Int, centerId ?? null)
    .query(`
      SELECT s.ServiceID, s.CenterID, c.CenterName,
             s.ServiceName, s.DurationMin, s.SlotCapacity, s.Fee, s.RequiresPayment, s.IsActive
      FROM dbo.Services s
      JOIN dbo.Centers c ON c.CenterID = s.CenterID
      ${centerId ? "WHERE s.CenterID=@CenterID" : ""}
      ORDER BY c.CenterName, s.ServiceName;
    `);
  res.json(r.recordset);
}));

router.post("/services", authRequired, adminOnly, wrap(async (req, res) => {
  const { CenterID, ServiceName, DurationMin, SlotCapacity, Fee = 0, RequiresPayment = 0, IsActive = 1 } = req.body || {};
  if (!CenterID || !ServiceName || !DurationMin || !SlotCapacity)
    return res.status(400).json({ error: "CenterID, ServiceName, DurationMin, SlotCapacity required" });

  const r = await pool.request()
    .input("CenterID",        sql.Int, CenterID)
    .input("ServiceName",     sql.NVarChar(200), ServiceName)
    .input("DurationMin",     sql.Int, DurationMin)
    .input("SlotCapacity",    sql.Int, SlotCapacity)
    .input("Fee",             sql.Decimal(10,2), Fee)
    .input("RequiresPayment", sql.Bit, RequiresPayment ? 1 : 0)
    .input("IsActive",        sql.Bit, IsActive ? 1 : 0)
    .query(`
      INSERT dbo.Services (CenterID, ServiceName, DurationMin, SlotCapacity, Fee, RequiresPayment, IsActive)
      VALUES (@CenterID, @ServiceName, @DurationMin, @SlotCapacity, @Fee, @RequiresPayment, @IsActive);
      SELECT SCOPE_IDENTITY() AS ServiceID;
    `);

  res.json({ ok: true, id: r.recordset[0].ServiceID });
}));

router.put("/services/:id", authRequired, adminOnly, wrap(async (req, res) => {
  const id = parseInt(req.params.id);
  const { CenterID, ServiceName, DurationMin, SlotCapacity, Fee = 0, RequiresPayment = 0, IsActive = 1 } = req.body || {};
  if (!id) return res.status(400).json({ error: "invalid id" });
  if (!CenterID || !ServiceName || !DurationMin || !SlotCapacity)
    return res.status(400).json({ error: "CenterID, ServiceName, DurationMin, SlotCapacity required" });

  await pool.request()
    .input("ServiceID",       sql.Int, id)
    .input("CenterID",        sql.Int, CenterID)
    .input("ServiceName",     sql.NVarChar(200), ServiceName)
    .input("DurationMin",     sql.Int, DurationMin)
    .input("SlotCapacity",    sql.Int, SlotCapacity)
    .input("Fee",             sql.Decimal(10,2), Fee)
    .input("RequiresPayment", sql.Bit, RequiresPayment ? 1 : 0)
    .input("IsActive",        sql.Bit, IsActive ? 1 : 0)
    .query(`
      UPDATE dbo.Services
      SET CenterID=@CenterID, ServiceName=@ServiceName, DurationMin=@DurationMin,
          SlotCapacity=@SlotCapacity, Fee=@Fee, RequiresPayment=@RequiresPayment, IsActive=@IsActive
        WHERE ServiceID=@ServiceID;
    `);

  res.json({ ok: true });
}));

router.delete("/services/:id", authRequired, adminOnly, wrap(async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error: "invalid id" });

  // soft delete
  await pool.request()
    .input("ServiceID", sql.Int, id)
    .query(`UPDATE dbo.Services SET IsActive=0 WHERE ServiceID=@ServiceID;`);

  res.json({ ok: true });
}));

/* =========================
 *  PAYMENTS (admin)
 *  - GET /api/admin/payments?date=YYYY-MM-DD&centerId=1 (optional)
 *  - POST /api/admin/payments  { QueueID, RefCode }
 *    - updates Queues.RefCode to store payment reference (marks as paid)
 * ========================= */
router.get("/payments", authRequired, adminOnly, wrap(async (req, res) => {
  const date = req.query.date;
  const centerId = req.query.centerId ? parseInt(req.query.centerId) : null;
  // allow requesting all dates with ?date=all or ?all=1
  const isAll = String(date || '').toLowerCase() === 'all' || req.query.all === '1';
  if (!date && !isAll) return res.status(400).json({ error: "date required" });

  // build request and query conditionally; use the vw_QueueDetails view
  const reqBuilder = pool.request();
  if (!isAll) reqBuilder.input("BookingDate", sql.Date, date);
  reqBuilder.input("CenterID", sql.Int, centerId ?? null);

    const sqlWhere = (isAll ? '1=1' : 'v.BookingDate = @BookingDate') + (centerId ? ' AND v.CenterID = @CenterID' : '');

  const r = await reqBuilder.query(`
      SELECT v.QueueID,
             v.BookingDate,
             v.SlotTime,
             v.Status,
             v.TicketNo,
             q.RefCode,
             v.UserID, v.Username, v.FullName,
             v.CenterID, v.CenterName, v.ServiceID, v.ServiceName
      FROM dbo.vw_QueueDetails v
      LEFT JOIN dbo.Queues q ON q.QueueID = v.QueueID
      WHERE ${sqlWhere}
      ORDER BY v.SlotTime, v.CenterName, v.ServiceName;
    `);

  res.json(r.recordset);
}));

router.post("/payments", authRequired, adminOnly, wrap(async (req, res) => {
  const { QueueID, RefCode } = req.body || {};
  const id = parseInt(QueueID);
  if (!id) return res.status(400).json({ error: "QueueID required" });
  if (!RefCode || String(RefCode).trim().length === 0) return res.status(400).json({ error: "RefCode required" });

  await pool.request()
    .input("QueueID", sql.Int, id)
    .input("RefCode", sql.NVarChar(200), String(RefCode).trim())
    .query(`
      UPDATE dbo.Queues
      SET RefCode = @RefCode,
          Status = N'Completed'
      WHERE QueueID = @QueueID;
    `);

  res.json({ ok: true });
}));

// POST /api/admin/payments/cancel  <-- admin cancel (mark as cancelled)
router.post("/payments/cancel", authRequired, adminOnly, wrap(async (req, res) => {
  const { QueueID } = req.body || {};
  const id = parseInt(QueueID);
  if (!id) return res.status(400).json({ error: "QueueID required" });

  await pool.request()
    .input("QueueID", sql.Int, id)
    .query(`
      UPDATE dbo.Queues
      SET Status = N'Cancelled', CancelledAt = SYSDATETIME()
        WHERE QueueID = @QueueID;
    `);

  res.json({ ok: true });
}));

export default router;

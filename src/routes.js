// src/routes.js
import express from "express";
import bcrypt from "bcryptjs";
import { pool, sql } from "./db.js";
import { authRequired, signToken } from "./auth.js";
import { body, param, validationResult } from 'express-validator';
import logger from './logger.js';

export const router = express.Router();

// helper wrap
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/* ===================== AUTH ===================== */

// POST /api/auth/register
router.post(
  "/auth/register",
  // validation middleware
  [
    body('username').isLength({ min: 3 }).withMessage('username must be at least 3 chars').trim(),
    body('password').isLength({ min: 6 }).withMessage('password must be at least 6 chars'),
    body('fullName').notEmpty().withMessage('fullName required').trim(),
    body('phone').optional().isMobilePhone('any').withMessage('invalid phone'),
    body('email').optional().isEmail().withMessage('invalid email')
  ],
  wrap(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, password, fullName, phone, email } = req.body || {};

    const passwordHash = await bcrypt.hash(password, 10);

    try {
      // Insert user and return inserted metadata
      const r = await pool.request()
        .input("Username",     sql.NVarChar(100),  username)
        .input("PasswordHash", sql.NVarChar(400), passwordHash)
        .input("FullName",     sql.NVarChar(200), fullName)
        .input("Phone",        sql.NVarChar(50),  phone || null)
        .input("Email",        sql.NVarChar(200), email || null)
        .input("Role",         sql.NVarChar(50),  "citizen")
        .query(`
          IF EXISTS(SELECT 1 FROM dbo.Users WHERE Username=@Username)
            BEGIN
              SELECT 0 AS Success, 'Username already exists' AS Message;
            END
          ELSE
            BEGIN
              INSERT INTO dbo.Users(Username,PasswordHash,FullName,Phone,Email,Role,IsActive)
              OUTPUT INSERTED.UserID, INSERTED.Username, INSERTED.FullName, INSERTED.Role
              VALUES(@Username,@PasswordHash,@FullName,@Phone,@Email,@Role,1);
            END
        `);

      // If duplicate case, the SELECT returns Success=0
      if (r.recordset && r.recordset.length > 0 && r.recordset[0].Success === 0) {
        return res.status(400).json({ error: r.recordset[0].Message || 'Username already exists' });
      }

      const inserted = (r.recordset && r.recordset[0]) || null;
      if (!inserted || !inserted.UserID) {
        // Unexpected: log and return generic error
        logger.error({ reqBody: req.body }, 'Register: unexpected insert result');
        return res.status(500).json({ error: 'Register failed (unexpected result)' });
      }

      // Optionally sign token so client can be logged in immediately
      const token = signToken({ userId: inserted.UserID, role: inserted.Role, name: inserted.FullName });
      return res.json({ ok: true, token, user: { id: inserted.UserID, name: inserted.FullName, role: inserted.Role } });

    } catch (e) {
      // Distinguish SQL application errors vs unexpected exceptions
      logger.error(e, 'Registration error');
      const sqlMsg = e?.originalError?.info?.message || e.message || 'register failed';
      // If SQL raised a business error (e.g., RAISERROR) we may want to return 400
      if (String(sqlMsg).toLowerCase().includes('username')) return res.status(400).json({ error: sqlMsg });
      return res.status(500).json({ error: sqlMsg });
    }
  })
);

// POST /api/auth/login
router.post(
  '/auth/login',
  [
    body('username').notEmpty().withMessage('username required').trim(),
    body('password').notEmpty().withMessage('password required')
  ],
  wrap(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, password } = req.body || {};

    const result = await pool.request()
      .input("Username", sql.NVarChar(50), username)
      .query(`
        SELECT TOP 1 UserID, Username, PasswordHash, FullName, Role, IsActive
        FROM dbo.Users
        WHERE Username=@Username;
      `);

    if (result.recordset.length === 0) return res.status(400).json({ error: "User not found" });

    const u = result.recordset[0];
    if (!u.IsActive) return res.status(403).json({ error: "User disabled" });

    const ok = await bcrypt.compare(password, u.PasswordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken({ userId: u.UserID, role: u.Role, name: u.FullName });
    res.json({ token, user: { id: u.UserID, name: u.FullName, role: u.Role } });
  })
);

router.get("/auth/me", authRequired, (req, res) => res.json({ ok: true, user: req.user }));

/* ===================== MASTER ===================== */

router.get("/centers", wrap(async (_req, res) => {
  const r = await pool.request().query(`
    SELECT CenterID, CenterCode, CenterName, Province, IsActive
    FROM dbo.Centers
    WHERE IsActive=1
    ORDER BY CenterName;
  `);
  res.json(r.recordset);
}));

router.get("/services", wrap(async (req, res) => {
  const centerId = parseInt(req.query.centerId);
  if (!centerId) return res.status(400).json({ error: "centerId required" });

  const r = await pool.request()
    .input("CenterID", sql.Int, centerId)
    .query(`
      SELECT ServiceID, CenterID, ServiceName, DurationMin, SlotCapacity, Fee, RequiresPayment
      FROM dbo.Services
      WHERE CenterID=@CenterID AND IsActive=1
      ORDER BY ServiceName;
    `);
  res.json(r.recordset);
}));

/* ===================== AVAILABILITY ===================== */
// GET /api/availability?centerId=1&serviceId=2&date=YYYY-MM-DD
router.get("/availability", wrap(async (req, res) => {
  const centerId  = parseInt(req.query.centerId);
  const serviceId = parseInt(req.query.serviceId);
  const date      = req.query.date;
  if (!centerId || !serviceId || !date)
    return res.status(400).json({ error: "centerId, serviceId, date required" });

  // service info
  const s = await pool.request()
    .input("ServiceID", sql.Int, serviceId)
    .query(`
      SELECT TOP 1 DurationMin, SlotCapacity
      FROM dbo.Services
      WHERE ServiceID=@ServiceID;
    `);
  if (s.recordset.length === 0) return res.status(404).json({ error: "Service not found" });

  const { DurationMin, SlotCapacity } = s.recordset[0];

  // count booked by HH:MM to match UI
  const q = await pool.request()
    .input("CenterID",    sql.Int, centerId)
    .input("ServiceID",   sql.Int, serviceId)
    .input("BookingDate", sql.Date, date)
    .query(`
      SELECT CONVERT(varchar(5), SlotTime, 108) AS SlotHM, COUNT(*) AS Booked
      FROM dbo.Queues
      WHERE CenterID=@CenterID AND ServiceID=@ServiceID
        AND BookingDate=@BookingDate
        AND Status IN (N'Booked', N'CheckedIn', N'Completed')
      GROUP BY CONVERT(varchar(5), SlotTime, 108);
    `);

  const bookedByHM = new Map(q.recordset.map(r => [r.SlotHM, r.Booked]));

  const openMin = 9 * 60, closeMin = 17 * 60;
  const slots = [];
  for (let m = openMin; m < closeMin; m += DurationMin) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    const hm = `${hh}:${mm}`;
    const booked = bookedByHM.get(hm) || 0;
    const remaining = Math.max(0, SlotCapacity - booked);
    slots.push({ time: hm, capacity: SlotCapacity, booked, remaining });
  }

  res.json(slots);
}));

/* ===================== BOOKING ===================== */

// POST /api/queues
router.post(
  "/queues",
  authRequired,
  [
    body('centerId').isInt().withMessage('centerId must be an integer'),
    body('serviceId').isInt().withMessage('serviceId must be an integer'),
    body('bookingDate').isISO8601().withMessage('bookingDate must be YYYY-MM-DD'),
    body('slotTime').matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('slotTime must be HH:MM or HH:MM:SS')
  ],
  wrap(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { centerId, serviceId, bookingDate, slotTime } = req.body || {};

    // normalize HH:MM -> HH:MM:SS
    let slot = String(slotTime).trim();
    if (slot.length === 5) slot += ":00";

    try {
      const r = await pool.request()
        .input("CenterID",     sql.Int,        centerId)
        .input("ServiceID",    sql.Int,        serviceId)
        .input("UserID",       sql.Int,        req.user.userId)
        .input("BookingDate",  sql.Date,       bookingDate)
        .input("SlotTimeStr",  sql.VarChar(8), slot)     // HH:MM:SS
        .input("Status",       sql.NVarChar(20), "Booked")
        .query(`
          INSERT dbo.Queues(CenterID,ServiceID,UserID,BookingDate,SlotTime,Status)
          VALUES(@CenterID,@ServiceID,@UserID,@BookingDate, CONVERT(time, @SlotTimeStr, 108), @Status);
          SELECT SCOPE_IDENTITY() AS QueueID;
        `);

  // Return both `queueId` (legacy lowercase) and `QueueID` (uppercase) so clients
  // that expect either form can match newly created record.
  const qid = r.recordset[0].QueueID;
  res.json({ ok: true, queueId: qid, QueueID: qid });
    } catch (e) {
      // Log full error server-side for debugging (stack / original SQL info)
      logger.error(e, '🔴 Booking error');
      const msg = e?.originalError?.info?.message || e.message || "booking failed";
      // Return the existing message to client but keep a full stack trace in server logs
      res.status(400).json({ error: msg });
    }
  })
);

// GET /api/my/queues
router.get("/my/queues", authRequired, wrap(async (req, res) => {
  const r = await pool.request()
    .input("UserID", sql.Int, req.user.userId)
    .query(`
      SELECT q.QueueID,
             q.BookingDate,
             CONVERT(varchar(5), q.SlotTime, 108) AS SlotTime,
             q.Status, q.TicketNo,
             c.CenterName, s.ServiceName
      FROM dbo.Queues q
      JOIN dbo.Centers  c ON c.CenterID  = q.CenterID
      JOIN dbo.Services s ON s.ServiceID = q.ServiceID
      WHERE q.UserID=@UserID
      ORDER BY q.BookingDate DESC, q.SlotTime DESC;
    `);
  res.json(r.recordset);
}));

// PATCH /api/queues/:id/cancel
router.patch(
  "/queues/:id/cancel",
  authRequired,
  [ param('id').isInt().withMessage('invalid id') ],
  wrap(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const id = parseInt(req.params.id);

    const r = await pool.request()
      .input("QueueID", sql.Int, id)
      .input("UserID",  sql.Int, req.user.userId)
      .query(`
        UPDATE dbo.Queues
        SET Status=N'Cancelled', CancelledAt=SYSDATETIME()
        WHERE QueueID=@QueueID
          AND UserID=@USERID
          AND Status IN (N'Booked',N'CheckedIn');

        SELECT @@ROWCOUNT AS Affected;
      `);

    if ((r.recordset[0]?.Affected || 0) === 0)
      return res.status(400).json({ error: "Cannot cancel this queue" });

    res.json({ ok: true });
  })
);

// DELETE /api/queues/:id  ← ลบประวัติออกจาก DB
router.delete(
  "/queues/:id",
  authRequired,
  [ param('id').isInt().withMessage('invalid id') ],
  wrap(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: "invalid id" });

    const r = await pool.request()
      .input("QueueID", sql.Int, id)
      .input("UserID",  sql.Int, req.user.userId)
      .query(`
        DELETE FROM dbo.Queues
        WHERE QueueID=@QUEUEID AND USERID=@USERID;
        SELECT @@ROWCOUNT AS Affected;
      `);

    if ((r.recordset[0]?.Affected || 0) === 0)
      return res.status(404).json({ error: "Queue not found" });

    res.json({ ok: true });
  })
);

// GET /api/queues/:id  ← details for a specific queue (used by frontend to fetch fee)
router.get(
  "/queues/:id",
  authRequired,
  [ param('id').isInt().withMessage('invalid id') ],
  wrap(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const id = parseInt(req.params.id);
    const r = await pool.request()
      .input('QueueID', sql.Int, id)
      .input('UserID', sql.Int, req.user.userId)
      .query(`
        SELECT q.QueueID,
               q.BookingDate,
               CONVERT(varchar(5), q.SlotTime, 108) AS SlotTime,
               q.Status,
               q.TicketNo,
               q.CenterID,
               q.ServiceID,
               s.ServiceName,
               s.Fee
        FROM dbo.Queues q
        JOIN dbo.Services s ON s.ServiceID = q.ServiceID
        LEFT JOIN dbo.Centers c ON c.CenterID = q.CenterID
        WHERE q.QueueID = @QueueID AND q.UserID = @UserID;
      `);

    if (!r.recordset || r.recordset.length === 0) return res.status(404).json({ error: 'Queue not found' });
    res.json(r.recordset[0]);
  })
);

// POST /api/queues/:id/pay  -- mark a queue as paid (user action)
router.post(
  "/queues/:id/pay",
  authRequired,
  [ param('id').isInt().withMessage('invalid id') ],
  wrap(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const id = parseInt(req.params.id);
    const paymentRef = (req.body && req.body.paymentRef) ? String(req.body.paymentRef).trim() : null;
    if (!paymentRef) return res.status(400).json({ error: 'paymentRef required' });

    // Ensure the queue belongs to the current user (or allow null user for anonymous?)
    const r = await pool.request()
      .input('QueueID', sql.Int, id)
      .input('UserID', sql.Int, req.user.userId)
      .input('paymentRef', sql.NVarChar(200), paymentRef)
      .query(`
        UPDATE dbo.Queues
        SET RefCode = @paymentRef,
            Status = N'Completed'
        WHERE QueueID = @QueueID AND UserID = @USERID;
        SELECT @@ROWCOUNT AS Affected;
      `);

    if ((r.recordset && r.recordset[0] && r.recordset[0].Affected) === 0) {
      return res.status(404).json({ error: 'Queue not found or not owned by user' });
    }

    res.json({ ok: true });
  })
);

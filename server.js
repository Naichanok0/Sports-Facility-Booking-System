// server.js
import express from "express";
import rateLimit from 'express-rate-limit';
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
dotenv.config();

import logger from "./src/logger.js";

// Basic environment validation
if (!process.env.JWT_SECRET) {
  logger.error('❌ Missing required env: JWT_SECRET. Please set process.env.JWT_SECRET');
  process.exit(1);
}

import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { poolConnect } from "./src/db.js";
import { router } from "./src/routes.js";
import adminRoutes from "./src/admin.js"; // ✅ เพิ่ม: เส้นทางสำหรับผู้ดูแลระบบ

const app = express();

// ใช้ Helmet ปกติ (เราแยกสคริปต์ออกเป็นไฟล์ภายนอกแล้ว)
app.use(helmet());

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger แบบง่าย
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, 'incoming request');
  next();
});

// ---------- API ----------
// Rate limit auth endpoints to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, try again later.' }
});

app.use("/api/admin", adminRoutes); // ✅ เพิ่ม: กลุ่ม API แอดมิน (ต้อง auth + role=admin)
// Apply limiter only to auth routes
app.use('/api/auth', authLimiter);
app.use("/api", router);            // กลุ่ม API ปกติ (auth/user)

// ---------- Static Web ----------
app.use(express.static(path.join(__dirname, "public")));

// (optional) healthcheck
app.get("/healthz", (_req, res) => res.json({ ok: true }));

// ---------- Error Middleware ----------
app.use((err, _req, res, _next) => {
  logger.error(err, '🔥 Unhandled route error');
  const message = err?.originalError?.info?.message || err.message || "Server error";
  res.status(500).json({ error: message });
});

// ---------- Process-level guards ----------
process.on("unhandledRejection", (r) => logger.error(r, '🧨 UnhandledRejection'));
process.on("uncaughtException", (e) => {
  logger.error(e, '💥 UncaughtException');
  // Exit after logging so the process doesn't stay in a bad state
  process.exit(1);
});

// ---------- Start ----------
const port = process.env.PORT || 3088;
poolConnect
  .then(() => {
    logger.info('✅ Connected to SQL Server');
    const server = app.listen(port, () => logger.info(`🚀 API & Web running at http://localhost:${port}`));

    // Handle listen errors (e.g., port already in use)
    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${port} already in use. Set PORT env or free the port.`);
        process.exit(1);
      } else {
        logger.error(err, '❌ Server error');
        process.exit(1);
      }
    });
  })
  .catch((err) => {
    logger.error(err, '❌ DB connect failed');
    process.exit(1);
  });

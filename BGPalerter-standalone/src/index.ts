import express from "express";
import sqlite3 from "sqlite3";
import path from "path";
import os from "os";

const app = express();
const port = process.env.PORT || 3000;

// DB path defaults to /home/ubuntu/BGPalerter/bgpalerter.sqlite
const homeDir = os.homedir();
const dbPath =
  process.env.BGPALERTER_DB_PATH ||
  path.join(homeDir, "BGPalerter", "bgpalerter.sqlite");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("[BGPalerter] Failed to open SQLite DB:", err.message);
  } else {
    console.log("[BGPalerter] SQLite DB opened at:", dbPath);
  }
});

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    dbPath
  });
});

// Example events table
db.run(
  `CREATE TABLE IF NOT EXISTS bgp_events (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     ts INTEGER NOT NULL,
     type TEXT NOT NULL,
     details TEXT
   );`,
  (err) => {
    if (err) {
      console.error("[BGPalerter] Failed to ensure bgp_events table:", err.message);
    } else {
      console.log("[BGPalerter] bgp_events table ensured.");
    }
  }
);

app.get("/api/bgp-events", (_req, res) => {
  db.all("SELECT * FROM bgp_events ORDER BY ts DESC LIMIT 100;", [], (err, rows) => {
    if (err) {
      console.error("[BGPalerter] Failed to query bgp_events:", err.message);
      return res.status(500).json({ error: "DB error" });
    }
    res.json(rows);
  });
});

app.listen(port, () => {
  console.log(`[BGPalerter] Backend listening on port ${port}`);
});

import { Router, type IRouter } from "express";
import { spawn } from "node:child_process";
import path from "node:path";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const REPO_ROOT = process.env.REPO_ROOT ?? path.resolve(process.cwd(), "..", "..");
const SCRAPER_PATH = path.join(REPO_ROOT, "scraper.py");

const CAMPUS_TO_SME: Record<string, string> = {
  giki: "giki",
  krackeddevs: "kracked_devs",
};

function pythonCommand(): string {
  return process.platform === "win32" ? "python" : "python3";
}

function runScraper(sme: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const args = [SCRAPER_PATH, sme, "--json"];
    const child = spawn(pythonCommand(), args, {
      cwd: REPO_ROOT,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      reject(err);
    });

    child.on("close", (code) => {
      if (stderr.trim()) {
        logger.info({ stderr: stderr.trim() }, "scraper stderr");
      }

      if (code !== 0) {
        reject(new Error(stderr.trim() || `Scraper exited with code ${code}`));
        return;
      }

      try {
        const parsed = JSON.parse(stdout.trim() || "[]");
        resolve(Array.isArray(parsed) ? parsed : []);
      } catch {
        reject(new Error("Scraper returned invalid JSON"));
      }
    });
  });
}

router.post("/events/fetch/:campusId", async (req, res) => {
  const { campusId } = req.params;
  const sme = CAMPUS_TO_SME[campusId];

  if (!sme) {
    res.status(400).json({ error: `Unknown campus: ${campusId}` });
    return;
  }

  try {
    const events = await runScraper(sme);
    res.json({ campusId, events });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scraper failed";
    logger.error({ err, campusId, sme }, "event fetch failed");
    res.status(503).json({
      error: message,
      hint: "Install Python + instaloader: pip install instaloader",
    });
  }
});

export default router;

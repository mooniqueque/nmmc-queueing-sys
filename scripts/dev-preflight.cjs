const fs = require("fs");
const net = require("net");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const backendDir = path.join(rootDir, "nmmcqueue-backend");
const backendEnvPath = path.join(backendDir, ".env");

function parseDotenv(filePath) {
  const parsed = {};
  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator <= 0) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

function checkPortOnHost(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (error) => {
      if (!error || typeof error !== "object") {
        resolve(false);
        return;
      }

      // Treat unsupported-address-family as not-in-use for that host only.
      if (error.code === "EADDRNOTAVAIL" || error.code === "EAFNOSUPPORT") {
        resolve(true);
        return;
      }

      if (error.code === "EADDRINUSE") {
        resolve(false);
        return;
      }

      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, host);
  });
}

function checkPortAvailableOnWindows(port) {
  const result = spawnSync("netstat", ["-ano", "-p", "tcp"], {
    cwd: rootDir,
    shell: true,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    return false;
  }

  const lines = (result.stdout || "").split(/\r?\n/);
  const portPattern = new RegExp(`[:.]${port}\\s`);

  for (const line of lines) {
    if (!line.includes("LISTENING")) continue;
    if (portPattern.test(line)) return false;
  }

  return true;
}

async function checkPortAvailable(port) {
  if (process.platform === "win32") {
    return checkPortAvailableOnWindows(port);
  }

  const checks = await Promise.all([
    checkPortOnHost(port, "127.0.0.1"),
    checkPortOnHost(port, "::1"),
  ]);

  return checks.every(Boolean);
}

async function main() {
  console.log("[predev] Running startup checks...");

  if (!fs.existsSync(backendEnvPath)) {
    console.error(`[predev] Missing backend env file at ${backendEnvPath}.`);
    process.exit(1);
  }

  const backendEnv = parseDotenv(backendEnvPath);
  const frontendPort = 3000;
  const backendPort = Number.parseInt(backendEnv.PORT || "3001", 10);

  if (!Number.isInteger(backendPort) || backendPort <= 0 || backendPort > 65535) {
    console.error(`[predev] Invalid backend PORT value in ${backendEnvPath}.`);
    process.exit(1);
  }

  const [frontendFree, backendFree] = await Promise.all([
    checkPortAvailable(frontendPort),
    checkPortAvailable(backendPort),
  ]);

  if (!frontendFree || !backendFree) {
    const conflicts = [];
    if (!frontendFree) conflicts.push(`frontend port ${frontendPort}`);
    if (!backendFree) conflicts.push(`backend port ${backendPort}`);

    console.error(`[predev] Port conflict detected: ${conflicts.join(", ")}.`);
    console.error("[predev] Stop existing processes using these ports, then rerun pnpm dev.");
    process.exit(1);
  }

  console.log("[predev] Ports are available.");
  console.log("[predev] Applying pending Prisma migrations (if any)...");

  const migrate = spawnSync(
    "pnpm",
    ["--filter", "nmmcqueue-backend", "run", "db:migrate:deploy"],
    {
      cwd: rootDir,
      stdio: "inherit",
      shell: process.platform === "win32",
    }
  );

  if (migrate.status !== 0) {
    console.error("[predev] Prisma migrate deploy failed. Startup aborted.");
    process.exit(migrate.status || 1);
  }

  console.log("[predev] Checking Prisma migration status...");

  const migrateStatus = spawnSync(
    "pnpm",
    ["--filter", "nmmcqueue-backend", "run", "db:migrate:status"],
    {
      cwd: rootDir,
      stdio: "inherit",
      shell: process.platform === "win32",
    }
  );

  if (migrateStatus.status !== 0) {
    console.error("[predev] Prisma migrate status is not clean. Startup aborted.");
    process.exit(migrateStatus.status || 1);
  }

  console.log("[predev] Verifying database schema...");

  const verify = spawnSync(
    "pnpm",
    ["--filter", "nmmcqueue-backend", "run", "db:verify"],
    {
      cwd: rootDir,
      stdio: "inherit",
      shell: process.platform === "win32",
    }
  );

  if (verify.status !== 0) {
    console.error("[predev] Database schema verification failed. Startup aborted.");
    process.exit(verify.status || 1);
  }

  console.log("[predev] Startup checks passed.");
}

main().catch((error) => {
  console.error("[predev] Unexpected error:", error);
  process.exit(1);
});

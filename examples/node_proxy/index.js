const express = require("express");

const app = express();
const UNBLIND_API_KEY = process.env.UNBLIND_API_KEY;

if (!UNBLIND_API_KEY) {
  throw new Error("UNBLIND_API_KEY not set");
}

app.use(express.json());

// Proxy all requests under /api/unblind/* to the Unblind API
app.all("/api/unblind{/*path}", async (req, res) => {
  try {
    // 1. Resolve tenant ID from the authenticated user
    //    Assumes an auth middleware has populated req.user.id
    const tenantId = req.user?.id;

    // 2. Preserve the requested path as-is
    let path = `/${req.params.path}`;

    // 3. Inject tenant ID for tenant-scoped endpoints
    //    (e.g. timeseries, logs, usage)
    path = path.replace("/tenants/", `/tenants/${tenantId}/`);

    // 4. Build the target Unblind API URL
    const url = `https://api.unblind.dev/v1${path}`;

    // 5. Forward request body only for methods that support it
    const body = ["GET", "HEAD"].includes(req.method)
      ? undefined
      : JSON.stringify(req.body);

    // 6. Attach authentication and content headers
    const headers = {
      Authorization: `Bearer ${UNBLIND_API_KEY}`,
      "Content-Type": "application/json",
    };

    // 6. Send
    const response = await fetch(url, {
      method: req.method,
      headers,
      body,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const server = app.listen(0, () => {
  console.log("Server running on port:", server.address().port);
  console.log("\nFor testing run the following command:");
  console.log(`curl localhost:${server.address().port}/api/unblind/metrics`);
  console.log("");
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

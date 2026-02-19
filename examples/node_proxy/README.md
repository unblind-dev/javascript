# Unblind Node.js Proxy

A minimal Express proxy for forwarding requests to the Unblind API.

## Requirements

- Node.js 18+
- `UNBLIND_API_KEY` environment variable
- Auth middleware that sets `req.user.id` (tenant ID)

## Run

```bash
npm install
node index.js
```

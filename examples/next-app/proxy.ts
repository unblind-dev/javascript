import { unblindProxy } from "@unblind/nextjs/server";

export default unblindProxy(() => process.env["TENANT_ID"] || "");

export const config = {
  matcher: "/api/unblind/:path*",
};

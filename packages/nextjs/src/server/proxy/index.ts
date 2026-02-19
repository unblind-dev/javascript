import { NextProxy, NextRequest, NextResponse } from "next/server";

const UNBLIND_API_KEY = process.env.UNBLIND_API_KEY;
const UNBLIND_API_ENDPOINT = "https://api.unblind.dev/v1";
const UNBLIND_PATH_PREFIX = "/api/unblind";

/**
 * Unblind API handler for Next.js applications.
 *
 * This handler intercepts requests to `/api/unblind` and proxies them to the Unblind API,
 * automatically adding authentication and tenant context. Returns `undefined` for requests
 * that don't match the path prefix, allowing Next.js to continue normal routing.
 *
 * @param extractTenantId - A function that receives the incoming request and returns a tenant ID string (or undefined)
 *
 * @returns An async request handler that proxies matching requests to the Unblind API
 *
 * @example
 * // Usage as Proxy (Next.js 16+, proxy.ts)
 * import { handler } from "@unblind/nextjs/server";
 *
 * export const proxy = handler((req) => req.cookies.get("userId")?.value);
 *
 * export const config = {
 *   matcher: "/api/unblind/:path*",
 * };
 *
 * @example
 * // Usage in Middleware (Next.js <16, middleware.ts)
 * import { unblindProxy } from "@unblind/nextjs/server";
 * import { NextRequest, NextResponse } from "next/server";
 *
 * export async function middleware(request: NextRequest) {
 *   if (request.nextUrl.pathname.startsWith("/api/unblind")) {
 *     const response = await unblindProxy((req) => req.cookies.get("userId")?.value);
 *     if (response) return response;
 *   }
 *
 *   return NextResponse.next();
 * }
 *
 * export const config = {
 *   matcher: ["/api/unblind/:path*"],
 * };
 */
export function proxy(
  extractTenantId: (
    request: NextRequest,
  ) => string | undefined | Promise<string | undefined>,
): NextProxy {
  return async (request: NextRequest) => {
    if (!request.nextUrl.pathname.startsWith(UNBLIND_PATH_PREFIX)) {
      return NextResponse.next();
    }

    if (!UNBLIND_API_KEY) {
      console.error("UNBLIND_API_KEY is missing");
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }

    const tenantId = await extractTenantId(request);

    try {
      // Tenant requests use a different path
      if (!tenantId && request.nextUrl.pathname.includes("/tenants/")) {
        console.error("[Unblind] Unauthorized request (missing tenantId):", {
          path: request.nextUrl.pathname,
        });

        return NextResponse.json(
          { error: "Internal Server Error" },
          { status: 500 },
        );
      }

      // Extract the API path (remove the prefix)
      const apiPath = request.nextUrl.pathname
        .replace(new RegExp(`^${UNBLIND_PATH_PREFIX}`), "")
        .replace(new RegExp("^\/tenants\/"), "/tenants/" + tenantId + "/");
      const url = new URL(`${UNBLIND_API_ENDPOINT}${apiPath}`);

      request.nextUrl.searchParams.forEach((value: string, key: string) => {
        url.searchParams.append(key, value);
      });

      const headers: HeadersInit = {
        Authorization: `Bearer ${UNBLIND_API_KEY}`,
      };

      // Forward Content-Type for requests with body
      if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
        const contentType = request.headers.get("content-type");
        if (contentType) {
          headers["Content-Type"] = contentType;
        }
      }

      const options: RequestInit = {
        method: request.method,
        headers,
      };

      if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
        const body = await request.text();
        if (body) {
          options.body = body;
        }
      }

      const response = await fetch(url.toString(), options);
      const data = await response.text();

      return new NextResponse(data, {
        status: response.status,
        headers: {
          "Content-Type":
            response.headers.get("content-type") || "application/json",
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[Unblind]", message);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }
  };
}

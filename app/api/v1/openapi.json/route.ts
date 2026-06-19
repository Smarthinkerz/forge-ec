import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
const spec = {
  openapi: "3.0.3",
  info: { title: "ForgeEC API", version: "1.0.0", description: "Public API for ForgeEC. Authenticate with a Bearer API key (Settings → API)." },
  servers: [{ url: "/api/v1" }],
  components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } } },
  security: [{ bearerAuth: [] }],
  paths: {
    "/health": { get: { summary: "Health check", responses: { "200": { description: "OK" } } } },
    "/campaigns": { get: { summary: "List campaigns", responses: { "200": { description: "Campaigns" }, "429": { description: "Rate limited" } } } },
    "/sustainability": { post: {
      summary: "Score campaign delivery carbon",
      requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { channel: { type: "string" }, impressions: { type: "number" }, conversions: { type: "number" } }, required: ["channel", "impressions", "conversions"] } } } },
      responses: { "200": { description: "Sustainability score" }, "422": { description: "Validation error" } } } },
  },
};
export async function GET() { return NextResponse.json(spec); }

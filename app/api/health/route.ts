export const runtime = "edge";

export function GET() {
  return Response.json({
    ok: true,
    time: new Date().toISOString(),
    service: "CastLens Translator",
  });
}

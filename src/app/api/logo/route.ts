import { getProfile, requireUser } from "@/lib/dal";

export async function GET() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const match = profile.logoDataUrl?.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
  if (!match) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(Buffer.from(match[2], "base64")), {
    headers: {
      "Content-Type": match[1],
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}

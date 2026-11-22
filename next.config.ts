import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

// next/image only loads remote images from hosts listed here.
// We allow this project's public Supabase Storage buckets and Unsplash (demo seed images).
const remotePatterns: RemotePattern[] = [
  // Object form without `search`: the demo image URLs carry Unsplash sizing
  // parameters (?w=1200&q=80...), which a URL pattern would reject.
  { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;
if (supabaseUrl) {
  remotePatterns.push(new URL(`${supabaseUrl.origin}/storage/v1/object/public/**`));
}

// Next.js refuses to optimize images from local IPs. That is only relaxed when
// Supabase itself runs on this machine (`supabase start`), never for a hosted project.
const isLocalSupabase = ["127.0.0.1", "localhost"].includes(supabaseUrl?.hostname ?? "");

const nextConfig: NextConfig = {
  images: { remotePatterns, dangerouslyAllowLocalIP: isLocalSupabase },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;

import type { Metadata } from "next";

const baseUrl = "https://fp.deessejs.com";

export function createMetadata(override: Metadata): Metadata {
  return {
    ...override,
    openGraph: {
      type: "website",
      siteName: "@deessejs/fp",
      ...override.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      creator: "@nesalia_inc",
      ...override.twitter,
    },
  };
}

export { baseUrl };

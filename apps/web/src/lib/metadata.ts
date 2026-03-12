import type { Metadata } from "next";

const baseUrl = "https://core.deessejs.com";

export function createMetadata(override: Metadata): Metadata {
  return {
    ...override,
    openGraph: {
      type: "website",
      siteName: "DeesseJS Core",
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

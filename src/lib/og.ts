import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const interRegular = readFileSync(
  join(process.cwd(), "src/assets/fonts/Inter-Regular.ttf")
);
const interBold = readFileSync(
  join(process.cwd(), "src/assets/fonts/Inter-Bold.ttf")
);

interface OgImageOptions {
  title: string;
  description?: string;
  type?: string;
}

export async function generateOgImage({
  title,
  description,
  type,
}: OgImageOptions): Promise<Buffer> {
  // Truncate long titles/descriptions
  const displayTitle =
    title.length > 70 ? title.slice(0, 67) + "..." : title;
  const displayDesc = description
    ? description.length > 140
      ? description.slice(0, 137) + "..."
      : description
    : undefined;

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#000000",
          padding: "60px",
          fontFamily: "Inter",
          position: "relative",
        },
        children: [
          // Gold left accent bar
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                left: "0",
                top: "0",
                bottom: "0",
                width: "6px",
                backgroundColor: "#C9A04A",
              },
            },
          },
          // Top: type badge
          type
            ? {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    marginBottom: "24px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#C9A04A",
                          textTransform: "uppercase" as const,
                          letterSpacing: "0.15em",
                          border: "1px solid rgba(201, 160, 74, 0.3)",
                          borderRadius: "6px",
                          padding: "4px 12px",
                        },
                        children: type,
                      },
                    },
                  ],
                },
              }
            : null,
          // Title
          {
            type: "div",
            props: {
              style: {
                fontSize: title.length > 40 ? "42px" : "52px",
                fontWeight: 700,
                color: "#fafafa",
                lineHeight: 1.15,
                marginBottom: "20px",
                flexGrow: 1,
                display: "flex",
                alignItems: "flex-start",
              },
              children: displayTitle,
            },
          },
          // Description
          displayDesc
            ? {
                type: "div",
                props: {
                  style: {
                    fontSize: "20px",
                    fontWeight: 400,
                    color: "#888888",
                    lineHeight: 1.5,
                    marginBottom: "40px",
                  },
                  children: displayDesc,
                },
              }
            : null,
          // Bottom bar: site name
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid #222222",
                paddingTop: "20px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#C9A04A",
                      letterSpacing: "0.02em",
                    },
                    children: "tubhyam.dev",
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: "14px",
                      fontWeight: 400,
                      color: "#555555",
                    },
                    children: "Tubhyam Karthikeyan",
                  },
                },
              ],
            },
          },
        ].filter(Boolean),
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: interRegular,
          weight: 400,
          style: "normal" as const,
        },
        {
          name: "Inter",
          data: interBold,
          weight: 700,
          style: "normal" as const,
        },
      ],
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
  });

  return Buffer.from(resvg.render().asPng());
}

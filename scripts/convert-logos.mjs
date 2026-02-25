import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "node:fs";

const logos = [
  { input: "public/latent-chemistry-square.svg", output: "public/latent-chemistry-square.png", width: 1000 },
  { input: "public/latent-chemistry-logo-light.svg", output: "public/latent-chemistry-logo-light.png", width: 400 },
];

for (const { input, output, width } of logos) {
  const svg = readFileSync(input, "utf-8");
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: width } });
  writeFileSync(output, resvg.render().asPng());
  console.log(`Created ${output}`);
}

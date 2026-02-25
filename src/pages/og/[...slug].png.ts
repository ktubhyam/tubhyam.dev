import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { generateOgImage } from "@lib/og";

export const getStaticPaths: GetStaticPaths = async () => {
  const blogs = await getCollection("blog");
  const projects = await getCollection("projects");
  const research = await getCollection("research");
  const simulations = await getCollection("simulations");

  const paths = [
    ...blogs
      .filter((p) => !p.data.draft)
      .map((p) => ({
        params: { slug: `blog/${p.id}` },
        props: { title: p.data.title, description: p.data.description, type: "Blog", publication: true },
      })),
    ...projects.map((p) => ({
      params: { slug: `projects/${p.id}` },
      props: { title: p.data.title, description: p.data.description, type: "Project", publication: false },
    })),
    ...research.map((p) => ({
      params: { slug: `research/${p.id}` },
      props: { title: p.data.title, description: p.data.abstract, type: "Research", publication: true },
    })),
    ...simulations.map((p) => ({
      params: { slug: `simulations/${p.id}` },
      props: { title: p.data.title, description: p.data.description, type: "Simulation" },
    })),
  ];

  return paths;
};

export const GET: APIRoute = async ({ props }) => {
  const { title, description, type, publication } = props as {
    title: string;
    description?: string;
    type: string;
    publication?: boolean;
  };

  const png = await generateOgImage({ title, description, type, publication });

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};

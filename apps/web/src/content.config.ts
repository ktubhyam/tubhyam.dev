import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/blog" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    cover: z.string().optional(),
    aiSummary: z.string().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/projects" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    status: z.enum(["active", "completed", "archived"]).default("active"),
    github: z.string().url().optional(),
    demo: z.string().url().optional(),
    cover: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

const simulations = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/simulations" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
    physics: z.array(z.string()).default([]),
    preview: z.string().optional(),
    component: z.string(),
    launch: z.string().url().optional(),
  }),
});

const research = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/research" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    authors: z.array(z.string()),
    venue: z.string(),
    status: z.enum(["published", "preprint", "in-progress"]).default("in-progress"),
    abstract: z.string(),
    pdf: z.string().url().optional(),
    arxiv: z.string().url().optional(),
    doi: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

const libraries = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/libraries" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    language: z.enum(["python", "typescript", "rust"]),
    github: z.string().url(),
    pypi: z.string().optional(),
    npm: z.string().optional(),
    docs: z.string().url().optional(),
    status: z.enum(["alpha", "beta", "stable"]).default("alpha"),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog, projects, simulations, research, libraries };

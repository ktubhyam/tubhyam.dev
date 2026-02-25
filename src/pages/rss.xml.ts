import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE } from "@lib/constants";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const posts = (await getCollection("blog"))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const research = (await getCollection("research"))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    language: "en",
    items: [
      ...posts.map((post) => ({
        title: post.data.title,
        pubDate: post.data.date,
        description: post.data.description,
        link: `/blog/${post.id}/`,
        categories: post.data.tags,
        author: SITE.author,
        content: post.data.description,
      })),
      ...research.map((paper) => ({
        title: paper.data.title,
        pubDate: paper.data.date,
        description: paper.data.abstract,
        link: `/research/${paper.id}/`,
        categories: paper.data.tags,
        author: paper.data.authors.join(", "),
        content: paper.data.abstract,
      })),
    ],
  });
}

import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getProjectPage } from "~/server/projects.server";

export const getProject = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().regex(/^[a-z0-9.-]+$/) }))
  .handler(({ data }) => {
    const project = getProjectPage(data.slug);
    if (!project) throw notFound();
    return project;
  });

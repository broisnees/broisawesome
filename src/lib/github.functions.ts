import { createServerFn } from "@tanstack/react-start";
import { fetchStars } from "~/server/github.server";
import { PROJECTS, repoOf } from "./site";

/** Small counts read as noise, so only repos above this show a number. */
const MIN_STARS = 30;

/** GitHub stars worth showing, keyed by `owner/name`. Needs GITHUB_TOKEN. */
export const getStars = createServerFn({ method: "GET" }).handler(async () => {
  const stars = await fetchStars(
    PROJECTS.flatMap((item) => repoOf(item) ?? []),
  );
  return Object.fromEntries(
    Object.entries(stars).filter(([, count]) => count > MIN_STARS),
  );
});

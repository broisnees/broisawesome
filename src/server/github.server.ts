import { env } from "cloudflare:workers";

type Stars = Record<string, number>;

const TTL = 60 * 60 * 1000;
let cache: { at: number; stars: Stars } | undefined;

/** Star counts for `owner/name` repos in one GraphQL call, cached per isolate for an hour. */
export async function fetchStars(repos: string[]): Promise<Stars> {
  if (cache && Date.now() - cache.at < TTL) return cache.stars;

  const token = env.GITHUB_TOKEN;
  if (!token) return {};

  const fields = repos
    .map((repo, i) => {
      const [owner, name] = repo.split("/");
      return `r${i}: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) { stargazerCount }`;
    })
    .join("\n");

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "nischal-dahal.com.np",
    },
    body: JSON.stringify({ query: `{ ${fields} }` }),
  });
  if (!res.ok) return {};

  // Private or renamed repos come back as null; skip them.
  const body = (await res.json()) as {
    data?: Record<string, { stargazerCount: number } | null>;
  };
  const stars: Stars = {};
  repos.forEach((repo, i) => {
    const count = body.data?.[`r${i}`]?.stargazerCount;
    if (typeof count === "number") stars[repo] = count;
  });

  cache = { at: Date.now(), stars };
  return stars;
}

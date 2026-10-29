import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";

export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

const themeSchema = z.enum(THEMES);

/** The visitor's saved choice. Read on the server so the first paint is already right. */
export const getTheme = createServerFn({ method: "GET" }).handler(() =>
  themeSchema.catch("system").parse(getCookie("theme")),
);

export const setTheme = createServerFn({ method: "POST" })
  .validator(themeSchema)
  .handler(({ data }) => {
    setCookie("theme", data, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: true,
      secure: import.meta.env.PROD,
    });
  });

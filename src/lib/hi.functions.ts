import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseStatus } from "@tanstack/react-start/server";
import { deliverHi } from "~/server/hi.server";
import { type HiResult, hiSchema } from "./hi";

/** The Say hi popover's send. */
export const sayHi = createServerFn({ method: "POST" })
  .validator(hiSchema)
  .handler(async ({ data }): Promise<HiResult> => {
    const result = await deliverHi(data, getRequest(), "site");
    if (result.ok) return result;
    setResponseStatus(result.status);
    return { ok: false, error: result.error };
  });

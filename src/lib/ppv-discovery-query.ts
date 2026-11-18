import { queryOptions } from "@tanstack/react-query";
import { getPublicPpvEvents } from "./ppv.functions";

export const publicPpvEventsQuery = queryOptions({ queryKey: ["public-ppv-events"], queryFn: () => getPublicPpvEvents(), staleTime: 0, refetchInterval: 30_000 });
export type PublicPpvEvent = Awaited<ReturnType<typeof getPublicPpvEvents>>[number];
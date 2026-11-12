import { z } from "zod";

/** Only the fields we use from Deezer's public API; unknown keys are stripped. */
export const deezerTrackSchema = z.object({
  id: z.number(),
  title: z.string(),
  duration: z.number().nonnegative(),
  link: z.url(),
  preview: z.url().or(z.literal("")),
  artist: z.object({
    id: z.number(),
    name: z.string(),
    link: z.url().nullish(),
    picture_small: z.url().nullish(),
    picture_medium: z.url().nullish(),
    picture_xl: z.url().nullish(),
  }),
  album: z.object({
    title: z.string().nullish(),
    cover_small: z.url().nullish(),
    cover_medium: z.url().nullish(),
    cover_xl: z.url().nullish(),
  }),
});

export type DeezerTrack = z.infer<typeof deezerTrackSchema>;

/** Deezer reports errors with HTTP 200 and an `error` object. */
export const deezerErrorSchema = z.object({
  error: z.object({
    type: z.string().optional(),
    message: z.string().optional(),
    code: z.number().optional(),
  }),
});

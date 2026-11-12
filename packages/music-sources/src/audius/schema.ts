import { z } from "zod";

/** Only the fields we use; unknown keys are stripped. */
const squareArtwork = z
  .object({
    "150x150": z.url().nullish(),
    "480x480": z.url().nullish(),
    "1000x1000": z.url().nullish(),
  })
  .nullish();

const count = z.number().int().nonnegative().nullish();

export const audiusUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  handle: z.string(),
  is_verified: z.boolean().nullish(),
  bio: z.string().nullish(),
  location: z.string().nullish(),
  follower_count: count,
  followee_count: count,
  track_count: count,
  profile_picture: squareArtwork,
  cover_photo: z.object({ "640x": z.url().nullish(), "2000x": z.url().nullish() }).nullish(),
});

export const audiusTrackSchema = z.object({
  id: z.string(),
  title: z.string(),
  duration: z.number().nonnegative(),
  genre: z.string().nullish(),
  mood: z.string().nullish(),
  permalink: z.string().nullish(),
  description: z.string().nullish(),
  tags: z.string().nullish(),
  release_date: z.string().nullish(),
  bpm: z.number().nullish(),
  musical_key: z.string().nullish(),
  play_count: count,
  favorite_count: count,
  repost_count: count,
  is_streamable: z.boolean().nullish(),
  access: z.object({ stream: z.boolean() }).partial().nullish(),
  artwork: squareArtwork,
  user: audiusUserSchema,
});

export type AudiusTrack = z.infer<typeof audiusTrackSchema>;
export type AudiusUser = z.infer<typeof audiusUserSchema>;

export const audiusListSchema = z.object({ data: z.array(audiusTrackSchema) });
export const audiusSingleSchema = z.object({ data: audiusTrackSchema });
export const audiusUserListSchema = z.object({ data: z.array(audiusUserSchema) });
export const audiusUserSingleSchema = z.object({ data: audiusUserSchema });
export const audiusHostsSchema = z.object({ data: z.array(z.url()).min(1) });

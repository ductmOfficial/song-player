/**
 * Deterministic Audius API responses for E2E tests and offline development.
 * Shapes mirror the real API (only the fields we read, plus a few extras to
 * prove unknown keys are ignored). Artwork is inline SVG, so no network.
 */
const cover = (a: string, b: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="10" height="10" fill="url(#g)"/></svg>`,
  )}`;

const art = (a: string, b: string) => {
  const src = cover(a, b);
  return { "150x150": src, "480x480": src, "1000x1000": src };
};

export const users = {
  linh: {
    id: "u-linh",
    name: "Linh Hà",
    handle: "linhha",
    is_verified: true,
    bio: "Ambient và lo-fi thu âm ở Hội An.",
    location: "Hội An",
    follower_count: 12840,
    followee_count: 210,
    track_count: 3,
    profile_picture: art("#f0a35e", "#6b2d5c"),
    cover_photo: { "640x": cover("#1d3557", "#e76f51"), "2000x": cover("#1d3557", "#e76f51") },
    wallet: "0xmock",
  },
  minh: {
    id: "u-minh",
    name: "Minh Đỗ",
    handle: "minhdo",
    is_verified: false,
    bio: null,
    location: "Sài Gòn",
    follower_count: 930,
    followee_count: 88,
    track_count: 2,
    profile_picture: art("#4cc9f0", "#3a0ca3"),
    cover_photo: null,
  },
};

type User = (typeof users)[keyof typeof users];

const track = (
  id: string,
  title: string,
  user: User,
  duration: number,
  genre: string,
  colors: [string, string],
  extra: Record<string, unknown> = {},
) => ({
  id,
  title,
  duration,
  genre,
  mood: "Peaceful",
  permalink: `/${user.handle}/${id}`,
  description: `${title}. Bản thu mẫu cho kiểm thử.`,
  tags: "ambient,lofi,night",
  release_date: "2026-10-01T00:00:00Z",
  bpm: 84,
  musical_key: "D minor",
  play_count: 4200 - Number(id.replace(/\D/g, "")) * 300,
  favorite_count: 320,
  repost_count: 41,
  is_streamable: true,
  access: { stream: true, download: false },
  artwork: art(...colors),
  user,
  ...extra,
});

export const tracks = [
  track("t1", "Thủy triều xanh", users.linh, 184, "Ambient", ["#2a9d8f", "#264653"]),
  track("t2", "Mưa trên mái ngói", users.linh, 212, "Lo-Fi", ["#e9c46a", "#f4a261"]),
  track("t3", "Đèn đường lúc hai giờ", users.minh, 199, "Downtempo", ["#9d4edd", "#240046"]),
  track("t4", "Sóng ngầm", users.minh, 241, "House", ["#ef476f", "#073b4c"]),
  track("t5", "Bản nháp chưa phát hành", users.linh, 150, "Ambient", ["#adb5bd", "#495057"], {
    access: { stream: false },
  }),
  track("t6", "Ga cuối", users.minh, 176, "Acoustic", ["#06d6a0", "#118ab2"]),
];

/** Deezer chart entries (public API shape). Previews point at a host E2E intercepts. */
const dz = (
  id: number,
  title: string,
  artist: string,
  colors: [string, string],
  preview = true,
) => {
  const src = cover(...colors);
  return {
    id,
    title,
    title_short: title,
    duration: 200,
    rank: 900000 - id,
    link: `https://www.deezer.com/track/${String(id)}`,
    preview: preview ? `https://cdnt-preview.dzcdn.net/mock/${String(id)}.mp3` : "",
    artist: {
      id: id * 10,
      name: artist,
      link: `https://www.deezer.com/artist/${String(id * 10)}`,
      picture_small: src,
    },
    album: { title, cover_small: src, cover_medium: src, cover_xl: src },
    type: "track",
  };
};

export const deezerChart = [
  dz(101, "Ánh đèn thành phố", "Nghệ sĩ Một", ["#ffb703", "#fb8500"]),
  dz(102, "Midnight Ferry", "Second Artist", ["#8ecae6", "#023047"]),
  dz(103, "Không có bản nghe thử", "Nghệ sĩ Ba", ["#ccd5ae", "#606c38"], false),
];

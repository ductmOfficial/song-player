import { http, HttpResponse } from "msw";
import { deezerChart, tracks, users } from "./fixtures";

const API = "https://api.audius.co";
const DEEZER = "https://api.deezer.com";
const allUsers = Object.values(users);

const byQuery = (q: string | null) => {
  const needle = (q ?? "").toLowerCase();
  return (s: string) => s.toLowerCase().includes(needle);
};

/** Server-side Audius and Deezer endpoints used by Sóng. The browser-side stream is mocked in E2E (page.route). */
export const handlers = [
  http.get(API, () => HttpResponse.json({ data: [API] })),

  http.get(`${API}/v1/tracks/trending`, ({ request }) => {
    const genre = new URL(request.url).searchParams.get("genre");
    return HttpResponse.json({ data: genre ? tracks.filter((t) => t.genre === genre) : tracks });
  }),

  http.get(`${API}/v1/tracks/search`, ({ request }) => {
    const match = byQuery(new URL(request.url).searchParams.get("query"));
    return HttpResponse.json({
      data: tracks.filter((t) => match(t.title) || match(t.genre) || match(t.user.name)),
    });
  }),

  http.get(`${API}/v1/users/search`, ({ request }) => {
    const match = byQuery(new URL(request.url).searchParams.get("query"));
    return HttpResponse.json({ data: allUsers.filter((u) => match(u.name) || match(u.handle)) });
  }),

  http.get(`${API}/v1/users/handle/:handle`, ({ params }) => {
    const user = allUsers.find((u) => u.handle === params.handle);
    return user ? HttpResponse.json({ data: user }) : HttpResponse.json({}, { status: 404 });
  }),

  http.get(`${API}/v1/users/:id/tracks`, ({ params, request }) => {
    const sort = new URL(request.url).searchParams.get("sort");
    const own = tracks.filter((t) => t.user.id === params.id);
    const data = sort === "plays" ? [...own].sort((a, b) => b.play_count - a.play_count) : own;
    return HttpResponse.json({ data });
  }),

  http.get(`${DEEZER}/chart/0/tracks`, () =>
    HttpResponse.json({ data: deezerChart, total: deezerChart.length }),
  ),

  http.get(`${DEEZER}/track/:id`, ({ params }) => {
    const t = deezerChart.find((x) => String(x.id) === params.id);
    // Deezer answers unknown ids with HTTP 200 and an error object.
    return HttpResponse.json(
      t ?? { error: { type: "DataException", message: "no data", code: 800 } },
    );
  }),

  http.get(`${API}/v1/tracks/:id`, ({ params }) => {
    const t = tracks.find((x) => x.id === params.id);
    return t ? HttpResponse.json({ data: t }) : HttpResponse.json({}, { status: 404 });
  }),
];

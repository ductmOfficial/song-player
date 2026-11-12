/**
 * AUDIUS_MOCK=1 answers Audius API calls from fixtures (src/mocks): offline
 * development and deterministic E2E runs. Never enabled in production builds.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.AUDIUS_MOCK === "1") {
    const { server } = await import("./mocks/node");
    server.listen({ onUnhandledFrame: "bypass" });
    console.info("[mocks] Audius API is mocked (AUDIUS_MOCK=1)");
  }
}

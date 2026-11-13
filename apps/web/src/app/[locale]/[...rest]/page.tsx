import { notFound } from "next/navigation";

/**
 * Paths that match no page under a locale render the localized not-found page, inside the
 * app's layout. Without this route Next.js falls back to its default, unstyled 404.
 */
export default function UnknownPage() {
  notFound();
}

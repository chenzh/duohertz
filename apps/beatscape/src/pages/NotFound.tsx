import { Link } from "../router";
import { NOT_FOUND_PAGE_META, usePageMeta } from "../seo/pageMeta";

export function NotFoundPage() {
  usePageMeta(NOT_FOUND_PAGE_META);

  return (
    <section className="not-found">
      <h1>Page not found</h1>
      <p>The page you requested does not exist.</p>
      <Link className="btn primary" to="/">
        Back to Home
      </Link>
    </section>
  );
}

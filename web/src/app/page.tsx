import HomePage from "./HomePage";
import { getSiteContent } from "@/lib/siteContent";
import { getWebCatalog } from "@/lib/webCatalog";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [content, catalog] = await Promise.all([getSiteContent(), getWebCatalog()]);
  return <HomePage content={content} catalog={catalog} />;
}

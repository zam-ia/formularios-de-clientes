import HomePage from "./HomePage";
import { getSiteContent } from "@/lib/siteContent";

export const dynamic = "force-dynamic";

export default async function Page() {
  return <HomePage content={await getSiteContent()} />;
}

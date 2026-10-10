import Portfolio from "@/components/Portfolio";
import { getContent } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  return <Portfolio content={await getContent()} />;
}

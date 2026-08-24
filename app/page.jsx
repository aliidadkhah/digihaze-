import HomeContent from "@/components/HomeContent";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

export const metadata = {
  title: `${SITE_NAME} | فروشگاه پاد، سالت و کارتریج`,
  description: SITE_DESCRIPTION,
};

export default function HomePage() {
  return <HomeContent />;
}

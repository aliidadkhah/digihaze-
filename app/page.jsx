import HomeContent from "@/components/HomeContent";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

export const metadata = {
  title: `${SITE_NAME} | فروشگاه مایع ویپ، دستگاه ویپ و پاد اورجینال`,
  description: SITE_DESCRIPTION,
};

export default function HomePage() {
  return <HomeContent />;
}

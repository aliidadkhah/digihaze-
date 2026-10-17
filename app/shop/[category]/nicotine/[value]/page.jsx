import {
  buildTaxonomyMetadata,
  TaxonomyPageBody,
} from "@/lib/taxonomyPage";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { category, value } = await params;
  return buildTaxonomyMetadata(category, "nicotine", value);
}

export default async function Page({ params }) {
  const { category, value } = await params;

  return (
    <TaxonomyPageBody rawCategory={category} type="nicotine" value={value} />
  );
}

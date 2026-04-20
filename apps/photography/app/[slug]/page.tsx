import { notFound } from "next/navigation";
import { categories } from "@/lib/gallery-data";
import CategoryGallery from "@/components/CategoryGallery";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return categories.map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};
  return {
    title: category.title,
    description: category.description,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  return <CategoryGallery category={category} allCategories={categories} />;
}

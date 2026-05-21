import { notFound } from "next/navigation";
import CalculatorTool from "@/components/CalculatorTool";
import { CALCULATORS, getCalculator } from "@/lib/calculators";

export function generateStaticParams() {
  return CALCULATORS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const calc = getCalculator(slug);
  return {
    title: calc ? `${calc.title} berekenen | Bureau Wijnschenk` : "Calculator",
    description: calc?.description,
  };
}

export default async function CalculatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const calc = getCalculator(slug);
  if (!calc) notFound();
  return <CalculatorTool slug={slug} />;
}

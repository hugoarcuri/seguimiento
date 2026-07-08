import { DiscipuloDetailWrapper } from "./wrapper";

export default function DiscipuloDetailPage() {
  return <DiscipuloDetailWrapper />;
}

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

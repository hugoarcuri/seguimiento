import { EditarDiscipuloWrapper } from "./wrapper";

export default function EditarDiscipuloPage() {
  return <EditarDiscipuloWrapper />;
}

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

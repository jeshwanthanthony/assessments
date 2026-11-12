import { DocumentList } from "@/components/DocumentList";

export const metadata = { title: "Shared with me · DocSpace" };
export default function SharedWithMe() {
  return <DocumentList scope="shared" />;
}

declare module "*.mdx" {
  import { MDXContent } from "mdx/types";
  import { CaseMetadata } from "@/components/apps/CaseViewer";

  const MDXComponent: MDXContent;
  export default MDXComponent;
  export const metadata: CaseMetadata;
}

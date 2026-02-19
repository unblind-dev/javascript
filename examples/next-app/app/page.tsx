import { ComponentExample } from "@/components/component-example";
import { UnblindProvider } from "@unblind/nextjs";

export default function Page() {
  return (
    <UnblindProvider>
      <ComponentExample />
    </UnblindProvider>
  );
}

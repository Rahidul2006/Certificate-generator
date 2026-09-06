import { Suspense } from "react";
import { CertificateEditor } from "@/components/editor/certificate-editor";

export default function NewTemplatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-sm text-muted-foreground">
          Loading certificate studio...
        </div>
      }
    >
      <CertificateEditor />
    </Suspense>
  );
}

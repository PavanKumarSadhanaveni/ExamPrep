import ResultsDisplayClient from "@/components/app/ResultsDisplayClient";
import { Suspense } from "react";
import LoadingDots from "@/components/app/LoadingDots";

export default function ResultsPage() {
  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<LoadingDots text="Loading results..." />}>
        <ResultsDisplayClient />
      </Suspense>
    </div>
  );
}

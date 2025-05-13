import ExamDetailsDisplay from "@/components/app/ExamDetailsDisplay";
import { Suspense } from "react";
import LoadingDots from "@/components/app/LoadingDots";

export default function ExamDetailsPage() {
  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<LoadingDots text="Loading exam details..." />}>
        <ExamDetailsDisplay />
      </Suspense>
    </div>
  );
}

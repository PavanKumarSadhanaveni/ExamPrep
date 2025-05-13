import TestInterfaceClient from "@/components/app/TestInterfaceClient";
import SectionNavigation from "@/components/app/SectionNavigation";
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { Suspense } from "react";
import LoadingDots from "@/components/app/LoadingDots";

export default function TestPage() {
  return (
    <SidebarProvider defaultOpen={true} collapsible="icon">
      <Sidebar variant="sidebar" side="left" className="border-r h-full fixed top-16 bottom-0 left-0 z-30 md:w-64">
         {/* Adjust top value based on header height */}
        <SectionNavigation />
      </Sidebar>
      <SidebarInset>
        <div className="min-h-[calc(100vh-4rem)]"> {/* Adjust based on header/footer height */}
          <Suspense fallback={<LoadingDots text="Loading test interface..." />}>
            <TestInterfaceClient />
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

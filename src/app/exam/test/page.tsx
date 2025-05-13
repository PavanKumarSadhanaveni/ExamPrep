import TestInterfaceClient from "@/components/app/TestInterfaceClient";
import SectionNavigation from "@/components/app/SectionNavigation";
import { SidebarProvider, Sidebar, SidebarInset, type SidebarCollapsibleMode } from '@/components/ui/sidebar'; // Import type
import { Suspense } from "react";
import LoadingDots from "@/components/app/LoadingDots";

export default function TestPage() {
  const collapsibleMode: SidebarCollapsibleMode = "icon"; // Define collapsible mode

  return (
    <SidebarProvider defaultOpen={true} collapsible={collapsibleMode} side="left">
      <Sidebar>
        {/* Adjust top value based on header height if your header is globally fixed.
            The sidebar itself is h-svh (screen vertical height) */}
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

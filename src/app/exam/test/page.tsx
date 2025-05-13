import TestInterfaceClient from "@/components/app/TestInterfaceClient";
// import SectionNavigation from "@/components/app/SectionNavigation"; // Old navigator
import SectionQuestionNavigator from "@/components/app/SectionQuestionNavigator"; // New navigator
import { SidebarProvider, Sidebar, SidebarInset, type SidebarCollapsibleMode } from '@/components/ui/sidebar'; 
import { Suspense } from "react";
import LoadingDots from "@/components/app/LoadingDots";

export default function TestPage() {
  const collapsibleMode: SidebarCollapsibleMode = "icon"; 

  return (
    <SidebarProvider defaultOpen={true} collapsible={collapsibleMode} side="left">
      <Sidebar>
        <SectionQuestionNavigator /> {/* Use the new navigator */}
      </Sidebar>
      <SidebarInset>
        <div className="min-h-[calc(100vh-4rem)]"> 
          <Suspense fallback={<LoadingDots text="Loading test interface..." />}>
            <TestInterfaceClient />
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
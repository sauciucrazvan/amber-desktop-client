import { Sidebar, SidebarContent, useSidebar } from "../ui/sidebar";
import { useAuth } from "@/features/auth/AuthContext";
import { useResizableSidebar } from "./app-sidebar/index";
import { AppSidebarDataProvider } from "./app-sidebar/index";
import AppSidebarTabs from "./app-sidebar/components/AppSidebarTabs";

export default function AppSidebar() {
  const { isAuthenticated } = useAuth();
  const { open, isMobile } = useSidebar();

  const {
    sidebarSide,
    tooltipSide,
    tabsDirectionClass,
    railPaddingClass,
    panelChromeClass,
    resizeHandleClass,
    handleResizeStart,
  } = useResizableSidebar();

  if (!isAuthenticated) return <>Unauthorized.</>;
  if (!isMobile && !open) return null;

  return (
    <>
      <Sidebar collapsible="offcanvas" side={sidebarSide} className="relative">
        <SidebarContent className="min-h-0 overflow-hidden">
          <AppSidebarDataProvider>
            <AppSidebarTabs
              tabsDirectionClass={tabsDirectionClass}
              railPaddingClass={railPaddingClass}
              panelChromeClass={panelChromeClass}
              tooltipSide={tooltipSide}
            />
          </AppSidebarDataProvider>
        </SidebarContent>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          onMouseDown={handleResizeStart}
          className={resizeHandleClass}
        />
      </Sidebar>
    </>
  );
}

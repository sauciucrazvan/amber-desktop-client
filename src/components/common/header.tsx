import Settings from "@/views/settings/Settings";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { Home } from "lucide-react";
import { useLocation } from "wouter";
import { ReactNode } from "react";

interface HeaderProps {
  extra?: ReactNode;
}

export default function Header({ extra }: HeaderProps) {
  const [, setLocation] = useLocation();

  const storedSidebarPos = localStorage.getItem("amber.sidebarPos");
  const sidebarSide: "left" | "right" =
    storedSidebarPos === "right" ? "right" : "left";

  return (
    <>
      <header className="min-w-full flex flex-row items-center gap-1 justify-between p-4">
        <section id="left" className="flex flex-row items-center gap-2 h-5">
          {sidebarSide == "left" ? extra : null}
          <Button variant="ghost" onClick={() => setLocation("/")}>
            <Home />
          </Button>
          <Separator orientation="vertical" />
        </section>

        {/* random idea */}
        {/* <section id="center" className="w-full inline-flex items-center gap-1">
                    <div className="w-full px-8 py-3 bg-border/50 text-xs rounded-md inline-flex items-center justify-between gap-2">
                        <p>Michael J.</p> 
                        <div className="inline-flex gap-4 items-center">
                            <Phone size="16" />
                            <Video size="16" />
                        </div>
                    </div>
                </section> */}

        <section id="right" className="flex flex-row items-center gap-2 h-5">
          <Separator orientation="vertical" />
          <Settings minimalViews={false} />
          {sidebarSide == "left" ? null : extra}
        </section>
      </header>
    </>
  );
}

import Settings from "@/views/settings/Settings";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { Home, X } from "lucide-react";
import { useLocation } from "wouter";
import { ReactNode, useState } from "react";
import { Avatar, AvatarFallback } from "../ui/avatar";

interface HeaderProps {
  extra?: ReactNode;
}

export default function Header({ extra }: HeaderProps) {
  const [, setLocation] = useLocation();
  const [openedConversation, setOpenedConversation] = useState(true);

  const storedSidebarPos = localStorage.getItem("amber.sidebarPos");
  const sidebarSide: "left" | "right" =
    storedSidebarPos === "right" ? "right" : "left";

  return (
    <>
      <header className="min-w-full flex flex-row items-center gap-1 justify-between pt-4 px-4">
        <section id="left" className="flex flex-row items-center gap-2 h-5">
          {sidebarSide == "left" ? extra : null}
          <Button variant="ghost" onClick={() => setLocation("/")}>
            <Home />
          </Button>
          <Separator orientation="vertical" />
        </section>

        <section id="center" className="w-full inline-flex items-center gap-1">
          {/* {openedConversation && (
            <div className="w-full px-3 py-0.5 bg-border/50 text-sm rounded-t-md inline-flex items-center justify-between gap-2">
              <div className="inline-flex items-center justify-center gap-1">
                <div className="relative w-fit">
                  <Avatar>
                    <AvatarFallback>MJ</AvatarFallback>
                  </Avatar>
                  <span className="border-background bg-destructive absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2" />
                </div>
                <div className="px-2">
                  <h3>Michael J.</h3>
                  <p className="text-foreground/75">last seen at 10:50 PM</p>
                </div>
              </div>
              <p className="inline-flex items-center gap-1 text-xs">
                <Button
                  variant="link"
                  size="icon-sm"
                  className="cursor-pointer"
                  onClick={() => setOpenedConversation(false)}
                >
                  <X size="12" />
                </Button>
              </p>
            </div>
          )} */}
        </section>

        <section id="right" className="flex flex-row items-center gap-2 h-5">
          <Separator orientation="vertical" />
          <Settings minimalViews={false} />
          {sidebarSide == "left" ? null : extra}
        </section>
      </header>
    </>
  );
}

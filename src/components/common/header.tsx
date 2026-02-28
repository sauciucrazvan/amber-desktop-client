import Settings from "@/views/settings/Settings";
import { Separator } from "../ui/separator";
import { ReactNode } from "react";

interface HeaderProps {
  extra?: ReactNode;
}

export default function Header({ extra }: HeaderProps) {
  const storedSidebarPos = localStorage.getItem("amber.sidebarPos");
  const sidebarSide: "left" | "right" =
    storedSidebarPos === "right" ? "right" : "left";

  return (
    <>
      <header className="min-w-full flex flex-row items-center gap-1 justify-between pt-4 px-4">
        <section id="left" className="flex flex-row items-center gap-2 h-5">
          {sidebarSide == "left" ? extra : null}
          <Separator orientation="vertical" />
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

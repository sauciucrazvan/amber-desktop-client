import { Minus, Square, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type PlatformName = NodeJS.Platform;

function inferPlatform(): PlatformName {
  const value = navigator.platform.toLowerCase();
  if (value.includes("mac")) return "darwin";
  if (value.includes("linux")) return "linux";
  return "win32";
}

export default function Titlebar() {
  const [platform, setPlatform] = useState<PlatformName>(() => inferPlatform());

  useEffect(() => {
    let isMounted = true;

    window.windowControls
      .getPlatform()
      .then((nextPlatform) => {
        if (isMounted) setPlatform(nextPlatform);
      })
      .catch(() => {
        if (isMounted) setPlatform(inferPlatform());
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const controlsOnLeft = useMemo(() => platform === "darwin", [platform]);

  const controls = (
    <div className="flex items-center gap-1 [-webkit-app-region:no-drag]">
      <button
        type="button"
        aria-label="Minimize window"
        className="inline-flex h-7 w-8 items-center justify-center rounded-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        onClick={() => window.windowControls.minimize()}
      >
        <Minus className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Maximize window"
        className="inline-flex h-7 w-8 items-center justify-center rounded-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        onClick={() => window.windowControls.toggleMaximize()}
      >
        <Square className="size-3.5" />
      </button>
      <button
        type="button"
        aria-label="Close window"
        className="inline-flex h-7 w-8 items-center justify-center rounded-sm text-sidebar-foreground/80 hover:bg-destructive/20 hover:text-destructive"
        onClick={() => window.windowControls.close()}
      >
        <X className="size-4" />
      </button>
    </div>
  );

  return (
    <header className="bg-sidebar text-sidebar-foreground flex h-10 shrink-0 items-center px-2 select-none [-webkit-app-region:drag]">
      {controlsOnLeft ? controls : null}

      <img
        src={`${import.meta.env.BASE_URL}amber.png`}
        alt="Amber logo"
        className="size-5"
        draggable={false}
      />

      <div className="ml-auto">{controlsOnLeft ? null : controls}</div>
    </header>
  );
}

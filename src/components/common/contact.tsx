import { ShieldBan, Trash } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../ui/context-menu";
import { Avatar, AvatarFallback } from "../ui/avatar";

// Source - https://stackoverflow.com/a
// Posted by Joe Freeman, modified by community. See post 'Timeline' for change history
// Retrieved 2026-01-15, License - CC BY-SA 4.0
const stringToColor = (str: string) => {
  let hash = 0;
  str.split("").forEach((char) => {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
  });
  let colour = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    colour += value.toString(16).padStart(2, "0");
  }
  return colour;
};

export default function Contact({ username }: { username: string }) {
  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <section className="flex flex-row items-center gap-2 cursor-pointer rounded-md hover:bg-background p-1 transition ease-in-out duration-300">
            <Avatar className="w-6 h-6 text-xs">
              <AvatarFallback
                style={
                  username
                    ? {
                        backgroundColor: stringToColor(username),
                      }
                    : undefined
                }
              >
                {username.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-row items-center gap-1">
              <h3 className="text-sm leading-tight">{username}</h3>
            </div>
          </section>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem className="hover:text-red-500">
            <ShieldBan /> Block
          </ContextMenuItem>
          <ContextMenuItem className="hover:text-red-500">
            <Trash /> Remove
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
}

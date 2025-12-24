import { ShieldBan, Trash } from "lucide-react";
import { Avatar, AvatarFallback } from "./avatar";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "./context-menu";

export default function Contact({username} : {username : String}) {
    return (
        <>
            <ContextMenu>
                <ContextMenuTrigger>
                    <section className="flex flex-row items-center gap-2 cursor-pointer rounded-md hover:bg-background p-1 transition ease-in-out duration-300">
                        <Avatar className="w-6 h-6 text-xs">
                            <AvatarFallback>
                                {username.slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-row items-center gap-1">
                            <h3 className="text-sm leading-tight">{username}</h3>
                        </div>
                    </section>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem className="hover:text-red-500"><ShieldBan /> Block</ContextMenuItem>
                    <ContextMenuItem className="hover:text-red-500"><Trash /> Remove</ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
            
        </>
    )
}
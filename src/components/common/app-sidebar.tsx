import { Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import Contact from "../ui/contact";
import { Separator } from "../ui/separator";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupLabel, SidebarMenu, SidebarMenuItem } from "../ui/sidebar";

export default function AppSidebar() {

    const contacts = [
        "Michael J.",
        "John Steel",
        "Freddie Mercury",
        "Lego man",
    ];

    const storedSidebarPos = localStorage.getItem("sidebarPos");
    const sidebarSide: "left" | "right" = storedSidebarPos === "right" ? "right" : "left";

    return (
        <>
            <Sidebar side={sidebarSide}>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Contacts</SidebarGroupLabel>
                        <SidebarGroupAction title="Add Contact" className="cursor-pointer">
                            <Plus /> <span className="sr-only">Add Contact</span>
                        </SidebarGroupAction>
                        <SidebarMenu className="">
                            {contacts.map((contact) => (
                                <SidebarMenuItem>
                                    <Contact username={contact} />
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter className="mb-2 mr-2 mt-0 ml-0 w-full">
                    <Separator />
                    <section className="flex flex-row items-center gap-2 cursor-pointer rounded-md hover:bg-background p-2 transition ease-in-out duration-300">
                        <Avatar>
                            <AvatarFallback>
                                JD
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start gap-1">
                            <h3 className="text-md leading-tight">John Doe</h3>
                            <p className="text-muted-foreground text-xs">Busy</p>
                        </div>
                    </section>
                </SidebarFooter>
            </Sidebar>
        </>
    )

}
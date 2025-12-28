import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsIcon } from "lucide-react";
import AppearanceTab from "./tabs/AppearanceTab";
import AccountTab from "./tabs/AccountTab";
import GeneralTab from "./tabs/GeneralTab";

export default function Settings() {
    return (
        <>
            <Dialog>
                <form>
                    <DialogTrigger asChild>
                        <Button variant="ghost" className="cursor-pointer"><SettingsIcon /></Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-106.25 min-h-100 max-h-100 flex flex-col items-start justify-start">
                        <DialogHeader>
                            <DialogTitle>Settings</DialogTitle>
                            <DialogDescription className="sr-only">Application settings</DialogDescription>
                        </DialogHeader>
                        {/* content */}
                        <Tabs defaultValue="general" className="min-w-full">
                            <TabsList>
                                <TabsTrigger value="general">General</TabsTrigger>
                                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                                <TabsTrigger value="account">Account</TabsTrigger>
                            </TabsList>
                            <TabsContent value="general">
                                <GeneralTab />
                            </TabsContent>
                            <TabsContent value="appearance">
                                <AppearanceTab />
                            </TabsContent>
                            <TabsContent value="account">
                                <AccountTab />
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </form>
            </Dialog>
        </>
    )

}
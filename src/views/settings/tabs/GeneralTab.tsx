import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function GeneralTab() {
    return (
        <>
            <Separator />

            <div className="flex flex-row items-center justify-between gap-1 mt-2">
                <div>
                    <h3 className="text-md text-primary">Help</h3>
                    <p className="text-xs text-muted-foreground">Found an issue or need help with something?</p>
                </div>

                <Button className="cursor-pointer">
                    Support
                </Button>
            </div>

            <div className="flex flex-row items-center justify-between gap-1 mt-2">
                <div>
                    <h3 className="text-md text-primary">Feedback</h3>
                    <p className="text-xs text-muted-foreground">Help us improve</p>
                </div>

                <Button className="cursor-pointer">
                    Feedback
                </Button>
            </div>
        </>
    );
}
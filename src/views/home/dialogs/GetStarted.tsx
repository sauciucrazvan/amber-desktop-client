import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AddContact from "@/views/dialogs/AddContact";
import { Compass, Send, Sidebar, UserRoundPlus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function GetStarted() {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <Button
            variant="outline"
            className="cursor-pointer h-fit flex flex-col items-center gap-2 w-50"
          >
            <Compass className="size-12" />
            {t("homepage.get_started", "Get Started")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("homepage.get_started", "Get Started")}
            </DialogTitle>
          </DialogHeader>

          <div className="inline-flex items-center gap-1 text-xs">
            <p className="text-xl font-bold mr-2">1</p>
            {t("homepage.conversation.add_contacts")}
            <AddContact>
              <Button
                variant="outline"
                size="icon-sm"
                className="cursor-pointer"
                title={t("contacts.add.title")}
              >
                <UserRoundPlus />
              </Button>
            </AddContact>
          </div>

          <div className="inline-flex items-center gap-1 text-xs">
            <p className="text-xl font-bold mr-2">2</p>
            {t("homepage.conversation.select")}
            <Sidebar className="w-[10%]" />
          </div>

          <div className="inline-flex items-center gap-1 text-xs">
            <p className="text-xl font-bold mr-2">3</p>
            {t("homepage.conversation.message")}
            <Send className="w-[10%]" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

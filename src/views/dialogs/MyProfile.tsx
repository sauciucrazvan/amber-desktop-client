import { useAuth } from "@/auth/AuthContext";
import UserAvatar from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { ReactNode, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import useSWR from "swr";

interface MyProfileProps {
  trigger: ReactNode;
}

type Profile = {
  id: number;
  username: string;
  full_name: string;
};

export default function MyProfile({ trigger }: MyProfileProps) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const [open, setOpen] = useState<boolean>(false);

  const {
    data: user,
    error: error,
    isLoading: isLoading,
  } = useSWR<Profile>(isAuthenticated && "/account/me");

  if (!isAuthenticated) return <>Unauthorized.</>;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>

        <DialogContent className="select-none sm:max-w-85 min-h-25 max-h-100 flex flex-col items-start justify-start">
          {!isLoading && user && (
            <>
              <DialogHeader className="w-full">
                <DialogTitle className="w-full flex flex-col items-center justify-center gap-2 text-center">
                  <UserAvatar
                    full_name={user.full_name}
                    username={user.username}
                    size="xl"
                  />
                  <div className="flex flex-row items-start justify-start gap-1">
                    <div className="flex flex-row items-center gap-1">
                      <h3 className="text-lg leading-tight">
                        {user.full_name}
                        <p className="text-sm text-muted-foreground">
                          @{user.username}
                        </p>
                      </h3>
                    </div>
                  </div>
                </DialogTitle>
                <DialogDescription className="inline-flex items-center justify-center gap-1">
                  <Card className="w-full gap-0 mt-2 py-2">
                    <CardHeader className="w-full text-md font-bold inline-flex items-center justify-between">
                      {t("profile.bio.title")}
                      <Button
                        variant={"ghost"}
                        size="icon-sm"
                        className="cursor-pointer"
                        title={t("profile.bio.edit.title")}
                      >
                        <Pencil />
                      </Button>
                    </CardHeader>
                    <CardContent className="italic text-gray-400 mb-2">
                      {t("profile.bio.empty")}
                    </CardContent>
                  </Card>
                </DialogDescription>
              </DialogHeader>

              {/* content */}
              <section className="w-full inline-flex items-center justify-center gap-2"></section>
            </>
          )}

          {error && (
            <p className="text-red-500">
              <Trans i18nKey={error} values={{ user: user?.username ?? "" }} />
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

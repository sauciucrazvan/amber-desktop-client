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
import { Textarea } from "@/components/ui/textarea";
import { API_BASE_URL } from "@/config";
import { Pencil, Quote } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import useSWR from "swr";

interface MyProfileProps {
  trigger: ReactNode;
}

type Profile = {
  id: number;
  username: string;
  full_name: string;
  bio?: string | null;
};

async function readErrorMessage(res: Response) {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
  } catch {
    return `Request failed (${res.status})`;
  }
  return `Request failed (${res.status})`;
}

export default function MyProfile({ trigger }: MyProfileProps) {
  const { t } = useTranslation();
  const { isAuthenticated, authFetch } = useAuth();

  const [open, setOpen] = useState<boolean>(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [bioErrorKey, setBioErrorKey] = useState<string | null>(null);
  const [isSavingBio, setIsSavingBio] = useState(false);

  const {
    data: user,
    error: error,
    isLoading: isLoading,
    mutate: mutateProfile,
  } = useSWR<Profile>(isAuthenticated && "/account/me");

  useEffect(() => {
    if (!open || !user) return;
    setBioDraft(user.bio ?? "");
    setBioErrorKey(null);
    setIsEditingBio(false);
  }, [open, user]);

  const saveBio = async () => {
    if (!user) return;
    setBioErrorKey(null);
    setIsSavingBio(true);

    try {
      const res = await authFetch(API_BASE_URL + "/account/modify/bio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          new_bio: bioDraft,
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("common.errors.too_many_requests");
        }
        throw new Error(await readErrorMessage(res));
      }

      await mutateProfile();
      setIsEditingBio(false);
    } catch (e) {
      setBioErrorKey(e instanceof Error ? e.message : "common.info");
    } finally {
      setIsSavingBio(false);
    }
  };

  if (!isAuthenticated) return <>Unauthorized.</>;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>

        <DialogContent className="sm:max-w-85 min-h-25 max-h-100 flex flex-col items-start justify-start">
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
                      <div className="inline-flex items-center gap-1">
                        <Quote size="12" /> {t("profile.bio.title")}
                      </div>
                      <Button
                        variant={"ghost"}
                        size="icon-sm"
                        className="cursor-pointer"
                        title={t("profile.bio.edit.title")}
                        onClick={() => {
                          setBioDraft(user.bio ?? "");
                          setBioErrorKey(null);
                          setIsEditingBio((prev) => !prev);
                        }}
                      >
                        <Pencil />
                      </Button>
                    </CardHeader>
                    <CardContent className="mb-2">
                      {isEditingBio ? (
                        <div className="w-full flex flex-col gap-2">
                          <Textarea
                            value={bioDraft}
                            onChange={(e) => setBioDraft(e.target.value)}
                            placeholder={t("profile.bio.empty")}
                            className="min-h-20"
                            maxLength={100}
                          />
                          <div className="w-full flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsEditingBio(false);
                                setBioDraft(user.bio ?? "");
                                setBioErrorKey(null);
                              }}
                              disabled={isSavingBio}
                              className="cursor-pointer"
                            >
                              {t("common.cancel")}
                            </Button>
                            <Button
                              type="button"
                              onClick={saveBio}
                              disabled={
                                isSavingBio || bioDraft === (user.bio ?? "")
                              }
                              className="cursor-pointer"
                            >
                              {t("common.submit")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="italic text-gray-400">
                          {(user.bio ?? "").trim() || t("profile.bio.empty")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </DialogDescription>
                {bioErrorKey && (
                  <p className="text-red-500 text-xs">
                    <Trans
                      i18nKey={bioErrorKey}
                      values={{ user: user.username }}
                    />
                  </p>
                )}
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

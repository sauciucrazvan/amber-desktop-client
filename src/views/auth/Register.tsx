import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/auth/AuthContext";
import { AtSign } from "lucide-react";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import Settings from "../settings/Settings";
import { Input } from "@/components/ui/input";

export default function RegisterView() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await register({
        username,
        password,
        fullName,
        email: email.trim() ? email.trim() : undefined,
      });
      setLocation("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="flex gap-0 w-full min-h-screen">
        {/* Application Info */}
        <section className="w-[50%] bg-primary/5 flex flex-col items-center justify-center border-border border-r">
          {/* TODO: Replace this with a carousel of the finished application */}
          <img src="amber.svg" width={64} height={64} />
        </section>
        <section className="w-[50%] bg-background flex flex-col items-start justify-start p-4 border-border">
          {/* Login */}
          <div className="text-muted-foreground flex w-full justify-end items-center gap-1">
            {t("register.loginPrompt")}
            <a
              className="text-primary hover:underline cursor-pointer"
              onClick={() => setLocation("/login")}
            >
              {t("register.loginLink")}
            </a>
          </div>

          {/* Register */}
          <div className="flex flex-col w-full h-full justify-center items-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("register.title")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("register.subtitle")}
            </p>

            <div className="w-75 mt-4 flex flex-col gap-2">
              {/* Username */}
              <InputGroup>
                <InputGroupInput
                  id="username"
                  placeholder={t("register.usernamePlaceholder")}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <InputGroupAddon>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InputGroupButton
                        variant="ghost"
                        aria-label={t("common.help")}
                        size="icon-xs"
                      >
                        <AtSign />
                      </InputGroupButton>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("register.usernameHint")}</p>
                    </TooltipContent>
                  </Tooltip>
                </InputGroupAddon>
              </InputGroup>

              {/* Full Name */}
              <Input
                placeholder={t("register.fullnamePlaceholder")}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              {/* Email */}
              <Input
                placeholder={t("register.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {/* Password */}
              <Input
                placeholder={t("register.passwordPlaceholder")}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex flex-col items-center justify-center gap-2 mt-4 w-75">
              {/* Create Account */}
              <Button
                className="cursor-pointer"
                onClick={onSubmit}
                disabled={isSubmitting}
              >
                {t("register.createAccount")}
              </Button>

              {error ? (
                <p className="text-destructive text-sm px-6 text-center">
                  {t(error)}
                </p>
              ) : null}

              <p
                data-slot="field-description"
                className="text-muted-foreground text-sm leading-normal font-normal [[data-variant=legend]+&amp;]:-mt-1.5 [&amp;&gt;a:hover]:text-primary [&amp;&gt;a]:underline [&amp;&gt;a]:underline-offset-4 px-6 text-center"
              >
                <Trans
                  i18nKey="register.terms"
                  components={{
                    terms: <a href="/terms" />,
                    privacy: <a href="/privacy" />,
                  }}
                />
              </p>
            </div>
          </div>

          {/* Settings */}
          <div className="text-muted-foreground flex w-full justify-end items-center gap-1">
            <Settings minimalViews={true} />
          </div>
        </section>
      </section>
    </>
  );
}

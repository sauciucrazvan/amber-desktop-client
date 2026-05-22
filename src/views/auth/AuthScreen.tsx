import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import ErrorBox from "@/components/common/error-box";
import { useAuth } from "@/features/auth/AuthContext";
import { AtSign } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import Autoplay from "embla-carousel-autoplay";
import Settings from "../settings/Settings";
import ForgotPassword from "./dialogs/ForgotPassword";
import TermsView from "./dialogs/legal/Terms";
import PrivacyView from "./dialogs/legal/Privacy";

type AuthScreenMode = "login" | "register";

type AuthScreenProps = {
  mode: AuthScreenMode;
};

type AuthScreenHeroProps = {
  maxWidthClass: string;
};

function AuthScreenHero({ maxWidthClass }: AuthScreenHeroProps) {
  const plugin = useRef(Autoplay({ delay: 2000, stopOnInteraction: true }));

  return (
    <Carousel
      plugins={[plugin.current]}
      className={`w-full ${maxWidthClass}`}
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent>
        {Array.from({ length: 9 }).map((_, index) => (
          <CarouselItem key={index}>
            <div className="p-1">
              <img src={`slides/${index}.png`} className="rounded-[2px]" />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

function AuthScreenFooter() {
  return (
    <div className="text-muted-foreground flex w-full justify-end items-center gap-1">
      <Settings minimalViews={true} />
    </div>
  );
}

function AuthScreenLoginForm() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) setLocation("/");
  }, [isAuthenticated, setLocation]);

  const onSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(username, password);
      setLocation("/");
      toast.success(t("login.greeting"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full justify-center items-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("login.title")}
      </h1>
      <p className="text-muted-foreground text-sm">{t("login.subtitle")}</p>

      <div className="w-75 mt-4 flex flex-col gap-2">
        <Input
          placeholder={t("login.usernamePlaceholder")}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSubmit();
            }
          }}
        />

        <Input
          placeholder={t("login.passwordPlaceholder")}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSubmit();
            }
          }}
        />
      </div>

      <div className="flex flex-col items-center justify-center gap-4 mt-4 w-75">
        {error ? <ErrorBox>{t(error)}</ErrorBox> : null}

        <Button
          className="cursor-pointer"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {t("login.signIn")}
        </Button>
      </div>

      <ForgotPassword />
    </div>
  );
}

function AuthScreenRegisterForm() {
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
      toast.success(t("register.greeting"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full justify-center items-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("register.title")}
      </h1>
      <p className="text-muted-foreground text-sm">{t("register.subtitle")}</p>

      <div className="w-75 mt-4 flex flex-col gap-2">
        <InputGroup>
          <InputGroupInput
            id="username"
            placeholder={t("register.usernamePlaceholder")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSubmit();
              }
            }}
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

        <Input
          placeholder={t("register.fullnamePlaceholder")}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSubmit();
            }
          }}
        />

        <Input
          placeholder={t("register.emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSubmit();
            }
          }}
        />

        <Input
          placeholder={t("register.passwordPlaceholder")}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSubmit();
            }
          }}
        />
      </div>

      <div className="flex flex-col items-center justify-center gap-4 mt-4 w-75">
        {error ? <ErrorBox>{t(error)}</ErrorBox> : null}

        <Button
          className="cursor-pointer"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {t("register.createAccount")}
        </Button>

        <p
          data-slot="field-description"
          className="text-muted-foreground text-sm leading-normal font-normal [[data-variant=legend]+&amp;]:-mt-1.5 [&amp;&gt;a:hover]:text-primary [&amp;&gt;a]:underline [&amp;&gt;a]:underline-offset-4 px-6 text-center"
        >
          <Trans
            i18nKey="register.terms"
            components={{
              terms: <TermsView />,
              privacy: <PrivacyView />,
            }}
          />
        </p>
      </div>
    </div>
  );
}

function AuthScreenHeader({ mode }: AuthScreenProps) {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  if (mode === "login") {
    return (
      <div className="text-muted-foreground flex w-full justify-end items-center gap-1">
        {t("login.registerPrompt")}
        <a
          className="text-primary hover:underline cursor-pointer"
          onClick={() => setLocation("/register")}
        >
          {t("login.registerLink")}
        </a>
      </div>
    );
  }

  return (
    <div className="text-muted-foreground flex w-full justify-end items-center gap-1">
      {t("register.loginPrompt")}
      <a
        className="text-primary hover:underline cursor-pointer"
        onClick={() => setLocation("/login")}
      >
        {t("register.loginLink")}
      </a>
    </div>
  );
}

export default function AuthScreen({ mode }: AuthScreenProps) {
  const heroWidthClass =
    mode === "login" ? "max-w-40 sm:max-w-xs" : "max-w-40 md:max-w-xs";

  return (
    <section className="flex h-full w-full gap-0 border-t">
      <section className="w-[50%] bg-primary/5 flex flex-col items-center justify-center border-border border-r">
        <AuthScreenHero maxWidthClass={heroWidthClass} />
      </section>
      <section className="w-[50%] bg-background flex flex-col items-start justify-start p-4 border-border">
        <AuthScreenHeader mode={mode} />
        {mode === "login" ? (
          <AuthScreenLoginForm />
        ) : (
          <AuthScreenRegisterForm />
        )}
        <AuthScreenFooter />
      </section>
    </section>
  );
}


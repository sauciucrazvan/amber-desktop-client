import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import Settings from "../settings/Settings";

export default function LoginView() {
    const [, setLocation] = useLocation();
    const { t } = useTranslation();

    return (
        <>
            <section className="flex gap-0 w-full min-h-screen">

                {/* Application Info */}
                <section className="w-[50%] bg-primary/5 flex flex-col items-center justify-center border-border border-r">
                    {/* TODO: Replace this with a carousel of the finished application */}
                    <img src="amber.svg" width={64} height={64} />
                </section>
                <section className="w-[50%] bg-background flex flex-col items-start justify-start p-4 border-border">
                    
                    {/* Register */}
                    <div className="text-muted-foreground flex w-full justify-end items-center gap-1">
                        {t("login.registerPrompt")}
                        <a className="text-primary hover:underline cursor-pointer" onClick={() => setLocation("/register")}>
                            {t("login.registerLink")}
                        </a>
                    </div>

                    {/* Register */}
                    <div className="flex flex-col w-full h-full justify-center items-center">
                        <h1 className="text-2xl font-semibold tracking-tight">{t("login.title")}</h1>
                        <p className="text-muted-foreground text-sm">{t("login.subtitle")}</p>

                        <div className="w-75 mt-4 flex flex-col gap-2">
                            {/* Email */}
                            <Input placeholder={t("login.emailPlaceholder")} />
                            
                            {/* Password */}
                            <Input placeholder={t("login.passwordPlaceholder")} type={"password"} />
                            
                        </div>

                        <div className="flex flex-col items-center justify-center gap-2 mt-4 w-75">
                            {/* Create Account */}
                            <Button className="cursor-pointer" onClick={() => setLocation("/")}>
                                {t("login.signIn")}
                            </Button>

                            <p data-slot="field-description" className="text-muted-foreground text-sm leading-normal font-normal [[data-variant=legend]+&amp;]:-mt-1.5 [&amp;&gt;a:hover]:text-primary [&amp;&gt;a]:underline [&amp;&gt;a]:underline-offset-4 px-6 text-center"><a href="#">{t("login.forgotPassword")}</a></p>
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="text-muted-foreground flex w-full justify-end items-center gap-1">
                        <Settings minimalViews={true} />
                    </div>

                </section>

            </section>
        </>
    )
}
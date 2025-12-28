import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AtSign, HelpCircle, InfoIcon } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import Settings from "../settings/Settings";

export default function RegisterView() {
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
                    
                    {/* Login */}
                    <div className="text-muted-foreground flex w-full justify-end items-center gap-1">
                        {t("register.loginPrompt")}
                        <a className="text-primary hover:underline cursor-pointer" onClick={() => setLocation("/login")}>
                            {t("register.loginLink")}
                        </a>
                    </div>

                    {/* Register */}
                    <div className="flex flex-col w-full h-full justify-center items-center">
                        <h1 className="text-2xl font-semibold tracking-tight">{t("register.title")}</h1>
                        <p className="text-muted-foreground text-sm">{t("register.subtitle")}</p>

                        <div className="w-75 mt-4 flex flex-col gap-2">

                            {/* Username */}
                            <InputGroup>
                                <InputGroupInput id="username" placeholder={t("register.usernamePlaceholder")} />
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

                            {/* Email */}
                            <InputGroup>
                                <InputGroupInput placeholder={t("register.emailPlaceholder")} />
                                <InputGroupAddon align="inline-end">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                    <InputGroupButton
                                        variant="ghost"
                                        aria-label={t("common.help")}
                                        size="icon-xs"
                                    >
                                        <HelpCircle />
                                    </InputGroupButton>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                    <p>{t("register.emailHint")}</p>
                                    </TooltipContent>
                                </Tooltip>
                                </InputGroupAddon>
                            </InputGroup>

                            {/* Password */}
                            <InputGroup>
                                <InputGroupInput placeholder={t("register.passwordPlaceholder")} type="password" />
                                <InputGroupAddon align="inline-end">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                    <InputGroupButton
                                        variant="ghost"
                                        aria-label={t("common.info")}
                                        size="icon-xs"
                                    >
                                        <InfoIcon />
                                    </InputGroupButton>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                    <p>{t("register.passwordHint")}</p>
                                    </TooltipContent>
                                </Tooltip>
                                </InputGroupAddon>
                            </InputGroup>
                        </div>

                        <div className="flex flex-col items-center justify-center gap-2 mt-4 w-75">
                            {/* Create Account */}
                            <Button className="cursor-pointer" onClick={() => setLocation("/")}>
                                {t("register.createAccount")}
                            </Button>

                            <p data-slot="field-description" className="text-muted-foreground text-sm leading-normal font-normal [[data-variant=legend]+&amp;]:-mt-1.5 [&amp;&gt;a:hover]:text-primary [&amp;&gt;a]:underline [&amp;&gt;a]:underline-offset-4 px-6 text-center">
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
    )
}
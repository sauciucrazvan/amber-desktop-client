import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AtSign, HelpCircle, InfoIcon } from "lucide-react";
import { useLocation } from "wouter";

export default function RegisterView() {
    const [, setLocation] = useLocation();
    
    return (
        <>
            <section className="flex gap-0 w-full min-h-screen">

                {/* Application Info */}
                <section className="w-[50%] bg-primary/5 flex flex-col items-center justify-center border-border border-r">
                    {/* TODO: Replace this with a carousel of the finished application */}
                    <img src="amber_logo.svg" width={64} height={64} />
                </section>
                <section className="w-[50%] bg-background flex flex-col items-start justify-start p-4 border-border">
                    
                    {/* Login */}
                    <div className="text-muted-foreground flex w-full justify-end items-center gap-1">
                        Already have an account?
                        <a className="text-primary hover:underline cursor-pointer" onClick={() => setLocation("/login")}>
                            Login
                        </a>
                    </div>

                    {/* Register */}
                    <div className="flex flex-col w-full h-full justify-center items-center">
                        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
                        <p className="text-muted-foreground text-sm">Enter your info below to create your account</p>

                        <div className="w-75 mt-4 flex flex-col gap-2">

                            {/* Username */}
                            <InputGroup>
                                <InputGroupInput id="username" placeholder="Unique username" />
                                <InputGroupAddon>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                        <InputGroupButton
                                            variant="ghost"
                                            aria-label="Help"
                                            size="icon-xs"
                                        >
                                            <AtSign />
                                        </InputGroupButton>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                        <p>Only letters and numbers are allowed.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </InputGroupAddon>
                            </InputGroup>

                            {/* Email */}
                            <InputGroup>
                                <InputGroupInput placeholder="Your email address" />
                                <InputGroupAddon align="inline-end">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                    <InputGroupButton
                                        variant="ghost"
                                        aria-label="Help"
                                        size="icon-xs"
                                    >
                                        <HelpCircle />
                                    </InputGroupButton>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                    <p>We&apos;ll use this to verify you</p>
                                    </TooltipContent>
                                </Tooltip>
                                </InputGroupAddon>
                            </InputGroup>

                            {/* Password */}
                            <InputGroup>
                                <InputGroupInput placeholder="Enter password" type="password" />
                                <InputGroupAddon align="inline-end">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                    <InputGroupButton
                                        variant="ghost"
                                        aria-label="Info"
                                        size="icon-xs"
                                    >
                                        <InfoIcon />
                                    </InputGroupButton>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                    <p>Password must be at least 8 characters</p>
                                    </TooltipContent>
                                </Tooltip>
                                </InputGroupAddon>
                            </InputGroup>
                        </div>

                        <div className="flex flex-col items-center justify-center gap-2 mt-4 w-75">
                            {/* Create Account */}
                            <Button className="cursor-pointer" onClick={() => setLocation("/dashboard")}>
                                Create your account
                            </Button>

                            <p data-slot="field-description" className="text-muted-foreground text-sm leading-normal font-normal [[data-variant=legend]+&amp;]:-mt-1.5 [&amp;&gt;a:hover]:text-primary [&amp;&gt;a]:underline [&amp;&gt;a]:underline-offset-4 px-6 text-center">By clicking continue, you agree to our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.</p>
                        </div>
                    </div>

                </section>

            </section>
        </>
    )
}
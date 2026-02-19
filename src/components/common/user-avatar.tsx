import { cn, initialsFromName, stringToColor } from "@/lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface UserAvatarProps {
  full_name?: string | null;
  username?: string | null;
  isLoading?: boolean | null;
  isOnline?: boolean | null;
  size?: AvatarSize | null;
}

const avatarSizeClasses: Record<AvatarSize, string> = {
  xs: "size-6",
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
  xl: "size-16",
};

const avatarTextSizeClasses: Record<AvatarSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

export default function UserAvatar({
  full_name,
  username,
  isLoading,
  isOnline,
  size,
}: UserAvatarProps) {
  const resolvedSize = size ?? "sm";
  const avatarSizeClass = avatarSizeClasses[resolvedSize];
  const avatarTextSizeClass = avatarTextSizeClasses[resolvedSize];

  return (
    <div className="relative select-none">
      <Avatar className={avatarSizeClass}>
        <AvatarFallback
          className={avatarTextSizeClass}
          style={
            full_name
              ? {
                  backgroundColor: stringToColor(full_name ?? ""),
                }
              : undefined
          }
        >
          {full_name
            ? initialsFromName(String(full_name))
            : username
              ? initialsFromName(username)
              : isLoading
                ? "…"
                : ""}
        </AvatarFallback>
      </Avatar>
      {isOnline != null && (
        <span
          aria-label={isOnline ? "Online" : "Offline"}
          title={isOnline ? "Online" : "Offline"}
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
            isOnline ? "bg-emerald-500" : "bg-red-500",
          )}
        />
      )}
    </div>
  );
}

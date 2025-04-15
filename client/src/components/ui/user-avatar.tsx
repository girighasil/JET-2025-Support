import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: {
    id?: number;
    fullName?: string;
    avatar?: string;
    username?: string;
  } | null;
  className?: string;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  if (!user) {
    return (
      <Avatar className={cn("bg-gray-200", className)}>
        <AvatarFallback className="text-gray-600">
          ?
        </AvatarFallback>
      </Avatar>
    );
  }

  const fallbackText = user.fullName
    ? user.fullName.split(" ").map(n => n[0]).join("").toUpperCase()
    : user.username
      ? user.username.substring(0, 2).toUpperCase()
      : "?";

  return (
    <Avatar className={className}>
      {user.avatar ? (
        <AvatarImage src={user.avatar} alt={user.fullName || user.username || "User"} />
      ) : null}
      <AvatarFallback className="bg-gray-200 text-gray-600">
        {fallbackText}
      </AvatarFallback>
    </Avatar>
  );
}

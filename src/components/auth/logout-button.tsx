import { LogOut } from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Logs the user out on the server and returns them to the login page. */
export function LogoutButton({ className, fullWidth }: { className?: string; fullWidth?: boolean }) {
  return (
    <form action={logout} className={cn(fullWidth && "w-full")}>
      <Button
        type="submit"
        variant="outline"
        size="lg"
        className={cn(fullWidth && "h-11 w-full", className)}
      >
        <LogOut data-icon="inline-start" aria-hidden />
        Logout
      </Button>
    </form>
  );
}

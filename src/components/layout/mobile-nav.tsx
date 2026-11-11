"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Menu } from "lucide-react";
import { authNav, mainNav } from "@/config/site";
import { Button } from "@/components/ui/button";
import { buttonClass } from "@/lib/button-class";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/shared/logo";
import { logout } from "@/app/(auth)/actions";

/** Slide-in menu shown on phones and tablets (hidden from the lg breakpoint up). */
export function MobileNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            className="lg:hidden"
            aria-label="Open menu"
          />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>

      <SheetContent side="right" className="w-[85vw] max-w-sm">
        <SheetHeader className="border-b">
          <SheetTitle render={<div />}>
            <Logo className="h-10" />
          </SheetTitle>
        </SheetHeader>

        <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="rounded-md px-3 py-3 text-base font-medium hover:bg-accent"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-2 border-t p-4">
          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                onClick={close}
                className={buttonClass({ size: "lg", className: "h-11" })}
              >
                <LayoutDashboard data-icon="inline-start" aria-hidden />
                Dashboard
              </Link>
              <form action={logout}>
                <Button type="submit" variant="outline" size="lg" className="h-11 w-full">
                  Logout
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link
                href={authNav.login.href}
                onClick={close}
                className={buttonClass({ variant: "outline", size: "lg", className: "h-11" })}
              >
                {authNav.login.title}
              </Link>
              <Link
                href={authNav.register.href}
                onClick={close}
                className={buttonClass({ size: "lg", className: "h-11" })}
              >
                {authNav.register.title}
              </Link>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

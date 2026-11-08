"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { mainNav } from "@/config/site";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/shared/logo";

/** Slide-in menu shown on phones (hidden from the md breakpoint up). */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            className="md:hidden"
            aria-label="Open menu"
          />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>

      <SheetContent side="right" className="w-[85vw] max-w-sm">
        <SheetHeader className="border-b">
          <SheetTitle render={<div />}>
            <Logo />
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
          <Link
            href="/login"
            onClick={close}
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Log in
          </Link>
          <Link
            href="/courses"
            onClick={close}
            className={buttonVariants({ size: "lg" })}
          >
            Start Learning
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

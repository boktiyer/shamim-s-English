import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";
import { faqs } from "@/data/home";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buttonClass } from "@/lib/button-class";
import { Container } from "@/components/layout/container";

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 py-16 sm:py-20 lg:py-24">
      <Container className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <p className="mb-3 text-sm font-semibold tracking-wide text-primary uppercase">
            FAQ
          </p>
          <h2 className="text-h1">Frequently asked questions</h2>
          <p className="mt-4 text-lead">
            Can&apos;t find your answer? Our support team is happy to help.
          </p>
          <Link
            href={siteConfig.social.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass({ variant: "outline", size: "lg", className: "mt-6 h-11 px-5" })}
          >
            <MessageCircle data-icon="inline-start" aria-hidden />
            Chat with us
          </Link>
        </div>

        <Accordion className="gap-3 lg:col-span-8">
          {faqs.map((faq) => (
            <AccordionItem
              key={faq.question}
              value={faq.question}
              className="rounded-xl border bg-card px-5 not-last:border-b"
            >
              <AccordionTrigger className="py-4 text-base font-semibold hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pb-4 leading-relaxed text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Container>
    </section>
  );
}

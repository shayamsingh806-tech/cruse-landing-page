import { seo } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { HeroBanner, SectionHeading } from "@/components/site/sections";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, LogIn, ShieldCheck, Mail } from "lucide-react";

export const Route = createFileRoute("/staff-access")({
  head: () => seo("/staff-access", [
    { title: "Staff Access | Canopus Marine Andaman" },
    { name: "description", content: "Secure staff access to the Canopus Marine management dashboard. Authorized team members only." },
    { name: "robots", content: "noindex, nofollow" },
    { property: "og:title", content: "Canopus Marine Staff Access" },
    { property: "og:description", content: "Secure staff access to the Canopus Marine management dashboard." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ]),
  component: Page,
});

const steps = [
  {
    Icon: LogIn,
    title: "Sign in with Google",
    text: "Use the Google account that has been granted staff access. The dashboard opens the sign-in screen automatically if you are not signed in.",
  },
  {
    Icon: ShieldCheck,
    title: "Access is verified",
    text: "Only accounts approved as staff admins can enter. If you see an access-denied message, your account has not been added yet.",
  },
  {
    Icon: LayoutDashboard,
    title: "Manage the site",
    text: "Once inside, you can view leads and bookings, edit cruises and activities, update page content, track saved carts and draft guest follow-ups.",
  },
];

function Page() {
  return (
    <>
      <HeroBanner title="Staff Access" />
      <section className="py-20">
        <div className="mx-auto max-w-[900px] px-6">
          <SectionHeading kicker="Team Only" title="Canopus Marine Management Dashboard" />
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            This area is for authorized Canopus Marine staff. From the dashboard you can manage bookings,
            leads, experiences, page content, saved carts and guest follow-ups.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map(({ Icon, title, text }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-xl border border-border bg-muted/40 p-8 text-center">
            <Button asChild size="lg">
              <Link to="/admin">Open the Staff Dashboard</Link>
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">
              You will be asked to sign in with your authorized Google account.
            </p>
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-card p-5 text-sm leading-6 text-muted-foreground">
            <Mail className="mt-0.5 size-5 shrink-0 text-primary" />
            <p>
              Need access or having trouble signing in? Contact{" "}
              <a href="mailto:management@canopusmarineserv.com" className="font-semibold text-primary hover:underline">
                management@canopusmarineserv.com
              </a>{" "}
              and include the Google email you want to use.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

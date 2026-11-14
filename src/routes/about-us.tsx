import {seo} from "@/lib/seo";
import {createFileRoute} from "@tanstack/react-router";
import {HeroBanner, SectionHeading, SunRule} from "@/components/site/sections";

export const Route=createFileRoute("/about-us")({
  head:()=>seo("/about-us",[
    {title:"About Canopus Marine | Andaman Islands"},
    {name:"description",content:"Meet the seafarer-led team behind Canopus Marine — a Master Mariner and a Chief Engineer bringing professional maritime standards to Andaman cruises and watersports."},
    {property:"og:title",content:"About Canopus Marine"},
    {property:"og:description",content:"Seafarers first. Locals always. Semi-submarine cruises, watersports and private charters across Havelock and Port Blair."},
    {property:"og:type",content:"website"},
    {name:"twitter:card",content:"summary_large_image"}
  ]),
  component:Page
});

const story=[
  "Long before Canopus Marine welcomed its first guest, its story began on the water. Our founder is a Master Mariner who grew up in Port Blair, and he spent years commanding vessels across the world's oceans. His co-founder, a Chief Engineer, knew every heartbeat of a ship's machinery. Between them they had decades at sea and one shared belief: the Andaman Sea deserved to be experienced the way seafarers see it, safely, closely and with a sense of wonder.",
  "That belief became Canopus Marine.",
  "We started where we know best, in port operations and craft management: vessel arrivals, berthing, cargo handling and the quiet discipline of running things right at sea. That foundation still shapes everything we do. When guests step aboard with us, they are in the hands of people who have spent their lives on the ocean.",
  "Then we set out to share that ocean. Our flagship semi-submarine carries guests below the waterline off Havelock Island. Through its glass hull, coral gardens, reef fish and turtles drift past as if you've slipped into another world. By day it's an adventure, and as the sun sets it becomes something else: our Dinner Cruise brings fine dining, live music and dance together under an open sky, with the ocean stretching out in every direction.",
  "For those who want the thrill, we take it further. You can parasail high above turquoise bays, scuba dive among living reefs, snorkel over shallow gardens of colour, race across the waves on a jet ski, or hold on tight with friends on our sofa, banana and dragon rides. For anglers, we head offshore for game fishing."
];

const leading=[
  "Today, Canopus Marine is one of the Andaman Islands' most trusted names in marine experiences. Our operations run across Havelock and Port Blair, and more than 5,000 guests from India and around the world have sailed with us. Leading travel and hospitality brands, including MakeMyTrip, Taj Exotica and IHCL, partner with us to deliver experiences their own guests remember.",
  "What sets us apart is simple. We are seafarers first, so safety is our standard. We are locals, so these islands are home, not just a destination. We design every cruise and activity ourselves, so each one blends adventure with comfort in a way no one else here offers."
];

function Page(){
  return <>
    <HeroBanner title="Our Story">Born at Sea, Rooted in the Andamans</HeroBanner>
    <section className="py-20">
      <div className="mx-auto max-w-[820px] px-6">
        <div className="flex justify-center"><SectionHeading kicker="Our Story" title="Born at Sea, Rooted in the Andamans" light={false}/></div>
        <div className="mt-10 space-y-6">
          {story.map((p,i)=>(
            <p key={i} className={i===1?"text-xl font-semibold text-primary":"leading-8 text-muted-foreground"}>{p}</p>
          ))}
        </div>
      </div>
    </section>
    <SunRule/>
    <section className="bg-muted py-20">
      <div className="mx-auto max-w-[820px] px-6">
        <div className="flex justify-center"><SectionHeading kicker="Leading the Way" title="Trusted Across the Andamans"/></div>
        <div className="mt-10 space-y-6">
          {leading.map((p,i)=>(
            <p key={i} className="leading-8 text-muted-foreground">{p}</p>
          ))}
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[["Seafarers First","Safety is our standard"],["Locals Always","These islands are home"],["Designed by Us","Adventure meets comfort"]].map(([t,d])=>(
            <div key={t} className="bg-card p-6 text-center">
              <p className="font-display text-lg font-bold text-primary">{t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </>;
}

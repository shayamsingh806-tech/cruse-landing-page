import {seo} from "@/lib/seo";
import {createFileRoute,notFound} from "@tanstack/react-router";
import {HeroBanner} from "@/components/site/sections";
import {images} from "@/lib/assets";

type PolicyPage={title:string;description:string;sections:{heading:string;body:string[]}[]};

const pages:Record<string,PolicyPage>={
"terms-of-booking":{
  title:"Terms of Booking",
  description:"Booking terms for Canopus Marine cruises, charters and watersports.",
  sections:[
    {heading:"Booking and confirmation",body:["All bookings are subject to availability, suitable weather and safe sea conditions. A booking is confirmed once full payment or an approved advance is received and a confirmation is issued by Canopus Marine.","Guests must provide accurate names, contact details and guest counts at the time of booking. Any special requests — decorations, cakes or dietary needs — must be shared at least 48 hours in advance."]},
    {heading:"Pricing and payment",body:["Prices are listed in Indian Rupees and are per person unless stated otherwise. On Lunch and Sunset Cruises, guests aged 3 years and above pay the full listed price and infants below 3 years travel free. On Dinner Cruise, children aged 4–12 are ₹1,500 per child and infants below 3 years travel free.","Online payments are processed securely through our payment partner. A booking is not guaranteed until payment is successfully completed."]},
    {heading:"On the day of your experience",body:["Please arrive at the confirmed meeting point — Havelock Jetty or as advised — at least 20 minutes before departure. Late arrivals may forfeit the booking without refund.","Guests must follow all crew instructions at all times. Canopus Marine reserves the right to refuse participation to any guest whose behaviour or condition may compromise safety."]},
    {heading:"Weather and operations",body:["Marine activities depend on sea and weather conditions. If an experience is cancelled by us for safety or operational reasons, guests will be offered an alternative date or a full refund."]},
  ]},
"cancellation-policy":{
  title:"Cancellation Policy",
  description:"Cancellation and rescheduling guidance for Canopus Marine experiences.",
  sections:[
    {heading:"Guest cancellations",body:["Cancellations made at least 24 hours before the scheduled experience receive a full refund.","Cancellations made within 24 hours of the scheduled experience, or no-shows, are not eligible for a refund."]},
    {heading:"Rescheduling",body:["You may request to reschedule your experience up to 24 hours before departure, subject to availability on the new date."]},
    {heading:"Cancellations by Canopus Marine",body:["If we cancel an experience due to weather, sea conditions or operational requirements, you will be offered a choice of rescheduling to another date or a full refund of the amount paid."]},
    {heading:"How to cancel",body:["To cancel or reschedule, contact our team by phone or email with your booking reference. Refunds are processed to the original payment method within 7–10 working days."]},
  ]},
"safety-guidelines":{
  title:"Safety Guidelines",
  description:"Important safety guidance for cruises and watersports with Canopus Marine.",
  sections:[
    {heading:"Before you board",body:["Inform our crew of any medical conditions, pregnancy, or mobility concerns before your experience. Certain high-thrill activities may not be suitable for guests with heart conditions, back problems or recent surgeries.","Children must be accompanied by a responsible adult at all times."]},
    {heading:"Life jackets and equipment",body:["Life jackets are provided and must be worn during all watersports activities and whenever instructed by the crew. All equipment is inspected regularly and operated by trained staff."]},
    {heading:"During the experience",body:["Follow all instructions given by the crew and activity instructors. Do not lean over railings, enter restricted areas, or touch marine life or coral.","Alcohol consumption is not permitted before or during watersports activities."]},
    {heading:"Weather decisions",body:["The captain and crew have the final authority on whether conditions are safe. Decisions to delay, reroute or cancel are made solely in the interest of guest safety."]},
  ]},
"privacy-policy":{
  title:"Privacy Policy",
  description:"How Canopus Marine handles information shared through this website.",
  sections:[
    {heading:"Information we collect",body:["When you book or enquire, we collect your name, phone number, email address and booking details such as the experience, date and number of guests. Payment details are processed securely by our payment partner and are never stored on our servers."]},
    {heading:"How we use your information",body:["We use your information to confirm and manage your booking, send you booking confirmations and updates, and respond to your enquiries. We may contact you about your scheduled experience if plans or weather conditions change."]},
    {heading:"Sharing of information",body:["We do not sell or rent your personal information. Information is shared only with the service providers needed to operate your booking, such as our payment processor and email delivery service."]},
    {heading:"Your choices",body:["You may ask us to update or delete your contact information at any time by writing to management@canopusmarineserv.com."]},
  ]},
};

export const Route=createFileRoute("/policies/$slug")({
  loader:({params})=>{const p=pages[params.slug];if(!p)throw notFound();return p},
  head:({loaderData,params})=>seo(`/policies/${params.slug}`,[
    {title:`${loaderData?.title??"Policy"} | Canopus Marine`},
    {name:"description",content:loaderData?.description??"Canopus Marine policy information."},
    {property:"og:title",content:`${loaderData?.title??"Policy"} | Canopus Marine`},
    {property:"og:description",content:loaderData?.description??"Canopus Marine policy information."},
    {property:"og:type",content:"website"},
    {name:"twitter:card",content:"summary_large_image"},
  ]),
  component:Page,
});

function Page(){
  const p=Route.useLoaderData();
  return <>
    <HeroBanner image={images.hero} title={p.title}/>
    <article className="mx-auto max-w-3xl px-6 py-20 leading-7 text-muted-foreground">
      <p className="text-lg">{p.description}</p>
      {p.sections.map(s=><section key={s.heading}>
        <h2 className="mt-10 text-2xl font-bold text-foreground">{s.heading}</h2>
        {s.body.map((para,i)=><p key={i} className="mt-4">{para}</p>)}
      </section>)}
      <p className="mt-12 border-t border-border pt-6 text-sm">Questions about this policy? Contact the Canopus Marine team at <a className="font-semibold text-primary-hover underline" href="mailto:management@canopusmarineserv.com">management@canopusmarineserv.com</a>.</p>
    </article>
  </>;
}

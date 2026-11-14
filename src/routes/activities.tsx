import {seo, itemListLd, breadcrumbLd} from "@/lib/seo";
import {activities as activityData} from "@/lib/site-data";
import {createFileRoute} from "@tanstack/react-router";
import {useState} from "react";
import inMotionVideo from "@/assets/canopus-activities.mp4.asset.json";
import {CardsGrid,Kicker,SunRule} from "@/components/site/sections";
import {useExperiences} from "@/lib/use-experiences";
import {Button} from "@/components/ui/button";

export const Route=createFileRoute("/activities")({head:()=>({...seo("/activities",[{title:"Watersports & Activities in Andaman | Canopus Marine"},{name:"description",content:"Parasailing, flying board, underwater scooter, snorkeling, scuba, sea walk, kayaking and more in Havelock and Port Blair."},{property:"og:title",content:"Andaman Watersports | Canopus Marine"},{property:"og:description",content:"Explore watersports and underwater activities across the Andaman Sea."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]),scripts:[breadcrumbLd([["Home","/"],["Activities","/activities"]]),itemListLd("Watersports & Activities in the Andamans","/activities",activityData)]}),component:Page});

function Page(){const [filter,setFilter]=useState("All");const activities=useExperiences().filter(x=>x.kind==="Activity");const list=filter==="All"?activities:activities.filter(x=>x.category===filter);
return <>
<section className="relative overflow-hidden bg-muted py-20 md:py-28">
  <div aria-hidden="true" className="pointer-events-none absolute inset-0">
    <div className="absolute -right-48 -top-48 size-[32rem] rounded-full bg-ocean/15 blur-3xl"/>
    <div className="absolute -bottom-48 -left-48 size-[32rem] rounded-full bg-sun/20 blur-3xl"/>
    <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ocean/10 to-transparent"/>
  </div>
  <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 text-center lg:px-8">
    <div className="animate-fade-up [&_h1]:mx-auto [&_p]:mx-auto">
      <Kicker>Canopus Marine in Motion</Kicker>
      <h1 className="text-4xl font-bold leading-tight text-foreground md:text-5xl">Watersports & Activities in the Andamans</h1>
      <p className="mt-4 max-w-2xl text-lg leading-7 text-muted-foreground">Watersports, reefs and thrills — watch our activities in action.</p>
    </div>
    <div className="group relative mt-12 w-full">
      <div aria-hidden="true" className="absolute -left-3 -top-3 size-12 rounded-tl-lg border-l-2 border-t-2 border-sun"/>
      <div aria-hidden="true" className="absolute -bottom-3 -right-3 size-12 rounded-br-lg border-b-2 border-r-2 border-sun"/>
      <div className="relative z-10 overflow-hidden rounded-xl shadow-[0_24px_48px_-16px_rgba(12,65,123,0.35)] ring-1 ring-primary/15 bg-white">
        <video src={inMotionVideo.url} title="Canopus Marine video — watersports and activities in the Andaman Islands" controls autoPlay muted loop playsInline preload="metadata" className="aspect-video w-full bg-foreground/5"/>
      </div>
    </div>
    <div aria-hidden="true" className="mt-14 h-[3px] w-32 rounded-full bg-sun"/>
  </div>
</section>
<SunRule/>
<section className="py-20">
  <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
    <div className="mb-10 flex flex-wrap gap-2">{["All","Adventure","Underwater","Group Rides"].map(x=><Button key={x} variant={filter===x?"default":"outline"} onClick={()=>setFilter(x)}>{x}</Button>)}</div>
    <CardsGrid items={list}/>
  </div>
</section>
</>;}

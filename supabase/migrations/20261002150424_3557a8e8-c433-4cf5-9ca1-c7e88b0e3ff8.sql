CREATE TABLE public.experiences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  full_title text,
  kind text NOT NULL CHECK (kind IN ('Cruise','Activity')),
  category text NOT NULL,
  image text NOT NULL DEFAULT '',
  alt text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  timing text NOT NULL DEFAULT '',
  duration text NOT NULL DEFAULT '',
  price text NOT NULL DEFAULT '',
  price_note text,
  limits text NOT NULL DEFAULT '',
  overview text NOT NULL DEFAULT '',
  reporting text,
  inclusions text[],
  exclusions text[],
  add_ons text[],
  sort_order integer NOT NULL DEFAULT 0,
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.experiences TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.experiences TO authenticated;
GRANT ALL ON public.experiences TO service_role;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads visible experiences" ON public.experiences FOR SELECT TO anon USING (NOT hidden);
CREATE POLICY "Admins read all experiences" ON public.experiences FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert experiences" ON public.experiences FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update experiences" ON public.experiences FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete experiences" ON public.experiences FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.site_content (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read site content" ON public.site_content FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write site content" ON public.site_content FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update site content" ON public.site_content FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.experiences (slug,title,full_title,kind,category,image,alt,location,timing,duration,price,price_note,limits,overview,reporting,inclusions,exclusions,add_ons,sort_order) VALUES
('lunch-cruise','Lunch Cruise','Elephant Beach Cruise Experience with Lunch Combo & Photography','Cruise','Cruise','','Semi-submarine lunch cruise to Elephant Beach from Havelock Harbour','Havelock Harbour','9:45 AM – 2:45 PM','5 hours','₹2,500 per person',NULL,'All ages welcome · 130 pax capacity','A full five-hour Elephant Beach day aboard the A/C semi-submarine — glass-hull transfer to Elephant Beach, exclusive beach access for watersports, an IHCL Qmin lunch combo, DJ dance floor on the open deck and professional photography to take home.','9:30 AM at Havelock Jetty',ARRAY['01 complimentary Welcome Drink per person','A/C Cruise Transfer to Elephant Beach (130 pax capacity)','Shuttle service from Cruise to Elephant Beach and back to Cruise','Exclusive entry to Elephant Beach for Water Sports activity','IHCL own cuisine Restaurant Qmin Lunch Combo','Photography Pictures — 10 per couple | Additional photos: ₹1,000 for next 20 photos','Onboard changing rooms, toilets & showers','DJ dance floor + open deck entertainment'],ARRAY['Glass Bottom Coral Viewing excluded in Code 666','Pick-up & Drop Transfer (sharing basis)','All others not specified in Inclusions will be add-ons on a chargeable basis'],NULL,1),
('sunset-cruise','Sunset Cruise','Sunset Cruise Party with Golden Hour Photography','Cruise','Cruise','','Cruise boat on calm turquoise water under a vibrant golden sunset','Havelock Harbour','4:15 PM – 6:15 PM','2 hours','₹2,500 per person',NULL,'All ages welcome · 130 pax capacity','Two golden hours on the Andaman Sea — watch the sun melt into the horizon from the open deck with live music, a DJ dance floor, welcome drinks, Hi-Tea and complimentary photography to remember it by.','4:00 PM at Havelock Jetty',ARRAY['Watch a breathtaking Golden Hour Sunset','Live music / DJ & dance floor','01 complimentary Welcome Drink per person','Hi-Tea / Coffee','Choice of Veg / Non-Veg starters or Chef''s Choice','Complimentary photography & videography — Photos: 10–15 edited photos per couple'],ARRAY['Glass Bottom Coral Viewing','Pick-up & Drop Transfer (sharing basis)','All others not specified in Inclusions will be add-ons on a chargeable basis'],ARRAY['Celebration / Decoration Package: ₹2,000 (Table Decoration & Balloon Decoration)','Add-on Cake: ₹1,200 — advance notice of 48 hours required'],2),
('dinner-cruise','Dinner Cruise','Dinner Cruise Party','Cruise','Cruise','','Evening dinner cruise aboard Canopus Marine','Havelock Harbour','7:30 PM – 10:00 PM','2.5 hours','₹3,500 per person','Children (5–11 yrs): ₹1,499 per child · Infants (below 4 yrs): Free','All ages welcome · 130 pax capacity','An evening of dining, music and dancing under the stars — a harbour cruise with panoramic ocean views, live DJ, a welcome drink and a generous Veg & Non-Veg buffet dinner, with hotel pick-up and drop included.','7:15 PM at Havelock Jetty',ARRAY['Harbour cruise with ocean views','Live DJ & dance floor','01 complimentary Welcome Drink per person (beer / wine / mocktail)','Veg & Non-Veg Buffet Dinner','Buffet Highlights — Veg Starters (any 2): Veg Tikki / French Fries / Nuggets / Paneer Shashlik','Veg Main Course: Aloo Jeera / Dal Tadka / Paneer Butter Masala / Steam Rice / Butter Roti / Paratha','Buffet Highlights — Non-Veg Starters (any 2, rotational basis): Chicken Popcorn / Fish Fingers / Chicken Lollipop / Dragon Chicken','Non-Veg Main Course: Nicobari Prawns Curry / Chicken Reshmi Masala','Complimentary photography & videography — 10 photos per couple | Extra 25 raw photos @ ₹1,000 (optional)','Pick-up & drop from hotel (sharing basis)'],NULL,ARRAY['Extra 25 raw photos @ ₹1,000 (optional, in addition to the 10 complimentary photos per couple)'],3),
('parasailing','Parasailing',NULL,'Activity','Adventure','','Parasailing above tropical turquoise water','Havelock & Port Blair','Daily, weather permitting','10–15 minutes','From ₹3,500',NULL,'Weight limits apply','Soar high above the turquoise waters for a bird''s-eye view of the coastline.',NULL,NULL,NULL,NULL,10),
('game-fishing','Game Fishing',NULL,'Activity','Adventure','','Sport fishing from a boat in tropical waters','Andaman Sea','By arrangement','Half or full day','Price on request',NULL,'Suitable for beginners and anglers','Head offshore for sport fishing with an experienced crew and quality tackle — for anglers of every level.',NULL,NULL,NULL,NULL,11),
('shore-scuba','Shore Scuba',NULL,'Activity','Underwater','','Scuba diver in shallow turquoise water near a tropical island shore','Havelock Island','Daily, weather permitting','45–60 minutes','From ₹3,500',NULL,'Age and medical limits apply','Discover scuba from the beach — walk straight in from the shore and meet the reef with an instructor by your side.',NULL,NULL,NULL,NULL,12),
('boat-scuba','Boat Scuba',NULL,'Activity','Underwater','','Scuba divers descending into deep blue tropical water from a dive boat','Havelock & Port Blair','Morning departures','2–3 hours','From ₹5,000',NULL,'Age and medical limits apply','Head out by boat to deeper reef sites and dive with certified instructors — no prior experience needed.',NULL,NULL,NULL,NULL,13),
('snorkelling','Snorkelling',NULL,'Activity','Underwater','','Snorkeller above a colourful shallow reef','Havelock Island','Daily','1–2 hours','From ₹1,200',NULL,'Basic water confidence advised','Float above shallow reefs and see colourful marine life up close.',NULL,NULL,NULL,NULL,14),
('sea-walk','Sea Walk',NULL,'Activity','Underwater','','Guest on a helmet sea walk surrounded by tropical fish on the seabed','North Bay & Havelock','Daily','20–30 minutes underwater','From ₹4,500',NULL,'Ages 10 and above','Walk on the seabed wearing a clear helmet while tropical fish swirl around you — no swimming skills needed.',NULL,NULL,NULL,NULL,15),
('glass-bottom','Glass Bottom',NULL,'Activity','Underwater','','Glass-bottom boat over a vibrant coral reef','Havelock & Port Blair','Daily','About 1 hour','From ₹1,500',NULL,'All ages welcome','See coral gardens and marine life through the boat''s glass panels — dry, comfortable and perfect for every age.',NULL,NULL,NULL,NULL,16),
('jet-ski','Jet Ski',NULL,'Activity','Adventure','','Jet ski crossing bright blue tropical water','Havelock & Port Blair','Daily, weather permitting','10–20 minutes','From ₹1,000',NULL,'Age and weight limits apply','Take the controls and race across open water.',NULL,NULL,NULL,NULL,17),
('sofa-ride','Sofa Ride',NULL,'Activity','Group Rides','','Friends enjoying a fast inflatable water ride','Havelock Island','Daily, weather permitting','10–15 minutes','Price on request',NULL,'Minimum age applies','A high-speed inflatable sofa towed by a speedboat — laughs guaranteed.',NULL,NULL,NULL,NULL,18),
('banana-ride','Banana Ride',NULL,'Activity','Group Rides','','Group inflatable ride across tropical water','Havelock Island','Daily, weather permitting','10–15 minutes','From ₹800',NULL,'Minimum age applies','The classic group ride — hold on tight on the banana boat.',NULL,NULL,NULL,NULL,19),
('kayaking-day','Kayaking Day',NULL,'Activity','Adventure','','Kayaker paddling turquoise tropical water past green islands','Havelock Island','Morning & afternoon sessions','1–2 hours','From ₹2,500',NULL,'All ages welcome','Paddle a kayak through calm turquoise water along mangroves and the island coastline.',NULL,NULL,NULL,NULL,20),
('kayaking-night','Kayaking Night',NULL,'Activity','Adventure','','Night kayak over glowing bioluminescent water under a starry sky','Havelock Island','After sunset','1.5–2 hours','From ₹3,500',NULL,'Basic water confidence advised','Glide over glowing bioluminescent waters under the stars on a guided night paddle.',NULL,NULL,NULL,NULL,21),
('dragon-ride','Dragon Ride',NULL,'Activity','Group Rides','','Towed group water ride in the Andaman Sea','Havelock Island','Daily, weather permitting','10–15 minutes','From ₹800',NULL,'Minimum age applies','A towed inflatable dragon that bounces over the waves — great for groups and families.',NULL,NULL,NULL,NULL,22),
('disco-ride','Disco Ride',NULL,'Activity','Group Rides','','Group riding a large round inflatable towed by a speedboat','Havelock Island','Daily, weather permitting','10–15 minutes','From ₹800',NULL,'Minimum age applies','A big round disco raft that spins and bounces behind the speedboat — pure group fun.',NULL,NULL,NULL,NULL,23),
('dolphin-ride','Dolphin Ride',NULL,'Activity','Group Rides','','Inflatable dolphin ride carrying riders across bright blue water','Havelock Island','Daily, weather permitting','10–15 minutes','From ₹3,500',NULL,'Minimum age applies','Ride the friendly inflatable dolphin as it skips across the waves — a favourite with families.',NULL,NULL,NULL,NULL,24);
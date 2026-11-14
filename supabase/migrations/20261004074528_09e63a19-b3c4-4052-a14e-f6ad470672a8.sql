CREATE TABLE public.chat_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  message_count int NOT NULL DEFAULT 0,
  converted boolean NOT NULL DEFAULT false,
  reviewed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.chat_transcripts TO authenticated;
GRANT ALL ON public.chat_transcripts TO service_role;
ALTER TABLE public.chat_transcripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read transcripts" ON public.chat_transcripts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update transcripts" ON public.chat_transcripts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete transcripts" ON public.chat_transcripts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.chat_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL CHECK (char_length(question) BETWEEN 1 AND 500),
  answer text NOT NULL CHECK (char_length(answer) BETWEEN 1 AND 3000),
  status text NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested','approved')),
  source text NOT NULL DEFAULT 'staff',
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_knowledge TO authenticated;
GRANT ALL ON public.chat_knowledge TO service_role;
ALTER TABLE public.chat_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage knowledge" ON public.chat_knowledge FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
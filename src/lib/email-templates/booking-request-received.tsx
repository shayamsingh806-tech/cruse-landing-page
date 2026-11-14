import * as React from 'react'
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  experience?: string
  bookingDate?: string
  guests?: number
  phone?: string
  notes?: string
  reference?: string
}

const Row = ({ label, value }: { label: string; value?: string | number | undefined }) => (
  <Text style={row}><span style={rowLabel}>{label}</span><br />{value ?? '—'}</Text>
)

const Email = ({ name, experience, bookingDate, guests, phone, notes, reference }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We've received your booking request{experience ? ` for ${experience}` : ''} — here's what happens next</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={band}><Text style={brand}>CANOPUS MARINE</Text></Section>
        <Section style={content}>
          <Heading style={h1}>Booking request received</Heading>
          <Text style={text}>{name ? `Hi ${name},` : 'Hello,'}</Text>
          <Text style={text}>Thank you for choosing Canopus Marine. We've received your request. <strong>Your booking is not confirmed yet</strong> — our team will check availability first.</Text>
          <Section style={card}>
            <Row label="Experience" value={experience} />
            <Row label="Requested date" value={bookingDate} />
            <Row label="Guests" value={guests} />
            <Row label="Contact number" value={phone} />
            {notes ? <Row label="Your notes" value={notes} /> : null}
            {reference ? <Row label="Request reference" value={reference} /> : null}
            <Row label="Payment status" value="Not paid yet" />
          </Section>
          <Heading as="h2" style={h2}>What happens next</Heading>
          <Text style={step}><strong>1.</strong> Our team will call or WhatsApp you on the number above to confirm availability.</Text>
          <Text style={step}><strong>2.</strong> Once confirmed, we'll share payment details to secure your spot.</Text>
          <Text style={step}><strong>3.</strong> After payment, you'll receive your booking confirmation with reporting time and place.</Text>
          <Hr style={hr} />
          <Text style={small}>Need to change something or have a question? Reply to this email, or call +91-99332-46262 / +91-99332-22257.</Text>
          <Text style={small}>Canopus Marine · Havelock Island & Port Blair, Andaman Islands</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `We've received your booking request${d['experience'] ? ` — ${d['experience']}` : ''} | Canopus Marine`,
  displayName: 'Booking request received',
  previewData: {
    name: 'Priya', experience: 'Dinner Cruise', bookingDate: '12 Nov 2026', guests: 2,
    phone: '+91 98765 43210', notes: 'Celebrating an anniversary', reference: 'A1B2C3D4',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '"DM Sans", Arial, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto' }
const band = { backgroundColor: '#0C417B', borderBottom: '3px solid #F5C518', padding: '18px 28px' }
const brand = { color: '#ffffff', fontSize: '16px', fontWeight: 700, letterSpacing: '2px', margin: 0 }
const content = { padding: '28px' }
const h1 = { color: '#0C417B', fontSize: '24px', margin: '0 0 16px' }
const h2 = { color: '#0C417B', fontSize: '18px', margin: '8px 0 10px' }
const text = { color: '#1f2937', fontSize: '15px', lineHeight: '24px', margin: '0 0 14px' }
const step = { color: '#1f2937', fontSize: '15px', lineHeight: '22px', margin: '0 0 10px' }
const card = { backgroundColor: '#F1F6FB', borderRadius: '10px', padding: '8px 20px', margin: '8px 0 18px' }
const row = { color: '#0f172a', fontSize: '15px', margin: '10px 0', lineHeight: '20px' }
const rowLabel = { color: '#64748b', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '1px' }
const hr = { borderColor: '#e2e8f0', margin: '20px 0' }
const small = { color: '#64748b', fontSize: '13px', lineHeight: '20px', margin: '0 0 6px' }

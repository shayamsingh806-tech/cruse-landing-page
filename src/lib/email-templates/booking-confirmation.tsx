import * as React from 'react'
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  experience?: string
  bookingDate?: string
  guests?: number
  amount?: string
  paymentStatus?: string
  paymentId?: string
  bookingRef?: string
}

const Row = ({ label, value }: { label: string; value?: string | number | undefined }) => (
  <Text style={row}><span style={rowLabel}>{label}</span><br />{value ?? '—'}</Text>
)

const Email = ({ name, experience, bookingDate, guests, amount, paymentStatus, paymentId, bookingRef }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Canopus Marine booking is confirmed{experience ? ` — ${experience}` : ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={band}><Text style={brand}>CANOPUS MARINE</Text></Section>
        <Section style={content}>
          <Heading style={h1}>Booking confirmed</Heading>
          <Text style={text}>{name ? `Hi ${name},` : 'Hello,'}</Text>
          <Text style={text}>Thank you for booking with Canopus Marine. Here are your booking details:</Text>
          <Section style={card}>
            <Row label="Experience" value={experience} />
            <Row label="Date" value={bookingDate} />
            <Row label="Guests" value={guests} />
            <Row label="Amount" value={amount} />
            <Row label="Payment status" value={paymentStatus ?? 'Paid'} />
            {paymentId ? <Row label="Payment ID" value={paymentId} /> : null}
            {bookingRef ? <Row label="Order reference" value={bookingRef} /> : null}
          </Section>
          <Text style={text}>Please report 15 minutes before departure at Havelock Jetty and carry a valid photo ID. Our team may call you to confirm the timings.</Text>
          <Hr style={hr} />
          <Text style={small}>Questions? Just reply to this email, or call +91-99332-46262 / +91-99332-22257.</Text>
          <Text style={small}>Canopus Marine · Havelock Island & Port Blair, Andaman Islands</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Booking confirmed${d['experience'] ? ` — ${d['experience']}` : ''} | Canopus Marine`,
  displayName: 'Booking confirmation',
  previewData: {
    name: 'Priya', experience: 'Sunset Cruise', bookingDate: '12 Nov 2026', guests: 2,
    amount: '₹5,000', paymentStatus: 'Paid', paymentId: 'pay_ABC123', bookingRef: 'order_XYZ789',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '"DM Sans", Arial, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto' }
const band = { backgroundColor: '#0C417B', borderBottom: '3px solid #F5C518', padding: '18px 28px' }
const brand = { color: '#ffffff', fontSize: '16px', fontWeight: 700, letterSpacing: '2px', margin: 0 }
const content = { padding: '28px' }
const h1 = { color: '#0C417B', fontSize: '24px', margin: '0 0 16px' }
const text = { color: '#1f2937', fontSize: '15px', lineHeight: '24px', margin: '0 0 14px' }
const card = { backgroundColor: '#F1F6FB', borderRadius: '10px', padding: '8px 20px', margin: '8px 0 18px' }
const row = { color: '#0f172a', fontSize: '15px', margin: '10px 0', lineHeight: '20px' }
const rowLabel = { color: '#64748b', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '1px' }
const hr = { borderColor: '#e2e8f0', margin: '20px 0' }
const small = { color: '#64748b', fontSize: '13px', lineHeight: '20px', margin: '0 0 6px' }

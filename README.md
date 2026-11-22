# Kerala car rentals, vacation and holidays — website starter

A responsive Next.js + TypeScript + Tailwind CSS starter for a Kerala taxi and tours business. It includes tour cards, service highlights, a trip enquiry form, WhatsApp handoff, SEO metadata, and an optional Supabase database.

## Requirements

- Node.js 20.9 or newer
- npm
- A code editor such as VS Code

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

On Windows PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`.

## Configure your business details

The supplied `.env.local` is already configured with your business name and WhatsApp number. To change them later, edit `.env.local`:

```env
NEXT_PUBLIC_BUSINESS_NAME=Kerala car rentals, vacation and holidays
NEXT_PUBLIC_WHATSAPP_NUMBER=917989581582
```

Use your real WhatsApp number in international format with digits only (India: 91 followed by your 10-digit mobile number). Do not include +, spaces, or hyphens. Example format only: 919876543210. The WhatsApp number is configured as 917989581582. Confirm that this number is registered with WhatsApp and can receive customer enquiries.

## Enquiry form behaviour

- Without Supabase credentials, the form prepares the enquiry in WhatsApp. The customer must press Send in WhatsApp. No enquiry is stored automatically.
- With Supabase configured, the form inserts the enquiry into `booking_enquiries`.

To enable Supabase:
1. Create a project at https://supabase.com.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Copy the project URL and anon/public key from Project Settings → API.
4. Put them in `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Restart the development server.

Security notes:
- Never put a Supabase service-role key in a browser-accessible environment variable.
- Add rate limiting / bot protection and validate the form server-side before production.
- The supplied public insert policy is a starter, not a complete production security review.
- Build a protected owner dashboard separately; do not expose enquiry records through public database policies.

## Build for production

```bash
npm run build
npm run start
```

Use a host and plan that permits commercial use. Verify current provider terms, quotas, and pricing before deployment.

## Before launch checklist

- Business name and WhatsApp number are configured. Replace or confirm the photos, routes, distances, prices, and other copy before launch.
- Use images you own or have permission to use.
- Review the draft package prices and inclusions in `src/app/page.tsx`; these are editable suggestions based on ₹3,200/day, 220 km/day and ₹17/km extra, not verified market rates.
- Add business address/contact details, privacy policy, terms, cancellation policy, and applicable tax information.
- Confirm applicable permits, commercial vehicle requirements, and insurance for your operation.
- Add server-side validation, spam protection, monitoring, and a protected admin dashboard.
- Test mobile layout, WhatsApp flow, enquiry storage, accessibility, and production build.


## Customer WhatsApp itinerary delivery

The booking form has two separate WhatsApp actions:
- Send itinerary and quotation to the customer's entered WhatsApp number through the server-side Cloud API. The customer must tick the consent checkbox first.
- Open a prefilled enquiry to the business WhatsApp number. The customer must press Send in WhatsApp.

The endpoint is `POST /api/send-itinerary` and defaults to the approved template `kerala_trip_itinerary` in English. The template must have six body placeholders in this order: customer name, route, travel dates, duration/travellers/trip type, distance and included/extra kilometres, fare breakdown and total.

Set `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ITINERARY_TEMPLATE`, `WHATSAPP_TEMPLATE_LANGUAGE`, and `WHATSAPP_GRAPH_API_VERSION` as server-side Vercel environment variables. Never expose the access token in client code or a `NEXT_PUBLIC_` variable. Meta accepting a request is not proof of final delivery.

When Supabase is configured, the form saves the enquiry in the existing `booking_enquiries` table. The start date is stored in `travel_date`; the end date and fare estimate are included in `notes`, matching the existing schema.

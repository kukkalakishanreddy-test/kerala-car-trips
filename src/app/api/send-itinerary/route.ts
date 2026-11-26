import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function clean(value: unknown, max = 500): string {
  return String(value ?? "Not provided")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, max) || "Not provided";
}

export async function POST(request: NextRequest) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName =
    process.env.WHATSAPP_ITINERARY_TEMPLATE || "kerala_tours_quotation";
  const language = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en";
  const graphVersion = process.env.WHATSAPP_GRAPH_API_VERSION || "v26.0";

  if (!token || !phoneNumberId) {
    return NextResponse.json(
      { error: "WhatsApp Cloud API credentials are missing on the server." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body.phone !== "string" ||
    typeof body.name !== "string" ||
    typeof body.pickup !== "string" ||
    typeof body.destination !== "string" ||
    typeof body.travelDate !== "string" ||
    typeof body.itinerary !== "string" ||
    typeof body.total !== "string"
  ) {
    return NextResponse.json(
      { error: "Some quotation details are missing. Please check the form." },
      { status: 400 }
    );
  }

  const to = body.phone.replace(/\D/g, "");

  if (to.length < 10 || to.length > 15) {
    return NextResponse.json(
      { error: "Enter a valid WhatsApp number with country code." },
      { status: 400 }
    );
  }

  /*
   * Keep the Meta template message short.
   *
   * The complete itinerary is intentionally NOT sent through
   * the template variable because Meta can reject long translated
   * template text with error 132005.
   *
   * {{1}} Customer name
   * {{2}} Pickup location
   * {{3}} Destination
   * {{4}} Travel dates
   * {{5}} Short quotation summary
   * {{6}} Total quotation
   */

  const shortQuotation = [
    "4-day Kerala Grand Scenic Circuit",
    "₹3,500/day",
    "130 km/day FREE",
    "Extra distance: ₹17/km",
  ].join(" | ");

  const parameters = [
    clean(body.name, 80),
    clean(body.pickup, 80),
    clean(body.destination, 100),
    clean(body.travelDate, 80),
    clean(shortQuotation, 250),
    clean(body.total, 50),
  ];

  try {
    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "template",
          template: {
            name: templateName,
            language: { code: language },
            components: [
              {
                type: "body",
                parameters: parameters.map((text) => ({
                  type: "text",
                  text,
                })),
              },
            ],
          },
        }),
        cache: "no-store",
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const metaMessage =
        result?.error?.message || "WhatsApp could not send the quotation.";

      const metaCode = result?.error?.code;

      return NextResponse.json(
        {
          error: `${metaMessage} (Meta error ${
            metaCode ?? "unknown"
          }). Please check the template name, language, approval and API credentials.`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        "WhatsApp accepted your quotation for delivery. Please check the customer's WhatsApp account.",
      messageId: result?.messages?.[0]?.id || null,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not connect to WhatsApp. Please try again." },
      { status: 502 }
    );
  }
}
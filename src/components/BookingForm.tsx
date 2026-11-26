
"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  RefreshCw,
  Send,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type FormValues = {
  name: string;
  phone: string;
  fromDate: string;
  toDate: string;
  travellers: string;
  tripType: string;
  notes: string;
};

const STANDARD_RATE_PER_DAY = 3500;
const STANDARD_INCLUDED_KM_PER_DAY = 130;
const KOCHI_RATE_PER_DAY = 2000;
const KOCHI_INCLUDED_KM_PER_DAY = 130;
const EXTRA_KM_RATE = 17;

const BUSINESS_PICKUP = "Kochi";
const CIRCUIT_DESTINATION = "Kerala Grand Scenic Circuit";
const KOCHI_DESTINATION = "Kochi local sightseeing";

const today = new Date().toISOString().split("T")[0];

const initial: FormValues = {
  name: "",
  phone: "",
  fromDate: today,
  toDate: "",
  travellers: "2",
  tripType: "Kerala grand scenic circuit",
  notes: "",
};

function formatDate(date: string) {
  if (!date) return "Not selected";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function customerWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 10) return `91${digits}`;

  if (digits.length >= 11 && digits.length <= 15) return digits;

  return "";
}

export default function BookingForm() {
  const [values, setValues] = useState<FormValues>(initial);

  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");

  const [message, setMessage] = useState("");
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [showQuotation, setShowQuotation] = useState(false);

  const isCircuit = values.tripType === "Kerala grand scenic circuit";

  const displayedDestination = isCircuit
    ? CIRCUIT_DESTINATION
    : KOCHI_DESTINATION;

  const set = (key: keyof FormValues, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
  };

  const handleFromDateChange = (value: string) => {
    set("fromDate", value);

    // Clear the end date if it is now before the selected start date.
    if (values.toDate && value && values.toDate < value) {
      setValues((v) => ({
        ...v,
        fromDate: value,
        toDate: "",
      }));
    }
  };

  const handleTripTypeChange = (value: string) => {
    setValues((v) => ({
      ...v,
      tripType: value,
    }));
  };

  const estimate = useMemo(() => {
    if (!values.fromDate || !values.toDate) return null;

    const start = new Date(`${values.fromDate}T00:00:00`);
    const end = new Date(`${values.toDate}T00:00:00`);

    const diff = Math.round(
      (end.getTime() - start.getTime()) / 86400000
    );

    if (!Number.isFinite(diff) || diff < 0) return null;

    const isKochi = values.tripType === "Kochi local trip";

    // Count both the starting date and ending date.
    const days = diff + 1;

    // Kerala Grand Scenic Circuit must be exactly four calendar days.
    if (!isKochi && days !== 4) return null;

    const ratePerDay = isKochi
      ? KOCHI_RATE_PER_DAY
      : STANDARD_RATE_PER_DAY;

    const includedKmPerDay = isKochi
      ? KOCHI_INCLUDED_KM_PER_DAY
      : STANDARD_INCLUDED_KM_PER_DAY;

    const base = days * ratePerDay;

    return {
      days,
      includedKmPerDay,
      ratePerDay,
      base,
      total: base,
    };
  }, [values.fromDate, values.toDate, values.tripType]);

  const quotationText = () => {
    if (!estimate) return "";

    return [
      `Trip quotation - ${
        process.env.NEXT_PUBLIC_BUSINESS_NAME ||
        "Kerala car rentals, vacation and holidays"
      }`,
      `Name: ${values.name || "Not provided"}`,
      `Customer mobile: ${values.phone || "Not provided"}`,
      `Route: ${BUSINESS_PICKUP} to ${displayedDestination}`,
      `From Date: ${formatDate(values.fromDate)}`,
      `To Date: ${formatDate(values.toDate)}`,
      `Duration: ${estimate.days} day(s)`,
      `Daily rate: ₹${estimate.ratePerDay.toLocaleString("en-IN")} per day`,
      `${estimate.includedKmPerDay} km/day FREE`,
      `Additional distance beyond allowance: ₹${EXTRA_KM_RATE}/km`,
      `Estimated base fare: ₹${estimate.base.toLocaleString("en-IN")}`,
      `Estimated total: ₹${estimate.total.toLocaleString("en-IN")}`,
      `Travellers: ${values.travellers}`,
      `Trip type: ${values.tripType}`,
      `Additional details: ${values.notes || "None"}`,
      "Additional distance charges, if applicable, will be confirmed separately. Final fare is subject to operator confirmation.",
    ].join("\n");
  };

  async function sendItineraryToCustomer() {
    setMessage("");

    if (!values.name.trim()) {
      setStatus("error");
      setMessage("Please enter your name.");
      return;
    }

    if (!estimate) {
      setStatus("error");
      setMessage(
        isCircuit
          ? "Please select exactly four days for the Kerala Grand Scenic Circuit."
          : "Please select valid travel dates."
      );
      return;
    }

    const number = customerWhatsAppNumber(values.phone);

    if (!number) {
      setStatus("error");
      setMessage(
        "Enter a valid mobile number with country code (or a 10-digit Indian mobile number)."
      );
      return;
    }

    if (!whatsappConsent) {
      setStatus("error");
      setMessage(
        "Please confirm that you agree to receive this quotation on WhatsApp."
      );
      return;
    }

    setStatus("sending");

    try {
      const response = await fetch("/api/send-itinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: number,
          name: values.name.trim(),
          pickup: BUSINESS_PICKUP,
          destination: displayedDestination,

          travelDate: `${formatDate(values.fromDate)} to ${formatDate(
            values.toDate
          )}`,

          itinerary: [
            `From Date: ${formatDate(values.fromDate)}`,
            `To Date: ${formatDate(values.toDate)}`,
            `Duration: ${estimate.days} day(s)`,
            `Travellers: ${values.travellers}`,
            `Trip type: ${values.tripType}`,
            `Route: ${BUSINESS_PICKUP} to ${displayedDestination}`,
            `${estimate.includedKmPerDay} km/day FREE`,
            `Additional distance charge: ₹${EXTRA_KM_RATE}/km beyond allowance`,
            `Daily rate: ₹${estimate.ratePerDay.toLocaleString("en-IN")}`,
            `Base fare: ₹${estimate.base.toLocaleString("en-IN")}`,
            `Additional requests: ${values.notes.trim() || "None"}`,
          ].join("\n"),

          total: `₹${estimate.total.toLocaleString("en-IN")}`,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to send your quotation."
        );
      }

      setStatus("success");
      setMessage(
        "WhatsApp accepted your quotation for delivery. Please check the customer's WhatsApp account. Delivery confirmation may take a moment."
      );
      setShowQuotation(true);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to send your quotation right now."
      );
    }
  }

  function checkFreshFare() {
    if (!estimate) {
      setStatus("error");
      setMessage(
        isCircuit
          ? "Please select exactly four days for the Kerala Grand Scenic Circuit."
          : "Please check your travel dates."
      );
      return;
    }

    setStatus("idle");
    setMessage(
      isCircuit
        ? "Fare recalculated for your selected four-day Kerala Grand Scenic Circuit dates."
        : "Fare recalculated using your latest travel dates and trip type."
    );
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setStatus("sending");
    setMessage("");

    if (!estimate) {
      setStatus("error");
      setMessage(
        isCircuit
          ? "Please select exactly four days for the Kerala Grand Scenic Circuit."
          : "Please select a valid date range."
      );
      return;
    }

    const number = (
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "917989581582"
    ).replace(/\D/g, "");

    if (!number) {
      setStatus("error");
      setMessage(
        "WhatsApp is not configured. Please contact the business directly."
      );
      return;
    }

    const whatsappWindow = window.open("about:blank", "_blank");

    if (!whatsappWindow) {
      setStatus("error");
      setMessage(
        "Please allow pop-ups for this website, then submit your enquiry again."
      );
      return;
    }

    const enquiryNotes = [
      values.notes.trim(),
      `Trip: ${displayedDestination}`,
      `From Date: ${formatDate(values.fromDate)}`,
      `To Date: ${formatDate(values.toDate)}`,
      `Duration: ${estimate.days} day(s)`,
      `Estimated fare: ₹${estimate.total.toLocaleString("en-IN")}`,
      `${estimate.includedKmPerDay} km/day FREE`,
      `Additional distance charge: ₹${EXTRA_KM_RATE}/km beyond allowance`,
    ]
      .filter(Boolean)
      .join("\n");

    if (supabase) {
      const { error } = await supabase
        .from("booking_enquiries")
        .insert({
          name: values.name.trim(),
          phone: values.phone.trim(),
          pickup: BUSINESS_PICKUP,
          destination: displayedDestination,
          travel_date: values.fromDate || null,
          travellers: Number(values.travellers),
          trip_type: values.tripType,
          notes: enquiryNotes,
        });

      if (error) {
        whatsappWindow.close();
        setStatus("error");
        setMessage(
          "We couldn't save your enquiry. Please try again or contact us on WhatsApp."
        );
        return;
      }
    }

    const text = [
      "NEW TRIP ENQUIRY - PLEASE CHECK AVAILABILITY",
      "",
      quotationText(),
      "",
      "Please contact the customer to confirm availability and the final fare. This is an enquiry, not a confirmed booking.",
    ].join("\n");

    whatsappWindow.opener = null;

    whatsappWindow.location.href = `https://wa.me/${number}?text=${encodeURIComponent(
      text
    )}`;

    setStatus("success");

    setMessage(
      supabase
        ? "Your enquiry has been saved. WhatsApp has opened with the details for our team; please press Send."
        : "WhatsApp has opened with your enquiry addressed to the business number. Please press Send in WhatsApp to deliver it."
    );
  }

  return (
    <form className="booking-form card" onSubmit={submit}>
      {showQuotation ? (
        <div className="quotation-result" aria-live="polite">
          <div className="quotation-success-icon">
            <CheckCircle2 size={30} />
          </div>

          <span className="eyebrow">QUOTATION SENT</span>
          <h3>Your trip quotation</h3>

          <p className="quotation-accepted">
            WhatsApp accepted your quotation for delivery.
          </p>

          <p className="quotation-check">
            Please check the customer's WhatsApp account. The message may take
            a little time to arrive.
          </p>

          <div className="quotation-trip">
            <div>
              <small>CUSTOMER</small>
              <strong>{values.name}</strong>
            </div>

            <div>
              <small>YOUR ROUTE</small>
              <strong>
                {BUSINESS_PICKUP} → {displayedDestination}
              </strong>
            </div>

            <div>
              <small>TRAVEL DATES</small>
              <strong>
                {formatDate(values.fromDate)} – {formatDate(values.toDate)}
              </strong>
            </div>

            <div>
              <small>TRAVELLERS / TRIP TYPE</small>
              <strong>
                {values.travellers} · {values.tripType}
              </strong>
            </div>
          </div>

          <div className="quotation-breakdown">
            <div>
              <span>Duration</span>
              <strong>{estimate?.days} day(s)</strong>
            </div>

            <div>
              <span>Daily rate</span>
              <strong>
                ₹{estimate?.ratePerDay.toLocaleString("en-IN")}
              </strong>
            </div>

            <div>
              <span>130 km/day FREE</span>
            </div>

            <div>
              <span>Base fare</span>
              <strong>
                ₹{estimate?.base.toLocaleString("en-IN")}
              </strong>
            </div>

            <div>
              <span>Additional distance rate</span>
              <strong>₹{EXTRA_KM_RATE}/km</strong>
            </div>

            <div className="quotation-total">
              <span>Estimated total</span>
              <strong>
                ₹{estimate?.total.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>

          {values.notes.trim() && (
            <div className="quotation-notes">
              <strong>Additional requests</strong>
              <p>{values.notes}</p>
            </div>
          )}

          <p className="quotation-disclaimer">
            Your daily fare includes 130 km of travel per day at no extra
            distance charge. Additional distance beyond the included allowance
            is charged at ₹17/km and will be confirmed separately. Tolls,
            parking, permits and other applicable charges are extra. This is
            an indicative estimate and does not confirm a booking.
          </p>

          <button
            className="btn btn-outline quotation-edit-btn"
            type="button"
            onClick={() => {
              setShowQuotation(false);
              setStatus("idle");
              setMessage("");
            }}
          >
            <RefreshCw size={16} /> Back to edit trip details
          </button>
        </div>
      ) : (
        <>
          <div className="form-heading">
            <span className="form-step">01</span>
            <div>
              <h3>Plan your trip</h3>
              <p>
                Enter your details to view the quotation and contact our team.
              </p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="name">YOUR NAME *</label>
              <input
                id="name"
                required
                autoComplete="name"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <div className="form-field">
              <label htmlFor="phone">YOUR MOBILE / WHATSAPP *</label>
              <input
                id="phone"
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                pattern="[+0-9() -]{8,20}"
                value={values.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="form-field">
              <label htmlFor="tripType">TYPE OF TRIP</label>

              <select
                id="tripType"
                value={values.tripType}
                onChange={(e) => handleTripTypeChange(e.target.value)}
              >
                <option value="Kochi local trip">Kochi local trip</option>
                <option value="Kerala grand scenic circuit">
                  Kerala grand scenic circuit
                </option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="travellers">TRAVELLERS</label>

              <select
                id="travellers"
                value={values.travellers}
                onChange={(e) => set("travellers", e.target.value)}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "person" : "people"}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="fromDate">FROM DATE *</label>

              <input
                id="fromDate"
                required
                type="date"
                min={today}
                value={values.fromDate}
                onChange={(e) => handleFromDateChange(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="toDate">TO DATE *</label>

              <input
                id="toDate"
                required
                type="date"
                min={values.fromDate || today}
                value={values.toDate}
                onChange={(e) => set("toDate", e.target.value)}
              />

              {isCircuit && (
                <small>
                  Please select the final date of your four-day circuit.
                </small>
              )}
            </div>

            <div className="form-field form-field-wide">
              <label htmlFor="notes">ANY DETAILS? (OPTIONAL)</label>

              <textarea
                id="notes"
                rows={2}
                value={values.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Places you want to visit, luggage or other requests..."
              />
            </div>
          </div>

          <div className="fare-estimate" aria-live="polite">
            <div className="fare-estimate-head">
              <div>
                <span className="eyebrow">YOUR TRIP ESTIMATE</span>
                <h4>Estimated total amount</h4>
              </div>

              <strong>
                ₹{estimate ? estimate.total.toLocaleString("en-IN") : "—"}
              </strong>
            </div>

            {estimate ? (
              <div className="fare-breakdown">
                <span>
                  {estimate.days} day(s) × ₹
                  {estimate.ratePerDay.toLocaleString("en-IN")} = ₹
                  {estimate.base.toLocaleString("en-IN")}
                </span>

                <span>{estimate.includedKmPerDay} km/day FREE.</span>

                <small>
                  Additional distance beyond the included allowance is ₹
                  {EXTRA_KM_RATE}/km and will be confirmed separately. Tolls,
                  parking, permits and other applicable charges are extra.
                </small>
              </div>
            ) : (
              <small>
                {isCircuit && values.fromDate && values.toDate
                  ? "The Kerala Grand Scenic Circuit requires exactly four calendar days. Please check your selected dates."
                  : "Please select your travel dates to view the fare estimate."}
              </small>
            )}
          </div>

          <div className="fare-actions">
            <button
              className="btn btn-outline"
              type="button"
              onClick={checkFreshFare}
            >
              <RefreshCw size={16} /> Check fresh route price
            </button>

            <button
              className="btn btn-secondary"
              type="button"
              onClick={sendItineraryToCustomer}
              disabled={status === "sending"}
            >
              <Send size={16} /> Send quotation to my WhatsApp
            </button>
          </div>

          <label className="whatsapp-consent">
            <input
              type="checkbox"
              checked={whatsappConsent}
              onChange={(e) => setWhatsappConsent(e.target.checked)}
            />

            I agree to receive this trip quotation on the WhatsApp number
            entered above.
          </label>

          <div className="enquiry-action-note">
            <strong>Or, send an enquiry to our team</strong>

            <span>
              This opens WhatsApp with all the details you entered. Review the
              message and press Send. Our team will check availability and
              contact you.
            </span>
          </div>

          <button
            className="btn btn-primary submit-btn"
            type="submit"
            disabled={status === "sending"}
          >
            <>
              Send enquiry to our WhatsApp <ArrowRight size={17} />
            </>
          </button>

          {message && (
            <div
              className={`form-message ${
                status === "error" ? "error" : "success"
              }`}
              role="status"
            >
              {status === "error" ? (
                <MessageCircle size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}

              {message}
            </div>
          )}

          <p className="privacy-note">
            Option 1 sends the estimated quotation to the customer's entered
            WhatsApp number from the business WhatsApp API. This requires the
            owner's Meta WhatsApp Cloud API credentials and an approved
            message template. Option 2 opens the customer's WhatsApp with the
            complete enquiry addressed to the business number; the customer
            must press Send before the owner receives it. Neither option
            confirms a booking.
          </p>
        </>
      )}
    </form>
  );
}

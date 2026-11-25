
"use client";

import { useEffect, useRef, useState } from "react";

const destinations = [
  {
    name: "Athirappilly",
    subtitle: "Experience the magnificent waterfalls",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Athirappilly%20waterfalls.jpg?width=1200",
    video: "/videos/athirappilly.mp4",
  },
  {
    name: "Munnar",
    subtitle: "Discover misty mountains and tea gardens",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Munnar%20Tea%20Plantations-WUS07368.jpg?width=1200",
    video: "/videos/munnar.mp4",
  },
  {
    name: "Thekkady",
    subtitle: "Explore forests, wildlife and beautiful lakes",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Thekkady%20Boating.JPG?width=1200",
    video: "/videos/thekkady.mp4",
  },
  {
    name: "Alleppey",
    subtitle: "Enjoy the peaceful backwaters and houseboats",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Sun%20rise%20view%20Alleppey%20backwaters%20%2C%20Kerala%2003.jpg?width=1200",
    video: "/videos/alleppey.mp4",
  },
  {
    name: "Kumarakom",
    subtitle: "Relax in Kerala's beautiful backwater village",
    image:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Backwaters%20in%20Kumarakom%2C%20Kottayam%20district.jpg?width=1200",
    video: "/videos/kumarakom.mp4",
  },
];

export default function KeralaCircuitCard() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  const activeDestination = destinations[activeIndex];

  function cancelClose() {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function scheduleClose() {
    cancelClose();

    closeTimerRef.current = window.setTimeout(() => {
      setPreviewOpen(false);
      setIsCardHovered(false);
      closeTimerRef.current = null;
    }, 300);
  }

  function openPreview(index: number) {
    cancelClose();
    setActiveIndex(index);
    setPreviewOpen(true);
    setIsCardHovered(true);
  }

  function closePreview() {
    cancelClose();
    setPreviewOpen(false);
    setIsCardHovered(false);
  }

  function showNext() {
    const nextIndex = (activeIndex + 1) % destinations.length;
    openPreview(nextIndex);
  }

  function showPrevious() {
    const previousIndex =
      (activeIndex - 1 + destinations.length) % destinations.length;
    openPreview(previousIndex);
  }

  // Automatically change destinations every 4 seconds.
  useEffect(() => {
    if (isCardHovered || previewOpen) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % destinations.length);
    }, 4000);

    return () => window.clearInterval(interval);
  }, [isCardHovered, previewOpen]);

  // Play the selected destination video from the beginning.
  useEffect(() => {
    const video = videoRef.current;

    if (!previewOpen || !video) return;

    video.currentTime = 0;

    video.play().catch(() => {
      console.warn("Video playback requires another user interaction.");
    });

    return () => {
      video.pause();
    };
  }, [activeIndex, previewOpen]);

  // Clean up the closing timer.
  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      className="kerala-circuit-wrapper"
      onMouseEnter={() => {
        cancelClose();
        setIsCardHovered(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <article className="kerala-circuit-card">
        <div className="circuit-card-heading">
  <h3>Kerala Grand Scenic Circuit</h3>

  <p>
    Waterfalls • Tea Gardens • Hills • Wildlife • Backwaters
  </p>
</div>

        {/* HORIZONTAL DESTINATION SLIDER */}
        <div className="circuit-destinations">
          <div
            className="circuit-slider-track"
            style={{
              transform: `translateX(-${activeIndex * 100}%)`,
            }}
          >
            {destinations.map((destination, index) => (
              <button
                key={destination.name}
                type="button"
                className="circuit-destination"
                onMouseEnter={() => openPreview(index)}
                onFocus={() => openPreview(index)}
                onClick={() => openPreview(index)}
                aria-label={`Watch ${destination.name} video preview`}
                tabIndex={activeIndex === index ? 0 : -1}
              >
                <img
                  src={destination.image}
                  alt={`${destination.name} Kerala scenery`}
                />

                <span className="destination-image-overlay" />

                <span className="destination-info">
                  <strong>{destination.name}</strong>
                  <small>{destination.subtitle}</small>
                </span>

                <span className="destination-play">▶</span>
              </button>
            ))}
          </div>

          {/* LEFT ARROW */}
          <button
            type="button"
            className="circuit-arrow circuit-arrow-left"
            onClick={showPrevious}
            aria-label="Previous destination"
          >
            &#10094;
          </button>

          {/* RIGHT ARROW */}
          <button
            type="button"
            className="circuit-arrow circuit-arrow-right"
            onClick={showNext}
            aria-label="Next destination"
          >
            &#10095;
          </button>

          <span className="circuit-slide-count">
            {String(activeIndex + 1).padStart(2, "0")} / 05
          </span>
        </div>

        {/* TOUR DETAILS */}
        <div className="tour-content">
          <div className="tour-meta">
            <span>📍 Kerala, India</span>
            <span>🚘 Private Taxi</span>
            <span>🗺️ 5 Destinations</span>
          </div>

          <h3>Kerala Grand Scenic Circuit</h3>



          <p className="tour-route-details">
            <strong>Tour Route:</strong>
            <br />
            Athirappilly → Munnar → Thekkady → Alleppey → Kumarakom
          </p>

          {/* FARE AND ENQUIRY BUTTON */}
          <div className="tour-bottom">
            <div className="tour-price">
              ₹0
              <small>Temporary fare • To be updated</small>
            </div>

            <a
              href="#booking"
              className="round-arrow"
              aria-label="Enquire about Kerala Grand Scenic Circuit"
            >
              →
            </a>
          </div>
        </div>
      </article>

      {/* FLOATING VIDEO PREVIEW ON THE RIGHT */}
      {previewOpen && (
        <aside
          className="cinematic-preview"
          aria-label={`${activeDestination.name} video preview`}
          onMouseEnter={() => {
            cancelClose();
            setIsCardHovered(true);
          }}
          onMouseLeave={scheduleClose}
        >
          <video
            key={`blur-${activeDestination.video}`}
            className="cinematic-blur-background"
            src={activeDestination.video}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />

          <div className="cinematic-dark-overlay" />

          <video
            key={activeDestination.video}
            ref={videoRef}
            className="cinematic-main-video"
            src={activeDestination.video}
            autoPlay
            muted
            playsInline
            preload="metadata"
            onTimeUpdate={(event) => {
              const video = event.currentTarget;

              if (video.currentTime >= 10) {
                video.pause();
                video.currentTime = 10;
              }
            }}
          />

          <button
            type="button"
            className="cinematic-close"
            onClick={closePreview}
            aria-label="Close video preview"
          >
            ×
          </button>

          <div className="cinematic-caption">
            <span>DISCOVER KERALA</span>
            <h2>{activeDestination.name}</h2>
            <p>{activeDestination.subtitle}</p>

            <div className="cinematic-duration">
              <span>▶</span> 10-second scenic preview
            </div>
          </div>

          <div className="cinematic-destination-switcher">
            {destinations.map((destination, index) => (
              <button
                key={destination.name}
                type="button"
                className={
                  activeIndex === index
                    ? "cinematic-dot active"
                    : "cinematic-dot"
                }
                onClick={() => openPreview(index)}
                aria-label={`Preview ${destination.name}`}
                title={destination.name}
              />
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}

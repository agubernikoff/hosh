import {useEffect, useRef, useState} from 'react';

export default function InfiniteCarousel({
  images,
  interval = 5000,
  width = 100,
}) {
  const [index, setIndex] = useState(1); // Start at real first slide
  const trackRef = useRef(null);
  const timeoutRef = useRef(null);
  const isTransitioningRef = useRef(false);
  const isAnimatingRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(null);

  const extendedImages = [
    images[images.length - 1], // clone last
    ...images,
    images[0], // clone first
  ];

  const resetTimer = () => {
    clearTimeout(timeoutRef.current);

    // Reset progress stroke instantly
    if (progressRef.current) {
      progressRef.current.style.transition = 'none';
      progressRef.current.style.strokeDashoffset = 100;
    }

    // Animate progress after slight delay
    setTimeout(() => {
      if (progressRef.current) {
        progressRef.current.style.transition = `stroke-dashoffset ${interval}ms linear`;
        progressRef.current.style.strokeDashoffset = 0;
      }
    }, 20);

    timeoutRef.current = setTimeout(() => {
      if (index <= images.length && !isAnimatingRef.current) {
        handleNext(true);
      }
    }, interval);
  };

  useEffect(() => {
    resetTimer();
    return () => clearTimeout(timeoutRef.current);
  }, [index]);

  useEffect(() => {
    const track = trackRef.current;
    track.style.transition = isTransitioningRef.current
      ? 'transform 0.5s ease'
      : 'none';
    track.style.transform = `translateX(-${index * width}vw)`;
  }, [index]);

  useEffect(() => {
    const track = trackRef.current;

    const handleTransitionEnd = () => {
      isAnimatingRef.current = false;

      if (index === 0) {
        isTransitioningRef.current = false;
        requestAnimationFrame(() => {
          setIndex(images.length);
          resetTimer(); // <-- restart timer after jump
        });
      } else if (index === images.length + 1) {
        isTransitioningRef.current = false;
        requestAnimationFrame(() => {
          setIndex(1);
          resetTimer(); // <-- restart timer after jump
        });
      }
    };

    track.addEventListener('transitionend', handleTransitionEnd);
    return () =>
      track.removeEventListener('transitionend', handleTransitionEnd);
  }, [index]);

  const handleNext = (auto = false) => {
    if (isAnimatingRef.current) return; // block extra clicks
    isTransitioningRef.current = true;
    isAnimatingRef.current = true;
    setIndex((prev) => prev + 1);
    if (!auto) resetTimer();
  };

  const handlePrev = () => {
    if (isAnimatingRef.current) return; // block extra clicks
    isTransitioningRef.current = true;
    isAnimatingRef.current = true;
    setIndex((prev) => prev - 1);
    resetTimer();
  };

  return (
    <div
      className="carousel-wrapper"
      style={{
        overflow: 'hidden',
        position: 'relative',
        width: `${width}vw`,
        margin: 'auto',
      }}
    >
      <div
        ref={trackRef}
        className="carousel-track"
        style={{
          display: 'flex',
          width: `${extendedImages.length * width}vw`,
        }}
      >
        {extendedImages.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Slide ${i}`}
            style={{
              width: `${width}vw`,
              flexShrink: 0,
              objectFit: 'cover',
            }}
          />
        ))}
      </div>

      <button
        onClick={handlePrev}
        style={{
          position: 'absolute',
          left: '5%',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
        }}
      >
        <Left />
      </button>

      <button
        onClick={handleNext}
        style={{
          position: 'absolute',
          right: '5%',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'white',
          padding: 0,
          border: 'none',
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 36 36"
          xmlns="http://www.w3.org/2000/svg"
          style={{position: 'absolute', top: 0, left: 0}}
        >
          <circle
            cx="18"
            cy="18"
            r="16"
            stroke="#ddd"
            strokeWidth="3"
            fill="none"
          />
          <circle
            ref={progressRef}
            cx="18"
            cy="18"
            r="16"
            stroke="black"
            strokeWidth="3"
            fill="none"
            strokeDasharray={100}
            strokeDashoffset={100}
            strokeLinecap="round"
          />
        </svg>
        <Right />
      </button>
    </div>
  );
}

function Right() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="18"
        cy="18"
        r="18"
        transform="rotate(-180 18 18)"
        fill="white"
      />
      <path
        d="M14.4206 8.41822C14.1513 8.68609 14 9.04934 14 9.4281C14 9.80687 14.1513 10.1701 14.4206 10.438L21.5322 17.5086L14.4206 24.5793C14.1589 24.8487 14.0141 25.2095 14.0174 25.584C14.0207 25.9585 14.1718 26.3168 14.4381 26.5816C14.7045 26.8465 15.0648 26.9967 15.4415 26.9999C15.8182 27.0032 16.1811 26.8592 16.4521 26.599L24.5794 18.5185C24.8487 18.2506 25 17.8874 25 17.5086C25 17.1299 24.8487 16.7666 24.5794 16.4987L16.4521 8.41822C16.1827 8.15043 15.8173 8 15.4364 8C15.0554 8 14.6901 8.15043 14.4206 8.41822Z"
        fill="black"
      />
    </svg>
  );
}

function Left() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="18" cy="18" r="18" fill="white" />
      <path
        d="M21.5794 27.5818C21.8487 27.3139 22 26.9507 22 26.5719C22 26.1931 21.8487 25.8299 21.5794 25.562L14.4678 18.4914L21.5794 11.4207C21.8411 11.1513 21.9859 10.7905 21.9826 10.416C21.9793 10.0415 21.8282 9.68321 21.5619 9.41837C21.2955 9.15353 20.9352 9.00331 20.5585 9.00005C20.1818 8.9968 19.8189 9.14078 19.5479 9.40097L11.4206 17.4815C11.1513 17.7494 11 18.1126 11 18.4914C11 18.8701 11.1513 19.2334 11.4206 19.5013L19.5479 27.5818C19.8173 27.8496 20.1827 28 20.5636 28C20.9446 28 21.3099 27.8496 21.5794 27.5818Z"
        fill="black"
      />
    </svg>
  );
}

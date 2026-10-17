/** Art-deco compass: a double ring, a long-pointed four-way star over short diagonal points, and a faceted center. Draws in the surrounding text colour (the theme's primary when the header is themed). */
export default function CompassLogo({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} role="img" aria-label="Compass" className="nav-compass">
      <g fill="none" stroke="currentColor">
        <circle cx="20" cy="20" r="18.2" strokeWidth="1.6" />
        <circle cx="20" cy="20" r="15" strokeWidth="0.8" />
        <path d="M20 1.8 V5.2 M20 34.8 V38.2 M1.8 20 H5.2 M34.8 20 H38.2" strokeWidth="1.6" strokeLinecap="square" />
      </g>
      <path d="M20 4.5 L23.4 20 L20 35.5 L16.6 20 Z" fill="currentColor" />
      <path d="M4.5 20 L20 16.6 L35.5 20 L20 23.4 Z" fill="currentColor" opacity="0.55" />
      <path d="M9.8 9.8 L21.4 18.6 L30.2 30.2 L18.6 21.4 Z M30.2 9.8 L21.4 21.4 L9.8 30.2 L18.6 18.6 Z" fill="currentColor" opacity="0.28" />
      <path d="M20 14.6 L25.4 20 L20 25.4 L14.6 20 Z" fill="var(--t-background, #fff)" stroke="currentColor" strokeWidth="1.2" />
      <path d="M20 17.6 L22.4 20 L20 22.4 L17.6 20 Z" fill="currentColor" />
    </svg>
  );
}

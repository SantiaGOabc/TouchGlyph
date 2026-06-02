interface Props {
  size?: number;
}

const TouchGlyphLogo = ({ size = 32 }: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="TouchGlyph Logo"
  >
    <g transform="translate(24,24) rotate(90)">
      <circle cx="-10.4" cy="-6" r="3.6" fill="#2ae585"/>
      <circle cx="0" cy="-12" r="3.6" fill="#2ae585"/>
      <circle cx="0" cy="12" r="3.6" fill="#2ae585"/>
      <circle cx="10.4" cy="6" r="3.6" fill="#2ae585"/>
      <circle cx="-10.4" cy="6" r="3.6" fill="#cccccc"/>
      <circle cx="10.4" cy="-6" r="3.6" fill="#cccccc"/>
      <path d="M -10.4 -6 L 0 -12 L 0 12 L 10.4 6"
            stroke="#2ae585"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"/>
    </g>
  </svg>
);

export default TouchGlyphLogo;

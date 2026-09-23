import React from 'react';

interface GovtEmblemProps {
  className?: string;
  emblemSize?: string;
  showSubtitle?: boolean;
}

export const GovtEmblem: React.FC<GovtEmblemProps> = ({
  className = '',
  emblemSize = 'h-9 w-auto',
  showSubtitle = true,
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Authentic Ashoka Lion Capital of India Vector SVG */}
      <svg
        viewBox="0 0 100 125"
        className={`${emblemSize} shrink-0`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="State Emblem of India"
      >
        {/* Lions in Rich Ochre/Gold */}
        <g fill="#996515">
          {/* Central Lion Head & Mane */}
          <ellipse cx="50" cy="26" rx="11" ry="13" fill="#b47818" />
          <path d="M41 24 C41 15 45 10 50 10 C55 10 59 15 59 24 C62 26 63 31 61 35 C59 43 56 49 50 51 C44 49 41 43 39 35 C37 31 38 26 41 24 Z" fill="#996515" />
          {/* Central Muzzle & Ears */}
          <circle cx="43" cy="16" r="3" fill="#845009" />
          <circle cx="57" cy="16" r="3" fill="#845009" />
          <path d="M47 30 Q50 33 53 30 Q50 37 47 30 Z" fill="#6d4104" />
          <path d="M46 26 Q50 28 54 26 Q50 30 46 26 Z" fill="#d99b26" />

          {/* Left Lion Head & Profile */}
          <ellipse cx="32" cy="31" rx="9" ry="11" fill="#a36b13" />
          <circle cx="27" cy="22" r="2.5" fill="#754705" />
          <path d="M25 33 C23 31 22 28 24 25 C26 21 31 22 34 25 C37 28 37 34 35 38 C32 43 28 42 26 39 Z" fill="#8f5d0f" />

          {/* Right Lion Head & Profile */}
          <ellipse cx="68" cy="31" rx="9" ry="11" fill="#a36b13" />
          <circle cx="73" cy="22" r="2.5" fill="#754705" />
          <path d="M75 33 C77 31 78 28 76 25 C74 21 69 22 66 25 C63 28 63 34 65 38 C68 43 72 42 74 39 Z" fill="#8f5d0f" />

          {/* Lion Bodies & Paws Support */}
          <path d="M30 43 C30 55 35 68 38 74 C42 74 46 72 50 72 C54 72 58 74 62 74 C65 68 70 55 70 43 C64 48 57 51 50 51 C43 51 36 48 30 43 Z" fill="#996515" />
          <path d="M38 60 C38 68 42 74 46 74 L45 62 Z" fill="#7c4f0b" />
          <path d="M62 60 C62 68 58 74 54 74 L55 62 Z" fill="#7c4f0b" />
        </g>

        {/* Abacus / Circular Pedestal */}
        <rect x="14" y="75" width="72" height="6" rx="2" fill="#7a4f08" />
        <rect x="16" y="81" width="68" height="20" rx="1" fill="#faf6ee" stroke="#7a4f08" strokeWidth="1.5" />

        {/* Ashoka Chakra in Navy Blue on abacus */}
        <circle cx="50" cy="91" r="8.5" stroke="#000080" strokeWidth="2" fill="#ffffff" />
        <circle cx="50" cy="91" r="2.2" fill="#000080" />
        {/* Chakra spokes */}
        <path
          d="M50 82.5 V99.5 M41.5 91 H58.5 M44 85 L56 97 M44 97 L56 85 M42.2 87.5 L57.8 94.5 M42.2 94.5 L57.8 87.5 M46.5 82.8 L53.5 99.2 M53.5 82.8 L46.5 99.2"
          stroke="#000080"
          strokeWidth="0.8"
        />

        {/* Left Galloping Horse hint */}
        <path d="M22 93 C24 88 28 88 31 92 C29 94 27 95 24 95 C22 95 21 94 22 93 Z" fill="#85580a" />
        <circle cx="23" cy="89" r="1.5" fill="#85580a" />

        {/* Right Bull hint */}
        <path d="M78 93 C76 88 72 88 69 92 C71 94 73 95 76 95 C78 95 79 94 78 93 Z" fill="#85580a" />
        <circle cx="77" cy="89" r="1.5" fill="#85580a" />

        {/* Base Plinth */}
        <rect x="12" y="101" width="76" height="5" rx="1.5" fill="#6d4505" />

        {/* Satyameva Jayate Inscription */}
        <text
          x="50"
          y="117"
          textAnchor="middle"
          fontSize="9.5"
          fontFamily="serif, 'Noto Sans Devanagari', 'Mangal', 'Arial Unicode MS'"
          fontWeight="bold"
          fill="#5c3902"
          letterSpacing="0.8"
        >
          सत्यमेव जयते
        </text>
      </svg>

      {/* Typography side by side */}
      <div className="flex flex-col min-w-0">
        <span className="text-xs sm:text-[13px] font-black tracking-wider text-[#0b192c] uppercase leading-tight">
          GOVERNMENT OF INDIA
        </span>
        {showSubtitle && (
          <span className="text-[10px] sm:text-[11px] text-[#475569] font-medium tracking-tight leading-tight mt-0.5 truncate">
            Department of Public Procurement
          </span>
        )}
      </div>
    </div>
  );
};

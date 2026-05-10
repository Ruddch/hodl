import React from 'react';

export const TournamentIcon: React.FC<{
  width?: number | string;
  height?: number | string;
  className?: string;
  strokeColor?: string;
  strokeOpacity?: number;
}> = ({
  width = 22,
  height = 22,
  className,
  strokeColor = 'var(--nav-item-inactive)',
  strokeOpacity = 0.5,
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g clipPath="url(#clip0_169_7249)">
        <path
          d="M4.39893 10.2377L5.37499 13.8804M5.37499 13.8804L9.01773 12.9043M5.37499 13.8804L10.7083 4.64278M17.4579 11.6188L16.4818 7.97611M16.4818 7.97611L12.8391 8.95218M16.4818 7.97611L11.1485 17.2137"
          stroke={strokeColor}
          strokeOpacity={strokeOpacity}
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_169_7249">
          <rect width="16" height="16" fill="white" transform="translate(8) rotate(30)" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const LeaderboardIcon: React.FC<{
  width?: number | string;
  height?: number | string;
  className?: string;
  strokeColor?: string;
  strokeOpacity?: number;
}> = ({
  width = 16,
  height = 16,
  className,
  strokeColor = 'var(--nav-item-inactive)',
  strokeOpacity = 1,
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g clipPath="url(#clip0_169_7255)">
        <path
          d="M4.8068 10L1.77347 4.76004C1.64267 4.53396 1.58115 4.27443 1.59656 4.01369C1.61197 3.75295 1.70362 3.50248 1.86013 3.29337L2.93347 1.86671C3.05766 1.70111 3.21871 1.56671 3.40385 1.47414C3.58899 1.38157 3.79314 1.33337 4.00013 1.33337H12.0001C12.2071 1.33337 12.4113 1.38157 12.5964 1.47414C12.7816 1.56671 12.9426 1.70111 13.0668 1.86671L14.1335 3.29337C14.291 3.50181 14.3839 3.75194 14.4004 4.01269C14.417 4.27344 14.3567 4.53332 14.2268 4.76004L11.1935 10M7.33357 8.00001L3.41357 1.46667M8.66683 8.00001L12.5868 1.46667M5.3335 4.66671H10.6668M8.00016 12V10.6667H7.66683M11.3335 11.3334C11.3335 13.1743 9.84111 14.6667 8.00016 14.6667C6.15921 14.6667 4.66683 13.1743 4.66683 11.3334C4.66683 9.49242 6.15921 8.00004 8.00016 8.00004C9.84111 8.00004 11.3335 9.49242 11.3335 11.3334Z"
          stroke={strokeColor}
          strokeOpacity={strokeOpacity}
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_169_7255">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const CoinIcon: React.FC<{
  width?: number | string;
  height?: number | string;
  className?: string;
  strokeColor?: string;
  strokeOpacity?: number;
}> = ({
  width = 16,
  height = 16,
  className,
  strokeColor = "var(--nav-item-inactive)",
  strokeOpacity = 0.5,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g fill={strokeColor} fillOpacity={strokeOpacity} fillRule="evenodd" clipRule="evenodd">
      <path d="M5.791 3.318L3.316 5.793a1 1 0 000 1.414l2.475 2.475a1 1 0 001.415 0L9.68 7.207a1 1 0 000-1.414L7.206 3.318a1 1 0 00-1.415 0zm.707 4.95L4.731 6.5l1.767-1.768L8.266 6.5 6.498 8.268z" />
      <path d="M0 6.5a6.5 6.5 0 0112.346-2.845 6.5 6.5 0 11-8.691 8.691A6.5 6.5 0 010 6.5zm6.5-5a5 5 0 100 10 5 5 0 000-10zm6.5 5c0-.201-.01-.4-.027-.597a5 5 0 11-7.07 7.07A6.5 6.5 0 0013 6.5z" />
    </g>
  </svg>
);

export const PacksIcon: React.FC<{
  width?: number | string;
  height?: number | string;
  className?: string;
  strokeColor?: string;
  strokeOpacity?: number;
  fillColor?: string;
}> = ({
  width = 16,
  height = 16,
  className,
  strokeColor = 'var(--nav-item-inactive)',
  strokeOpacity = 0.5,
  fillColor = 'var(--icon-bg)',
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <mask id="path-1-inside-1_169_7258" fill="white">
        <rect x="7" y="2" width="6" height="9" rx="1" />
      </mask>
      <rect
        x="7"
        y="2"
        width="6"
        height="9"
        rx="1"
        stroke={strokeColor}
        strokeOpacity={strokeOpacity}
        strokeWidth="2.6"
        mask="url(#path-1-inside-1_169_7258)"
      />
      <mask id="path-2-inside-2_169_7258" fill="white">
        <rect x="5" y="4" width="6" height="9" rx="1" />
      </mask>
      <rect
        x="5"
        y="4"
        width="6"
        height="9"
        rx="1"
        fill={fillColor}
        stroke={strokeColor}
        strokeOpacity={strokeOpacity}
        strokeWidth="2.6"
        mask="url(#path-2-inside-2_169_7258)"
      />
      <mask id="path-3-inside-3_169_7258" fill="white">
        <rect x="3" y="6" width="6" height="9" rx="1" />
      </mask>
      <rect
        x="3"
        y="6"
        width="6"
        height="9"
        rx="1"
        fill={fillColor}
        stroke={strokeColor}
        strokeOpacity={strokeOpacity}
        strokeWidth="2.6"
        mask="url(#path-3-inside-3_169_7258)"
      />
    </svg>
  );
};

/** Молоток и наковальня — для раздела Forge / кузницы */
export const ForgeIcon: React.FC<{
  width?: number | string;
  height?: number | string;
  className?: string;
  strokeColor?: string;
  strokeOpacity?: number;
}> = ({
  width = 16,
  height = 16,
  className,
  strokeColor = "var(--nav-item-inactive)",
  strokeOpacity = 0.5,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M11.5 1.75L7.25 6M10.25 1h3v2.25h-2L10.25 1z"
      stroke={strokeColor}
      strokeOpacity={strokeOpacity}
      strokeWidth="1.33"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 12.75h12M3.5 9.5h9l1.25 3.25H2.25l1.25-3.25z"
      stroke={strokeColor}
      strokeOpacity={strokeOpacity}
      strokeWidth="1.33"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ArcadeIcon: React.FC<{
  width?: number | string;
  height?: number | string;
  className?: string;
  strokeColor?: string;
  strokeOpacity?: number;
}> = ({
  width = 16,
  height = 16,
  className,
  strokeColor = "var(--nav-item-inactive)",
  strokeOpacity = 0.5,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M2 5.5C2 4.67 2.67 4 3.5 4h9c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5h-9C2.67 12 2 11.33 2 10.5v-5z"
      stroke={strokeColor}
      strokeOpacity={strokeOpacity}
      strokeWidth="1.33"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 7H4M5 6v2"
      stroke={strokeColor}
      strokeOpacity={strokeOpacity}
      strokeWidth="1.33"
      strokeLinecap="round"
    />
    <circle cx="10.5" cy="7.5" r="0.75" fill={strokeColor} fillOpacity={strokeOpacity} />
    <circle cx="12" cy="6.5" r="0.75" fill={strokeColor} fillOpacity={strokeOpacity} />
  </svg>
);

export const CopyIcon: React.FC<{
  width?: number | string;
  height?: number | string;
  className?: string;
  strokeColor?: string;
}> = ({
  width = 16,
  height = 16,
  className,
  strokeColor = "currentColor",
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke={strokeColor}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

/** Иконка пыли для баланса dust. */
export const DustIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    preserveAspectRatio="xMidYMid meet"
    className={`${className} mb-[0.1em] m-0`}
    aria-hidden
  >
    <g transform="translate(0,512) scale(0.1,-0.1)" fill="currentColor" stroke="none">
      <path d="M1212 5080 c-52 -32 -72 -74 -72 -152 l0 -68 -67 0 c-50 0 -77 -5 -101 -20 -68 -42 -91 -124 -52 -188 32 -52 74 -72 153 -72 l67 0 0 -67 c0 -111 59 -179 149 -170 85 9 131 70 131 175 l0 62 63 0 c104 0 165 46 174 131 9 90 -59 149 -169 149 l-68 0 0 68 c0 49 -5 76 -20 100 -26 42 -76 72 -120 72 -19 0 -50 -9 -68 -20z" />
      <path d="M2952 4940 c-94 -57 -94 -183 0 -240 41 -25 82 -25 127 -2 101 51 106 183 9 242 -18 11 -49 20 -68 20 -19 0 -50 -9 -68 -20z" />
      <path d="M4323 4846 c-181 -44 -334 -202 -372 -384 -35 -166 15 -330 138 -453 71 -70 138 -109 236 -134 304 -78 615 167 615 485 0 274 -233 503 -508 499 -31 0 -80 -6 -109 -13z m232 -300 c84 -50 126 -168 91 -260 -36 -93 -132 -154 -226 -143 -149 18 -241 171 -181 302 57 124 199 169 316 101z" />
      <path d="M2301 4289 c-209 -18 -446 -64 -654 -128 -112 -34 -140 -49 -167 -94 -36 -58 -29 -80 126 -388 80 -160 144 -293 142 -295 -2 -2 -32 6 -67 16 -81 26 -110 25 -152 -3 -65 -43 -86 -124 -49 -185 27 -45 66 -66 181 -98 55 -15 99 -31 99 -36 0 -5 -176 -307 -391 -671 -216 -364 -409 -696 -429 -737 -43 -85 -70 -162 -96 -276 -23 -95 -26 -346 -6 -439 33 -154 101 -315 184 -438 54 -79 175 -206 257 -268 86 -65 264 -153 373 -184 158 -44 209 -46 963 -42 613 3 719 6 776 20 237 58 425 164 581 325 131 136 217 277 271 447 42 131 51 192 52 350 0 155 -12 230 -57 369 -33 102 -80 185 -487 873 -215 364 -391 666 -391 670 0 5 45 21 99 37 117 33 154 54 181 98 39 64 16 146 -52 188 -41 25 -70 25 -149 0 -35 -10 -65 -18 -67 -16 -2 2 62 135 142 295 101 201 146 301 146 324 0 47 -37 98 -90 124 -92 45 -398 119 -615 148 -144 19 -509 27 -654 14z m-400 -949 c239 -58 503 -85 744 -77 238 9 359 27 693 104 23 5 22 2 -18 -76 l-41 -82 36 -63 36 -64 -88 -20 c-465 -107 -952 -107 -1406 -1 l-88 21 36 64 36 63 -41 81 c-22 44 -36 80 -31 80 6 0 65 -13 132 -30z" />
      <path d="M455 3967 c-114 -38 -191 -104 -238 -205 -29 -60 -32 -76 -31 -157 0 -104 26 -174 88 -243 149 -165 387 -173 542 -18 152 152 148 386 -8 532 -69 64 -141 95 -236 100 -48 2 -92 -1 -117 -9z m144 -282 c74 -38 58 -150 -24 -171 -52 -13 -116 38 -115 93 1 43 50 92 93 93 10 0 31 -7 46 -15z" />
      <path d="M4252 3400 c-52 -32 -72 -74 -72 -152 l0 -68 -67 0 c-50 0 -77 -5 -101 -20 -68 -42 -91 -124 -52 -188 32 -52 74 -72 153 -72 l67 0 0 -67 c0 -111 59 -179 149 -170 85 9 131 70 131 175 l0 62 63 0 c104 0 165 46 174 131 9 90 -59 149 -169 149 l-68 0 0 68 c0 49 -5 76 -20 100 -26 42 -76 72 -120 72 -19 0 -50 -9 -68 -20z" />
      <path d="M572 2840 c-52 -32 -72 -74 -72 -152 l0 -68 -67 0 c-79 0 -121 -20 -153 -72 -39 -64 -16 -146 52 -188 24 -15 51 -20 101 -20 l67 0 0 -67 c0 -111 59 -179 149 -170 85 9 131 70 131 175 l0 62 63 0 c104 0 165 46 174 131 9 90 -59 149 -169 149 l-68 0 0 68 c0 49 -5 76 -20 100 -26 42 -76 72 -120 72 -19 0 -50 -9 -68 -20z" />
    </g>
  </svg>
);

export const CheckIcon: React.FC<{
  width?: number | string;
  height?: number | string;
  className?: string;
  strokeColor?: string;
}> = ({
  width = 16,
  height = 16,
  className,
  strokeColor = "currentColor",
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke={strokeColor}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

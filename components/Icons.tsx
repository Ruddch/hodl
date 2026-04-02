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

/** Иконка пыли (game-icons: powder) для баланса dust. */
export const DustIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    className={className}
    aria-hidden
  >
    <path
      fill="currentColor"
      d="M345.98 19.586c-1.09-.01-2.16.003-3.21.04-14.725.51-25.865 5.643-32.153 14.51-7.185 10.132-7.67 24.62-.822 41.247 6.846 16.626 21.065 34.485 40.953 48.572 19.888 14.088 41.458 21.58 59.426 22.527 17.968.95 31.494-4.31 38.68-14.443 7.185-10.134 7.668-24.622.822-41.25-6.847-16.626-21.065-34.484-40.953-48.57-19.89-14.09-41.46-21.58-59.428-22.53a80.08 80.08 0 0 0-3.316-.104zM298.22 94.19l-18.843 26.57c-.426.6-.822 1.21-1.2 1.824-9.132-2.42-18.316-3.953-27.396-4.45a106.558 106.558 0 0 0-11.038-.047c-25.606 1.223-49.86 11.905-66.183 34.923L42.173 338.283l3.36 5.295 73.284 115.496 139.416 32.256 131.534-185.48c18.69-26.36 18.7-57.108 7.337-84.4-4.775-11.47-11.45-22.476-19.53-32.764l17.872-25.206c-6.33-1.17-12.76-2.914-19.21-5.216l-14.682 20.705c-3.764 5.305-9.15 7.028-17.74 6.096-8.592-.93-19.306-5.348-28.565-11.812-9.26-6.464-17.03-14.963-20.744-22.662-3.714-7.7-3.917-13.336.115-19.022l14.816-20.888c-4.288-5.357-8.05-10.877-11.217-16.49zm-53.087 42.453c1.526.015 3.067.065 4.623.15 7.63.42 15.552 1.76 23.556 3.896.07 6.236 1.67 12.445 4.36 18.02 5.657 11.73 15.496 21.918 26.88 29.866 11.385 7.95 24.345 13.67 37.25 15.07 7.192.78 14.702-.048 21.356-2.92 7.02 8.99 12.742 18.416 16.694 27.907 9.56 22.965 9.542 45.436-5.33 66.406l-12.932 18.237-94.926-49.017 23.775-33.528-15.245-10.81-29.174 41.14-147.077 29.477 89.86-126.72c12.97-18.29 30.85-26.31 51.795-27.115a94.695 94.695 0 0 1 4.535-.062zM93.418 298.33l92.094 48.057-61.254 86.377-59.582-93.9 28.742-40.534zm262.506 22.938-105.686 149.03-111.408-25.775 67.33-94.945 149.764-28.31z"
    />
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

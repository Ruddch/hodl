"use client";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={`w-[24px] h-[24px] text-black flex items-center justify-center overflow-hidden shrink-0 ${className ?? ""}`}>
      <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path d="M6.41047 2.35023e-08C6.12406 1.09829e-08 5.90162 0.249602 5.93447 0.534121L7.44135 13.5852C7.46927 13.8269 7.67398 14.0094 7.91735 14.0094L10.8684 14.0094C11.133 14.0094 11.3475 13.7949 11.3475 13.5302L11.3475 0.479161C11.3475 0.214527 11.133 2.2993e-07 10.8684 2.18363e-07L6.41047 2.35023e-08Z" fill="black"/>
        <path d="M4.93694 14.0098C5.22335 14.0098 5.44579 13.7602 5.41294 13.4756L3.90606 0.424584C3.87814 0.182819 3.67343 0.000380437 3.43006 0.000380427L0.479051 0.000380298C0.214417 0.000380286 -0.0001105 0.214908 -0.000110512 0.479542L-0.000111082 13.5306C-0.000111094 13.7952 0.214417 14.0098 0.47905 14.0098L4.93694 14.0098Z" fill="black"/>
        <rect x="4.00781" y="5.53418" width="4.06272" height="1.68113" transform="rotate(15 4.00781 5.53418)" fill="black"/>
      </svg>
    </div>
  );
}

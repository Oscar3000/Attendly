/**
 * QR Code component for displaying QR codes in the Attendly application
 * Renders an exact image when provided, else a minimal placeholder.
 */
import type { BaseComponentProps } from "@/lib/types";
import { cn } from "@/lib/utils";

interface QrCodeProps extends BaseComponentProps {
  /** Optional image source for an exact QR code (base64 or URL). If provided, takes precedence. */
  src?: string;
  /** Size of the QR code in pixels */
  size?: number;
  /** Alt text for accessibility */
  alt?: string;
}

export function QrCode({ className, src, size = 200, alt = "QR Code" }: QrCodeProps) {

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "12px",
  };

  if (src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-white border-2 border-gray-200 shadow-sm",
          className
        )}
        style={containerStyle}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          style={{
            width: size - 8,
            height: size - 8,
            objectFit: "contain",
            borderRadius: "10px",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-white border-2 border-gray-200 shadow-sm",
        className
      )}
      style={containerStyle}
      role="img"
      aria-label={alt}
    >
      <svg
        width={size * 0.9}
        height={size * 0.9}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-black"
      >
        <rect x="10" y="10" width="30" height="30" fill="currentColor" />
        <rect x="15" y="15" width="20" height="20" fill="white" />
        <rect x="20" y="20" width="10" height="10" fill="currentColor" />
        <rect x="160" y="10" width="30" height="30" fill="currentColor" />
        <rect x="165" y="15" width="20" height="20" fill="white" />
        <rect x="170" y="20" width="10" height="10" fill="currentColor" />
        <rect x="10" y="160" width="30" height="30" fill="currentColor" />
        <rect x="15" y="165" width="20" height="20" fill="white" />
        <rect x="20" y="170" width="10" height="10" fill="currentColor" />
        <rect x="90" y="90" width="20" height="20" fill="currentColor" />
        <rect x="95" y="95" width="10" height="10" fill="white" />
      </svg>
    </div>
  );
}


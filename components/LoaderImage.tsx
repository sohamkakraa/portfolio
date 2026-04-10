"use client";

import { useState } from "react";

type LoaderImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  skeletonClassName?: string;
};

export default function LoaderImage({
  src,
  alt,
  className,
  skeletonClassName,
  onLoad,
  ...rest
}: LoaderImageProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | undefined>(undefined);
  const loaded = !!src && loadedSrc === src;

  return (
    <>
      {!loaded ? (
        <div
          aria-hidden="true"
          className={`image-loader-skeleton absolute inset-0 ${skeletonClassName || ""}`}
        />
      ) : null}
      <img
        key={typeof src === "string" ? src : String(src)}
        src={src}
        alt={alt}
        onLoad={(event) => {
          setLoadedSrc(typeof src === "string" ? src : undefined);
          onLoad?.(event);
        }}
        className={`${className || ""} transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        {...rest}
      />
    </>
  );
}

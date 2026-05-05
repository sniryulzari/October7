/* eslint-disable react/prop-types */

/**
 * AccessibleImage — forces a deliberate accessibility decision on every image.
 *
 * Usage — meaningful image:
 *   <AccessibleImage src="..." alt="תיאור מלא של התמונה" />
 *
 * Usage — decorative image (screen readers skip it):
 *   <AccessibleImage src="..." decorative />
 *
 * Omitting both `alt` and `decorative` throws in development so the mistake is
 * caught before it reaches production.
 */
export default function AccessibleImage({
  src,
  alt,
  decorative = false,
  className = "",
  ...rest
}) {
  if (process.env.NODE_ENV !== "production" && !decorative && !alt) {
    throw new Error(
      "AccessibleImage: provide `alt` text for meaningful images, or `decorative` for purely visual ones."
    );
  }

  return (
    <img
      src={src}
      alt={decorative ? "" : alt}
      role={decorative ? "presentation" : undefined}
      className={className}
      {...rest}
    />
  );
}

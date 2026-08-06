interface StructuredDataProps {
  data: unknown;
}

function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD must be emitted as script content.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

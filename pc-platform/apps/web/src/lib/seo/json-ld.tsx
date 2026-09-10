import * as React from 'react';

export interface JsonLdProps {
  data: Record<string, any> | Array<Record<string, any>>;
}

/**
 * Renders an inline script with application/ld+json payload
 */
export function JsonLd({ data }: JsonLdProps) {
  if (!data) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, process.env.NODE_ENV === 'development' ? 2 : 0),
      }}
    />
  );
}

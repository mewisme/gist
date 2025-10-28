import { Metadata } from 'next';

const SITE_NAME = 'Gist';
const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export interface MetadataConfig {
  title: string;
  description: string;
  ogImagePath?: string;
  type?: 'website' | 'article';
  authors?: string[];
  keywords?: string[];
}

export function generateMetadata(config: MetadataConfig): Metadata {
  const {
    title,
    description,
    ogImagePath,
    type = 'website',
    authors,
    keywords,
  } = config;

  const fullTitle = title.includes(SITE_NAME) ? title : `${title} - ${SITE_NAME}`;
  const ogImage = ogImagePath ? `${SITE_URL}${ogImagePath}` : `${SITE_URL}/api/og`;

  return {
    title: fullTitle,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type,
      siteName: SITE_NAME,
      url: SITE_URL,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(authors && { authors }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}


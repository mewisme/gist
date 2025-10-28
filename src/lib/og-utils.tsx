/* eslint-disable @next/next/no-img-element */

import { ImageResponse } from '@vercel/og';

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export interface OGImageProps {
  title: string;
  description?: string;
  author?: string;
  authorAvatar?: string;
  tags?: string[];
  type?: 'gist' | 'user' | 'default';
}

// Helper to load logo
async function getLogoDataUrl() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const logoUrl = `${baseUrl}/icon-logo.png`;
    const response = await fetch(logoUrl);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('Failed to load logo:', error);
    return null;
  }
}

export async function generateOGImage(props: OGImageProps) {
  const { title, description, author, authorAvatar, tags, type = 'default' } = props;

  const logoDataUrl = await getLogoDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          padding: '60px 80px',
        }}
      >
        {/* Header with title and avatar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              flex: 1,
              maxWidth: '800px',
            }}
          >
            <h1
              style={{
                fontSize: title.length > 40 ? '52px' : '64px',
                fontWeight: 'bold',
                color: '#1f2937',
                lineHeight: 1.2,
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {title}
            </h1>

            {description && (
              <p
                style={{
                  fontSize: '28px',
                  color: '#6b7280',
                  margin: 0,
                  lineHeight: 1.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {description}
              </p>
            )}
          </div>

          {/* Avatar - Only show if authorAvatar exists */}
          {authorAvatar && (
            <img
              src={authorAvatar}
              alt={author || 'Author'}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '16px',
                objectFit: 'cover',
                flexShrink: 0,
                marginLeft: '40px',
              }}
            />
          )}
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '40px',
            }}
          >
            {tags.slice(0, 4).map((tag, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '24px',
                  fontSize: '22px',
                  color: '#4b5563',
                  fontWeight: '500',
                  border: '2px solid #e5e7eb',
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        )}

        {/* Footer Stats */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
            paddingTop: '40px',
            borderTop: '2px solid #e5e7eb',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '40px',
            }}
          >
            {/* Gist branding */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: logoDataUrl ? 'transparent' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                {logoDataUrl ? (
                  <img
                    src={logoDataUrl}
                    alt="Gist"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                    }}
                  />
                ) : (
                  '< />'
                )}
              </div>
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                }}
              >
                Gist
              </span>
            </div>
          </div>

          <div
            style={{
              fontSize: '24px',
              color: '#9ca3af',
              fontWeight: '500',
            }}
          >
            gist.mewis.me
          </div>
        </div>
      </div>
    ),
    {
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
    }
  );
}


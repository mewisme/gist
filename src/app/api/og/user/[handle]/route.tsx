/* eslint-disable @next/next/no-img-element */

import { ImageResponse } from '@vercel/og';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

import { db, users } from '@/lib/db';
import { GistRepository } from '@/lib/repositories/gist-repository';

export const runtime = 'nodejs';

const WIDTH = 1200;
const HEIGHT = 630;

const gistRepository = new GistRepository();

let interRegular: ArrayBuffer | null = null;
let interBold: ArrayBuffer | null = null;

async function loadFonts() {
  if (!interRegular) {
    interRegular = await fetch(
      'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/files/inter-latin-400-normal.woff'
    ).then(r => r.arrayBuffer());
  }
  if (!interBold) {
    interBold = await fetch(
      'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.16/files/inter-latin-700-normal.woff'
    ).then(r => r.arrayBuffer());
  }
}

async function getLogoDataUrl() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/icon-logo.png`);
    const buf = await res.arrayBuffer();
    return `data:image/png;base64,${Buffer.from(buf).toString('base64')}`;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;

  await loadFonts();
  const logoDataUrl = await getLogoDataUrl();

  try {
    const rows = await db.select().from(users).where(eq(users.handle, handle)).limit(1);
    if (rows.length === 0) return notFound();

    const user = rows[0];

    return renderUserCard(user, logoDataUrl);
  } catch (error) {
    console.error(error);
    return notFound();
  }
}

function renderUserCard(user: any, logoDataUrl: string | null) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#fff', position: 'relative',
          fontFamily: 'Inter'
        }}
      >
        <div
          style={{
            position: 'absolute', top: 110, width: 360, height: 360,
            borderRadius: 40,
            background: 'radial-gradient(closest-side, rgba(0,0,0,0.10), rgba(0,0,0,0))',
            filter: 'blur(26px)'
          }}
        />

        {/* Avatar wrapper (1 child) */}
        <div
          style={{
            width: 280, height: 280, borderRadius: 32,
            background: user.photoUrl ? 'transparent' : '#F3F4F6',
            color: '#9CA3AF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 92, fontWeight: 700,
            boxShadow: user.photoUrl ? '0 24px 80px rgba(0,0,0,0.18)' : '0 24px 80px rgba(0,0,0,0.12)',
            marginBottom: 22
          }}
        >
          {user.photoUrl ? (
            <img
              src={user.photoUrl}
              alt={user.displayName ?? user.handle}
              style={{ width: 280, height: 280, borderRadius: 32, objectFit: 'cover' }}
            />
          ) : (
            (user.displayName ?? user.handle).slice(0, 1).toUpperCase()
          )}
        </div>

        {/* Name (text only) */}
        <div
          style={{
            display: 'flex',  // ✅ thêm explicit display
            alignItems: 'center', justifyContent: 'center',
            fontSize: 74, fontWeight: 700, color: '#1F2937',
            lineHeight: 1.05, marginTop: 0, marginBottom: 6
          }}
        >
          {user.displayName ?? user.handle}
        </div>

        {/* Handle (text only) */}
        <div
          style={{
            display: 'flex',  // ✅ explicit display
            alignItems: 'center', justifyContent: 'center',
            fontSize: 30, color: '#6B7280', marginBottom: 28
          }}
        >
          @{user.handle}
        </div>

        {/* Footer (2 children) */}
        <div
          style={{
            position: 'absolute', bottom: 36,
            display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12
          }}
        >
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 6,
              background: logoDataUrl ? 'transparent' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              color: '#fff', fontSize: 16, fontWeight: 700
            }}
          >
            {logoDataUrl ? (
              <img src={logoDataUrl} alt="Gist" style={{ width: 32, height: 32, borderRadius: 6 }} />
            ) : (
              '</>'
            )}
          </div>
          <span style={{ fontSize: 20, color: '#9CA3AF' }}>gist.mewis.me</span>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: 'Inter', data: interRegular!, weight: 400, style: 'normal' },
        { name: 'Inter', data: interBold!, weight: 700, style: 'normal' }
      ]
    }
  );
}

function notFound() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#fff', fontFamily: 'Inter',
          color: '#111827', fontSize: 52, fontWeight: 700
        }}
      >
        User Not Found
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: 'Inter', data: interRegular!, weight: 400, style: 'normal' },
        { name: 'Inter', data: interBold!, weight: 700, style: 'normal' }
      ]
    }
  );
}

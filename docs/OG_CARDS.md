# Open Graph (OG) Cards Implementation

This document describes the dynamic Open Graph card system implemented for all pages with SSR.

## Overview

The OG card system generates dynamic, beautiful preview images for all pages when shared on social media platforms like Twitter, Facebook, LinkedIn, etc.

## Features

- **Dynamic OG Images**: Generated server-side using `@vercel/og`
- **SSR Support**: All images are generated at runtime with fresh data
- **Consistent Design**: Modern gradient design with dark theme
- **Type-Specific Cards**: Different layouts for gists, users, and default pages
- **Performance**: Edge runtime for fast generation
- **SEO Optimized**: Proper metadata for Twitter and OpenGraph

## Architecture

### 1. Utilities

#### `src/lib/og-utils.tsx`
Core OG image generation utility that creates beautiful preview cards with:
- Gradient background with dot pattern
- Gist branding logo
- Dynamic title and description
- Author information
- Language tags for code snippets
- Responsive text sizing

#### `src/lib/metadata-utils.ts`
Centralized metadata generation helper that:
- Generates consistent OpenGraph and Twitter metadata
- Handles OG image paths
- Supports custom titles, descriptions, and keywords
- Manages metadata base URL

### 2. OG Image Routes

All routes use Edge runtime for performance and generate images dynamically.

#### `/api/og` (Default)
Default OG image for home page and generic pages.

#### `/api/og/gist/[gistId]`
Dynamic OG image for gist pages featuring:
- Gist title/filename
- Description
- Author name
- Programming language tags

#### `/api/og/user/[handle]`
Dynamic OG image for user profile pages showing:
- User display name
- User handle
- Total gist count

### 3. Page Integration

All pages use the `generateMetadata` utility for consistency:

```typescript
import { generateMetadata as genMetadata } from '@/lib/metadata-utils';

export const metadata = genMetadata({
  title: 'Your Page Title',
  description: 'Your page description',
  ogImagePath: '/api/og', // or dynamic path
  keywords: ['optional', 'keywords'],
});
```

## Pages with OG Cards

✅ **Home Page** - Static OG card
✅ **Gist Pages** - Dynamic per gist
✅ **User Profiles** - Dynamic per user
✅ **Discover/Search** - Static OG card
✅ **Embed Pages** - Dynamic per gist
✅ **Edit Pages** - Dynamic per gist
✅ **Revision Pages** - Dynamic per gist
✅ **Auth Pages** (Sign In/Up) - Static OG card
✅ **Settings** - Static OG card
✅ **Import** - Static OG card

## Design Specifications

- **Size**: 1200x630px (optimal for all platforms)
- **Background**: Dark (#09090b) with dot pattern
- **Brand Colors**: Blue to purple gradient (#3b82f6 to #8b5cf6)
- **Typography**: 
  - Title: 56-72px (responsive to length)
  - Description: 28px
  - Tags: 20px
  - Author: 24px

## Testing OG Cards

### Local Development
1. Start the dev server: `pnpm dev`
2. Access OG images directly:
   - Default: `http://localhost:3000/api/og`
   - Gist: `http://localhost:3000/api/og/gist/[gistId]`
   - User: `http://localhost:3000/api/og/user/[handle]`

### Social Media Debuggers
Test how your OG cards appear on different platforms:

- **Twitter**: https://cards-dev.twitter.com/validator
- **Facebook**: https://developers.facebook.com/tools/debug/
- **LinkedIn**: https://www.linkedin.com/post-inspector/

## Environment Variables

Ensure `NEXT_PUBLIC_BASE_URL` is set correctly:

```env
NEXT_PUBLIC_BASE_URL=https://gist.mewis.me
```

This is used for:
- Generating absolute OG image URLs
- Fetching gist/user data in OG image routes
- Setting metadata base

## Best Practices

1. **Always use absolute URLs** for OG images (handled by metadataBase)
2. **Keep titles concise** - they truncate after 2 lines
3. **Provide meaningful descriptions** - max 2 lines display
4. **Test on multiple platforms** before deploying
5. **Monitor image generation performance** using edge runtime metrics

## Troubleshooting

### OG Images Not Showing
1. Check `NEXT_PUBLIC_BASE_URL` is set correctly
2. Verify the OG image route is accessible
3. Clear social media cache using debuggers above
4. Check browser network tab for 404s

### Image Generation Errors
1. Check Edge runtime logs in production
2. Verify data fetching works in OG routes
3. Test with sample IDs that exist in database

### Performance Issues
1. All routes use Edge runtime for speed
2. Images are generated on-demand (no caching by default)
3. Consider adding caching headers in production if needed

## Future Enhancements

Potential improvements:

- [ ] Add custom fonts for better typography
- [ ] Include gist code preview in OG image
- [ ] Add user avatar images
- [ ] Generate different sizes for different platforms
- [ ] Add caching layer for frequently accessed images
- [ ] Support custom OG images uploaded by users
- [ ] Add gist statistics (stars, forks) to OG cards

## Dependencies

- `@vercel/og` (v0.8.5): OG image generation
- Next.js 16: App Router and Edge Runtime support

## References

- [Vercel OG Image Documentation](https://vercel.com/docs/functions/edge-functions/og-image-generation)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)


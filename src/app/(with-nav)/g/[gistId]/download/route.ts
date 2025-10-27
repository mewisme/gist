import { NextRequest, NextResponse } from 'next/server';

import { GistRepository } from '@/lib/repositories/gist-repository';

const gistRepository = new GistRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gistId: string }> }
) {
  try {
    const { gistId } = await params;

    const gist = await gistRepository.getGistById(gistId);
    if (!gist) {
      return NextResponse.json({ error: 'Gist not found' }, { status: 404 });
    }

    const zipContent = await createZipFileWithJSZip(gist.files);

    return new NextResponse(zipContent as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${gistId}.zip"`,
        'Content-Length': zipContent.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error creating ZIP download:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function createZipFileWithJSZip(files: Array<{ filename: string; content: string }>): Promise<Uint8Array> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  files.forEach(file => {
    zip.file(file.filename, file.content);
  });

  return await zip.generateAsync({ type: 'uint8array' });
}
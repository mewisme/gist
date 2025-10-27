'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';

import { Code, CodeBlock, CodeHeader } from '@/components/animate-ui/components/animate/code';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ClientCodeBlockProps {
  file: {
    id: string;
    filename: string;
    language: string;
    content: string;
    size: number;
  };
  gistId: string;
  header?: React.ReactNode;
}

export function ClientCodeBlock({ file, gistId, header }: ClientCodeBlockProps) {
  const { resolvedTheme } = useTheme();

  return (
    <div className="w-full">
      <Code code={file.content} className="w-full max-w-none">
        <CodeHeader copyButton={true}>
          <div className="flex flex-row items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2">
              {!header ? (
                <span className="font-medium text-sm sm:text-base">{file.filename}</span>
              ) : (
                header
              )}

              <Badge variant="outline" className="text-xs hidden md:visible">
                {file.language}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/r/${gistId}/${file.id}`} target="_blank">
                  Raw
                </Link>
              </Button>
            </div>
          </div>
        </CodeHeader>
        <CodeBlock
          key={`${file.id}-${resolvedTheme}`}
          theme={resolvedTheme === 'light' ? 'light' : 'dark'}
          themes={{
            light: "github-light",
            dark: "github-dark"
          } as const}
          lang={file.language}
          writing={false}
          className="w-full overflow-x-auto [&>pre]:overflow-x-auto [&_code]:overflow-x-auto [&_code]:font-mono [&_code]:text-xs sm:[&_code]:text-sm [&_code]:leading-relaxed"
        />
      </Code>
    </div>
  );
}

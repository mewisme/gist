'use client';

import { Download, ExternalLink, Github, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { importGistFromGitHub } from '@/app/actions/gist-actions';
import { useAuth } from '@/components/auth/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface GitHubGistFile {
  filename: string;
  type: string;
  language: string;
  raw_url: string;
  size: number;
  content?: string;
}

interface GitHubGist {
  id: string;
  description: string;
  public: boolean;
  created_at: string;
  updated_at: string;
  files: Record<string, GitHubGistFile>;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export function ImportGistPageClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [gistUrl, setGistUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [githubGist, setGithubGist] = useState<GitHubGist | null>(null);
  const [error, setError] = useState('');

  const extractGistId = (url: string): string | null => {
    const patterns = [
      /github\.com\/gist\/([a-f0-9]+)/,
      /gist\.github\.com\/([a-f0-9]+)/,
      /gist\.github\.com\/([a-zA-Z0-9_-]+)\/([a-f0-9]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[match.length - 1]; // Get the last match (gist ID)
      }
    }
    return null;
  };

  const fetchGitHubGist = async () => {
    if (!gistUrl.trim()) {
      setError('Please enter a GitHub Gist URL');
      return;
    }

    const gistId = extractGistId(gistUrl);
    if (!gistId) {
      setError('Invalid GitHub Gist URL. Please use a valid gist.github.com URL');
      return;
    }

    setLoading(true);
    setError('');
    setGithubGist(null);

    try {
      const response = await fetch(`https://api.github.com/gists/${gistId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Gist not found. Please check the URL and try again.');
        }
        throw new Error('Failed to fetch gist from GitHub');
      }

      const gist: GitHubGist = await response.json();

      // Fetch file contents
      const filesWithContent = await Promise.all(
        Object.entries(gist.files).map(async ([filename, file]) => {
          try {
            const contentResponse = await fetch(file.raw_url);
            const content = await contentResponse.text();
            return {
              filename: file.filename || filename,
              language: file.language || 'text',
              content,
            };
          } catch (error) {
            console.error(`Failed to fetch content for ${filename}:`, error);
            return {
              filename: file.filename || filename,
              language: file.language || 'text',
              content: `// Failed to load content for ${filename}`,
            };
          }
        })
      );

      setGithubGist({
        ...gist,
        files: filesWithContent.reduce((acc, file) => {
          acc[file.filename] = {
            filename: file.filename,
            type: 'text',
            language: file.language,
            raw_url: '',
            size: file.content.length,
            content: file.content,
          };
          return acc;
        }, {} as Record<string, GitHubGistFile>),
      });
    } catch (error) {
      console.error('Error fetching GitHub gist:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch gist');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!githubGist || !user) return;

    setImporting(true);

    try {
      const files = Object.entries(githubGist.files).map(([filename, file]) => ({
        filename: file.filename || filename,
        language: (file.language).toLowerCase() || 'text',
        content: file.content || '',
      }));

      const result = await importGistFromGitHub({
        description: githubGist.description || 'Imported from GitHub',
        visibility: githubGist.public ? 'public' : 'secret',
        tags: ['imported', 'github'],
        files,
        githubUrl: gistUrl,
      });

      if (result.success && result.data) {
        toast.success('Gist imported successfully!');
        router.push(`/g/${result.data.id}`);
      } else {
        toast.error(result.error || 'Failed to import gist');
      }
    } catch (error) {
      console.error('Error importing gist:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setImporting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 md:mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Import from GitHub</h1>
          <p className="text-muted-foreground">
            Import gists from GitHub to share them here
          </p>
        </div>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">Please sign in to import gists</h2>
          <Button onClick={() => router.push('/signin')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Import from GitHub</h1>
        <p className="text-muted-foreground">
          Import gists from GitHub to share them here
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              GitHub Gist URL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gist-url">GitHub Gist URL</Label>
              <Input
                id="gist-url"
                placeholder="https://gist.github.com/username/gist-id"
                value={gistUrl}
                onChange={(e) => setGistUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchGitHubGist()}
              />
              <p className="text-sm text-muted-foreground">
                Enter a GitHub Gist URL to import it
              </p>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              onClick={fetchGitHubGist}
              disabled={loading || !gistUrl.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fetching Gist...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Fetch Gist
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {githubGist && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Preview</CardTitle>
                <Badge variant={githubGist.public ? 'default' : 'secondary'}>
                  {githubGist.public ? 'Public' : 'Secret'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">
                  {Object.entries(githubGist.files)[0][0] || 'Untitled Gist'}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Image
                      width={16}
                      height={16}
                      src={githubGist.owner.avatar_url}
                      alt={githubGist.owner.login}
                      className="h-4 w-4 rounded-full"
                    />
                    <span>{githubGist.owner.login}</span>
                  </div>
                  <span>•</span>
                  <span>{Object.keys(githubGist.files).length} file{Object.keys(githubGist.files).length !== 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span>{new Date(githubGist.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Files:</h4>
                <div className="grid gap-2">
                  {Object.entries(githubGist.files).map(([filename, file]) => (
                    <div key={filename} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{file.filename || filename}</span>
                        {file.language && (
                          <Badge variant="outline" className="text-xs">
                            {file.language}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {file.size} bytes
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex-1"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Import Gist
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(gistUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on GitHub
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

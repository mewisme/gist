'use client';

import { Eye, EyeOff, Globe, Lock, Plus, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { createGist } from '@/app/actions/gist-actions';
import { useAuth } from '@/components/auth/auth-context';
import { CodeEditor } from '@/components/editor/code-editor';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from "@/components/ui/button-group"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TagsInput } from '@/components/ui/tags-input';
import { useGistStore } from '@/lib/stores/gist-store';

export function NewGistPageClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    formData,
    updateFormData,
    updateFile,
    addFile,
    removeFile,
    resetForm,
  } = useGistStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const SAVE_GIST = [
    {
      label: 'Create secret gist',
      description: 'Secret gists are hidden from search but visible to anyone with the URL.',
      value: 'secret',
    },
    {
      label: 'Create public gist',
      description: 'Public gists are visible to everyone, including search engines.',
      value: 'public',
    }
  ]

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-8 w-48" />

        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-32 w-full" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-8 w-24" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 w-full rounded-lg" />
          ))}
        </div>

        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in to create a gist');
      return;
    }

    if (formData.files.length === 0) {
      toast.error('Please add at least one file');
      return;
    }

    if (formData.files.some(file => !file.filename.trim() || !file.content.trim())) {
      toast.error('All files must have a filename and content');
      return;
    }

    setIsSubmitting(true);

    try {
      const title = formData.title?.trim() || formData.files[0]?.filename || 'Untitled';

      const result = await createGist({
        description: title,
        visibility: formData.visibility,
        tags: formData.tags,
        files: formData.files.map(file => ({
          filename: file.filename,
          language: file.language,
          content: file.content,
        })),
      });

      if (result.success && result.data) {
        toast.success('Gist created successfully!');
        resetForm();
        router.push(`/g/${result.data.id}`);
      } else {
        toast.error(result.error || 'Failed to create gist');
      }
    } catch (error) {
      console.error('Error creating gist:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };


  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-4 w-4" />;
      case 'secret':
        return <EyeOff className="h-4 w-4" />;
      default:
        return <Lock className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Please sign in to create a gist</h1>
        <Button onClick={() => router.push('/signin')}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Create New Gist</h1>
        <p className="text-muted-foreground">
          Share your code snippets with the world
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-2">
          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              id="description"
              placeholder="E.g. A TypeScript utility for debouncing functions"
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
            />
          </div>

          <div className="space-y-2 w-full">
            <TagsInput
              tags={formData.tags}
              onTagsChange={(tags) => updateFormData({ tags })}
              placeholder="Add tags…"
              label="Tags"
              maxTags={10}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {formData.files.map((file, index) => (
            <CodeEditor
              key={file.id}
              fileId={file.id}
              filename={file.filename}
              language={file.language}
              content={file.content}
              onUpdate={updateFile}
              onRemove={removeFile}
              canRemove={formData.files.length > 1}
              isLastFile={index === formData.files.length - 1}
              totalFiles={formData.files.length}
            />
          ))}
        </div>


        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={addFile}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add File
          </Button>
          <ButtonGroup className='w-[87%] sm:w-auto'>
            <Button
              type="submit"
              disabled={isSubmitting || formData.files.length === 0}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Creating...' : SAVE_GIST.find(gist => gist.value === formData.visibility)?.label}
            </Button>
            <Select defaultValue={formData.visibility} onValueChange={(value: 'public' | 'secret') => updateFormData({ visibility: value })}>
              <SelectTrigger></SelectTrigger>
              <SelectContent>
                {SAVE_GIST.map((gist) => (
                  <SelectItem key={gist.value} value={gist.value}>
                    <div className="flex flex-col gap-1">
                      <span>{gist.label}</span>
                      <p className="text-[11px] text-muted-foreground">
                        {gist.description}
                      </p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ButtonGroup>
        </div>
      </form>
    </div>
  );
}

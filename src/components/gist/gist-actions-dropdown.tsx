'use client';

import { CodeIcon, Download, Edit, Ellipsis, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { deleteGist } from '@/app/actions/gist-actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/animate-ui/components/radix/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/animate-ui/components/radix/dropdown-menu';
import { useAuth } from '@/components/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Comment, Gist, User } from '@/lib/db/schema';

interface GistActionsDropdownProps {
  gist: Gist & { owner: User };
  comments: Comment[];
}


export function GistActionsWithDropdown({ gist, comments }: GistActionsDropdownProps) {
  const { user } = useAuth();
  const router = useRouter();

  const handleDelete = async () => {
    if (!gist) return;

    try {
      const result = await deleteGist(gist.id);

      if (result.success) {
        toast.success('Gist deleted successfully');
        router.push('/discover');
      } else {
        toast.error(result.error || 'Failed to delete gist');
      }
    } catch (error) {
      console.error('Error deleting gist:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const copyEmbedScript = async () => {
    const embedScript = `<iframe src="${window.location.origin}/e/${gist.id}" width="100%" height="400" frameborder="0"></iframe>`;
    try {
      await navigator.clipboard.writeText(embedScript);
      toast.success('Embed script copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy embed script:', error);
      toast.error('Failed to copy embed script');
    }
  };

  return (
    <>
      {user && user.id === gist.owner.id && (
        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className='md:hidden'>
                <Ellipsis className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-32'
              align='start'
              side='top'
            >
              <DropdownMenuItem>
                <Link href={`/g/${gist.id}/edit`} className="w-full flex items-center">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <AlertDialogTrigger asChild>
                  <div className="w-full flex items-center text-destructive">
                    <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                    Delete
                  </div>
                </AlertDialogTrigger>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="w-full flex items-center" onClick={copyEmbedScript}>
                <CodeIcon className="h-4 w-4" />
                Embed
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href={`/g/${gist.id}/download`} className="w-full flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your gist
                {comments.length > 0 && ` and its ${comments.length} comment${comments.length !== 1 ? 's' : ''}`}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}

export function GistActionsWithDefault({ gist, comments }: GistActionsDropdownProps) {
  const { user } = useAuth();
  const router = useRouter();

  const handleDelete = async () => {
    if (!gist) return;

    try {
      const result = await deleteGist(gist.id);

      if (result.success) {
        toast.success('Gist deleted successfully');
        router.push('/discover');
      } else {
        toast.error(result.error || 'Failed to delete gist');
      }
    } catch (error) {
      console.error('Error deleting gist:', error);
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <>
      {user && user.id === gist.owner.id && (
        <div className="hidden md:flex flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
          >
            <Link href={`/g/${gist.id}/edit`} className="w-full flex items-center">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive w-full sm:w-auto">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your gist
                  {comments.length > 0 && ` and its ${comments.length} comment${comments.length !== 1 ? 's' : ''}`}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </>
  )
}
'use server';

import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { gists } from '@/lib/db/schema';
import { CommentRepository } from '@/lib/repositories/comment-repository';
import { GistRepository } from '@/lib/repositories/gist-repository';
import { StarRepository } from '@/lib/repositories/star-repository';

const gistRepository = new GistRepository();
const commentRepository = new CommentRepository();
const starRepository = new StarRepository();

const createGistSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  visibility: z.enum(['public', 'secret']).default('public'),
  tags: z.array(z.string()).default([]),
  files: z.array(z.object({
    filename: z.string().min(1).max(255),
    language: z.string().min(1).max(50),
    content: z.string().max(5 * 1024 * 1024),
  })).min(1).max(20),
});

const updateGistSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  visibility: z.enum(['public', 'secret']).optional(),
  tags: z.array(z.string()).optional(),
});

const updateGistWithFilesSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  visibility: z.enum(['public', 'secret']).default('public'),
  tags: z.array(z.string()).default([]),
  files: z.array(z.object({
    id: z.string().optional(),
    filename: z.string().min(1).max(255),
    language: z.string().min(1).max(50),
    content: z.string().max(5 * 1024 * 1024),
  })).min(1).max(20),
});

const addFileSchema = z.object({
  filename: z.string().min(1).max(255),
  language: z.string().min(1).max(50),
  content: z.string().max(5 * 1024 * 1024),
});

const updateFileSchema = z.object({
  filename: z.string().min(1).max(255).optional(),
  language: z.string().min(1).max(50).optional(),
  content: z.string().max(5 * 1024 * 1024).optional(),
});

const commentSchema = z.object({
  text: z.string().min(1).max(10000),
});

/**
 * Create a new gist
 */
export async function createGist(data: z.infer<typeof createGistSchema>) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const validatedData = createGistSchema.parse(data);

    const gist = await gistRepository.createGist({
      ownerId: user.id,
      ...validatedData,
    });

    return { success: true, data: gist };
  } catch (error) {
    console.error('Error creating gist:', error);
    return { success: false, error: 'Failed to create gist' };
  }
}

/**
 * Update gist metadata
 */
export async function updateGist(gistId: string, data: z.infer<typeof updateGistSchema>) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const gist = await gistRepository.getGistById(gistId);
    if (!gist || gist.ownerId !== user.id) {
      return { success: false, error: 'Forbidden' };
    }

    const validatedData = updateGistSchema.parse(data);

    const updatedGist = await gistRepository.updateGist(gistId, validatedData);

    return { success: true, data: updatedGist };
  } catch (error) {
    console.error('Error updating gist:', error);
    return { success: false, error: 'Failed to update gist' };
  }
}

/**
 * Update gist with files
 */
export async function updateGistWithFiles(gistId: string, data: z.infer<typeof updateGistWithFilesSchema>) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const gist = await gistRepository.getGistById(gistId);
    if (!gist || gist.ownerId !== user.id) {
      return { success: false, error: 'Forbidden' };
    }

    const validatedData = updateGistWithFilesSchema.parse(data);

    await gistRepository.updateGist(gistId, {
      title: validatedData.title,
      description: validatedData.description,
      visibility: validatedData.visibility,
      tags: validatedData.tags,
    });

    const existingFileIds = new Set(gist.files.map(f => f.id));
    const submittedFileIds = new Set(validatedData.files.filter(f => f.id).map(f => f.id!));

    const filesToDelete = [...existingFileIds].filter(id => !submittedFileIds.has(id));

    for (const fileId of filesToDelete) {
      await gistRepository.deleteFile(fileId);
    }

    for (const file of validatedData.files) {
      if (file.id && existingFileIds.has(file.id)) {
        await gistRepository.updateFile(file.id, {
          filename: file.filename,
          language: file.language,
          content: file.content,
        });
      } else {
        await gistRepository.addFile(gistId, {
          filename: file.filename,
          language: file.language,
          content: file.content,
        });
      }
    }

    await db
      .update(gists)
      .set({
        fileCount: validatedData.files.length,
        updatedAt: new Date(),
      })
      .where(eq(gists.id, gistId));

    const updatedGist = await gistRepository.getGistById(gistId);

    return { success: true, data: updatedGist };
  } catch (error) {
    console.error('Error updating gist with files:', error);
    return { success: false, error: 'Failed to update gist' };
  }
}

/**
 * Delete gist
 */
export async function deleteGist(gistId: string) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const gist = await gistRepository.getGistById(gistId);
    if (!gist || gist.ownerId !== user.id) {
      return { success: false, error: 'Forbidden' };
    }

    const success = await gistRepository.deleteGist(gistId);

    return { success, error: success ? null : 'Failed to delete gist' };
  } catch (error) {
    console.error('Error deleting gist:', error);
    return { success: false, error: 'Failed to delete gist' };
  }
}

/**
 * Add file to gist
 */
export async function addFile(gistId: string, data: z.infer<typeof addFileSchema>) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const gist = await gistRepository.getGistById(gistId);
    if (!gist || gist.ownerId !== user.id) {
      return { success: false, error: 'Forbidden' };
    }

    const validatedData = addFileSchema.parse(data);

    const file = await gistRepository.addFile(gistId, validatedData);

    return { success: true, data: file };
  } catch (error) {
    console.error('Error adding file:', error);
    return { success: false, error: 'Failed to add file' };
  }
}

/**
 * Update file
 */
export async function updateFile(fileId: string, data: z.infer<typeof updateFileSchema>) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const fileGist = await gistRepository.getGistByFileId(fileId);

    if (!fileGist || fileGist.ownerId !== user.id) {
      return { success: false, error: 'File not found or forbidden' };
    }

    const validatedData = updateFileSchema.parse(data);

    const file = await gistRepository.updateFile(fileId, validatedData);

    return { success: true, data: file };
  } catch (error) {
    console.error('Error updating file:', error);
    return { success: false, error: 'Failed to update file' };
  }
}

/**
 * Delete file
 */
export async function deleteFile(fileId: string) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const fileGist = await gistRepository.getGistByFileId(fileId);

    if (!fileGist || fileGist.ownerId !== user.id) {
      return { success: false, error: 'File not found or forbidden' };
    }

    const success = await gistRepository.deleteFile(fileId);

    return { success, error: success ? null : 'Failed to delete file' };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error: 'Failed to delete file' };
  }
}

/**
 * Fork gist
 */
export async function forkGist(gistId: string) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const forkedGist = await gistRepository.forkGist(gistId, user.id);

    if (!forkedGist) {
      return { success: false, error: 'Gist not found' };
    }

    return { success: true, data: forkedGist };
  } catch (error) {
    console.error('Error forking gist:', error);
    return { success: false, error: 'Failed to fork gist' };
  }
}

/**
 * Toggle star
 */
export async function toggleStar(gistId: string) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const result = await starRepository.toggleStar(gistId, user.id);

    return { success: true, data: result };
  } catch (error) {
    console.error('Error toggling star:', error);
    return { success: false, error: 'Failed to toggle star' };
  }
}

/**
 * Add comment
 */
export async function addComment(gistId: string, data: z.infer<typeof commentSchema>) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const validatedData = commentSchema.parse(data);

    const comment = await commentRepository.createComment({
      gistId,
      authorId: user.id,
      text: validatedData.text,
    });

    return { success: true, data: comment };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { success: false, error: 'Failed to add comment' };
  }
}

/**
 * Delete comment
 */
export async function deleteComment(commentId: string) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const success = await commentRepository.deleteComment(commentId, user.id);

    return { success, error: success ? null : 'Failed to delete comment' };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return { success: false, error: 'Failed to delete comment' };
  }
}

const importGistFromGitHubSchema = z.object({
  description: z.string().optional(),
  visibility: z.enum(['public', 'secret']).default('public'),
  tags: z.array(z.string()).default([]),
  files: z.array(z.object({
    filename: z.string().min(1).max(255),
    language: z.string().min(1).max(50),
    content: z.string().max(5 * 1024 * 1024),
  })).min(1).max(20),
  githubUrl: z.string().url(),
});

/**
 * Import gist from GitHub
 */
export async function importGistFromGitHub(data: z.infer<typeof importGistFromGitHubSchema>) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const validatedData = importGistFromGitHubSchema.parse(data);

    const gist = await gistRepository.createGist({
      ownerId: user.id,
      title: validatedData.files[0]?.filename || 'Imported Gist',
      description: validatedData.description,
      visibility: validatedData.visibility,
      tags: validatedData.tags,
      files: validatedData.files,
    });

    return { success: true, data: gist };
  } catch (error) {
    console.error('Error importing gist from GitHub:', error);
    return { success: false, error: 'Failed to import gist' };
  }
}

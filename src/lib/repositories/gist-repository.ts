import { and, asc, count, desc, eq, inArray, like, or, sql } from 'drizzle-orm';

import { generateId } from '@/lib/id-utils';

import { db } from '../db';
import type { Comment, File, Gist, Revision, User } from '../db/schema';
import { comments, files, gists, revisionFiles, revisions, stars, users } from '../db/schema';

export class GistRepository {
  /**
   * Create a new gist
   */
  async createGist(data: {
    ownerId: string;
    title?: string;
    description?: string;
    visibility: 'public' | 'secret';
    tags?: string[];
    files: Array<{
      filename: string;
      language: string;
      content: string;
    }>;
  }): Promise<Gist> {
    const gistId = generateId();
    const now = new Date();

    // Auto-generate title from first filename if not provided
    const title = data.title || data.files[0]?.filename || 'Untitled Gist';

    const [gist] = await db
      .insert(gists)
      .values({
        id: gistId,
        ownerId: data.ownerId,
        title,
        description: data.description,
        visibility: data.visibility,
        tags: data.tags || [],
        fileCount: data.files.length,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const fileData = data.files.map(file => ({
      id: generateId(),
      gistId,
      filename: file.filename,
      language: file.language,
      content: file.content,
      size: file.content.length,
      createdAt: now,
      updatedAt: now,
    }));

    db.insert(files).values(fileData).run();

    return gist;
  }

  /**
   * Get gist by ID with files, owner, and fork data
   */
  async getGistById(id: string): Promise<(Gist & { files: File[]; owner: User; forkData?: Gist & { owner: User } }) | null> {
    const result = await db
      .select({
        gist: gists,
        file: files,
        owner: users,
      })
      .from(gists)
      .leftJoin(files, eq(files.gistId, gists.id))
      .leftJoin(users, eq(users.id, gists.ownerId))
      .where(eq(gists.id, id));

    if (result.length === 0) return null;

    const gist = result[0].gist;
    const owner = result[0].owner!;
    const gistFiles = result
      .filter(r => r.file)
      .map(r => r.file!);

    // If this gist is a fork, fetch the parent gist data
    let forkData: (Gist & { owner: User }) | undefined;
    if (gist.forkId) {
      const forkResult = await db
        .select({
          forkGist: gists,
          forkOwner: users,
        })
        .from(gists)
        .leftJoin(users, eq(users.id, gists.ownerId))
        .where(eq(gists.id, gist.forkId))
        .limit(1);

      if (forkResult.length > 0) {
        forkData = { ...forkResult[0].forkGist, owner: forkResult[0].forkOwner! };
      }
    }

    return { ...gist, files: gistFiles, owner, forkData };
  }

  /**
   * Get public gists with pagination and sorting
   */
  async getPublicGists(
    limit = 20,
    offset = 0,
    sortBy: 'recently-created' | 'recently-updated' | 'least-recently-created' | 'least-recently-updated' = 'recently-created'
  ): Promise<(Gist & { owner: User; files: File[]; commentCount: number; forkData?: Gist & { owner: User } })[]> {
    let orderBy;
    switch (sortBy) {
      case 'recently-created':
        orderBy = desc(gists.createdAt);
        break;
      case 'recently-updated':
        orderBy = desc(gists.updatedAt);
        break;
      case 'least-recently-created':
        orderBy = asc(gists.createdAt);
        break;
      case 'least-recently-updated':
        orderBy = asc(gists.updatedAt);
        break;
      default:
        orderBy = desc(gists.createdAt);
    }

    const gistResults = await db
      .select({
        gist: gists,
        owner: users,
        commentCount: count(comments.id),
      })
      .from(gists)
      .leftJoin(users, eq(users.id, gists.ownerId))
      .leftJoin(comments, eq(comments.gistId, gists.id))
      .where(eq(gists.visibility, 'public'))
      .groupBy(gists.id, users.id)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const gistIds = gistResults.map(r => r.gist.id);
    const fileResults = gistIds.length > 0 ? await db
      .select()
      .from(files)
      .where(inArray(files.gistId, gistIds)) : [];

    const filesByGist = new Map<string, File[]>();
    fileResults.forEach(file => {
      if (!filesByGist.has(file.gistId)) {
        filesByGist.set(file.gistId, []);
      }
      filesByGist.get(file.gistId)!.push(file);
    });

    // Fetch fork data for gists that are forks
    const forkIds = gistResults.filter(r => r.gist.forkId).map(r => r.gist.forkId!);
    const forkDataMap = new Map<string, Gist & { owner: User }>();

    if (forkIds.length > 0) {
      const forkResults = await db
        .select({
          forkGist: gists,
          forkOwner: users,
        })
        .from(gists)
        .leftJoin(users, eq(users.id, gists.ownerId))
        .where(inArray(gists.id, forkIds));

      forkResults.forEach(result => {
        forkDataMap.set(result.forkGist.id, { ...result.forkGist, owner: result.forkOwner! });
      });
    }

    return gistResults.map(r => ({
      ...r.gist,
      owner: r.owner!,
      files: filesByGist.get(r.gist.id) || [],
      commentCount: r.commentCount,
      forkData: r.gist.forkId ? forkDataMap.get(r.gist.forkId) : undefined
    }));
  }

  /**
   * Get gists by user
   */
  async getGistsByUser(
    userId: string,
    limit = 20,
    offset = 0,
    sortBy: 'recently-created' | 'recently-updated' | 'least-recently-created' | 'least-recently-updated' = 'recently-created'
  ): Promise<{ gists: (Gist & { owner: User; files: File[]; commentCount: number; forkData?: Gist & { owner: User } })[], total: number }> {
    let orderBy;
    switch (sortBy) {
      case 'recently-created':
        orderBy = desc(gists.createdAt);
        break;
      case 'recently-updated':
        orderBy = desc(gists.updatedAt);
        break;
      case 'least-recently-created':
        orderBy = asc(gists.createdAt);
        break;
      case 'least-recently-updated':
        orderBy = asc(gists.updatedAt);
        break;
      default:
        orderBy = desc(gists.createdAt);
    }

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(gists)
      .where(eq(gists.ownerId, userId));

    const total = totalResult.count;

    const gistResults = await db
      .select({
        gist: gists,
        owner: users,
        commentCount: count(comments.id),
      })
      .from(gists)
      .leftJoin(users, eq(users.id, gists.ownerId))
      .leftJoin(comments, eq(comments.gistId, gists.id))
      .where(eq(gists.ownerId, userId))
      .groupBy(gists.id, users.id)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const gistIds = gistResults.map(r => r.gist.id);
    const fileResults = gistIds.length > 0 ? await db
      .select()
      .from(files)
      .where(inArray(files.gistId, gistIds)) : [];

    const filesByGist = new Map<string, File[]>();
    fileResults.forEach(file => {
      if (!filesByGist.has(file.gistId)) {
        filesByGist.set(file.gistId, []);
      }
      filesByGist.get(file.gistId)!.push(file);
    });

    // Fetch fork data for gists that are forks
    const forkIds = gistResults.filter(r => r.gist.forkId).map(r => r.gist.forkId!);
    const forkDataMap = new Map<string, Gist & { owner: User }>();

    if (forkIds.length > 0) {
      const forkResults = await db
        .select({
          forkGist: gists,
          forkOwner: users,
        })
        .from(gists)
        .leftJoin(users, eq(users.id, gists.ownerId))
        .where(inArray(gists.id, forkIds));

      forkResults.forEach(result => {
        forkDataMap.set(result.forkGist.id, { ...result.forkGist, owner: result.forkOwner! });
      });
    }

    return {
      gists: gistResults.map(r => ({
        ...r.gist,
        owner: r.owner!,
        files: filesByGist.get(r.gist.id) || [],
        commentCount: r.commentCount,
        forkData: r.gist.forkId ? forkDataMap.get(r.gist.forkId) : undefined
      })),
      total
    };
  }

  /**
   * Update gist metadata
   */
  async updateGist(id: string, data: {
    title?: string;
    description?: string;
    visibility?: 'public' | 'secret';
    tags?: string[];
  }): Promise<Gist | null> {
    await this.createRevisionFromCurrentState(id);

    const [gist] = await db
      .update(gists)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(gists.id, id))
      .returning();

    return gist || null;
  }

  /**
   * Delete gist
   */
  async deleteGist(id: string): Promise<boolean> {
    const result = db
      .delete(gists)
      .where(eq(gists.id, id))
      .run();

    return result.changes > 0;
  }

  /**
   * Add file to gist
   */
  async addFile(gistId: string, file: {
    filename: string;
    language: string;
    content: string;
  }): Promise<File> {
    await this.createRevisionFromCurrentState(gistId);

    const now = new Date();
    const [newFile] = await db
      .insert(files)
      .values({
        id: generateId(),
        gistId,
        filename: file.filename,
        language: file.language,
        content: file.content,
        size: file.content.length,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Update file count and potentially update title if this is the first file
    await db
      .update(gists)
      .set({
        fileCount: sql`file_count + 1`,
        updatedAt: now,
      })
      .where(eq(gists.id, gistId));

    // Update title if this is the first file or if current title is empty
    const currentGist = await db.select().from(gists).where(eq(gists.id, gistId)).limit(1);
    if (currentGist.length > 0 && (!currentGist[0].title || currentGist[0].title === 'Untitled Gist')) {
      await db
        .update(gists)
        .set({
          title: file.filename,
          updatedAt: now,
        })
        .where(eq(gists.id, gistId));
    }

    return newFile;
  }

  /**
   * Update file
   */
  async updateFile(fileId: string, data: {
    filename?: string;
    language?: string;
    content?: string;
  }): Promise<File | null> {
    const fileResult = await db
      .select({ gistId: files.gistId })
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (fileResult.length === 0) return null;

    await this.createRevisionFromCurrentState(fileResult[0].gistId);

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.filename) updateData.filename = data.filename;
    if (data.language) updateData.language = data.language;
    if (data.content) {
      updateData.content = data.content;
      updateData.size = data.content.length;
    }

    const [file] = await db
      .update(files)
      .set(updateData)
      .where(eq(files.id, fileId))
      .returning();

    // Update gist title if this is the first file and filename changed
    if (data.filename) {
      const gistFiles = await db
        .select()
        .from(files)
        .where(eq(files.gistId, fileResult[0].gistId))
        .orderBy(files.createdAt);

      if (gistFiles.length > 0 && gistFiles[0].id === fileId) {
        await db
          .update(gists)
          .set({
            title: data.filename,
            updatedAt: new Date(),
          })
          .where(eq(gists.id, fileResult[0].gistId));
      }
    }

    return file || null;
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string): Promise<boolean> {
    const file = await db
      .select({ gistId: files.gistId })
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (file.length === 0) return false;

    await this.createRevisionFromCurrentState(file[0].gistId);

    const result = db
      .delete(files)
      .where(eq(files.id, fileId))
      .run();

    if (result.changes > 0) {
      const now = new Date();
      await db
        .update(gists)
        .set({
          fileCount: sql`file_count - 1`,
          updatedAt: now,
        })
        .where(eq(gists.id, file[0].gistId));

      // Update title if this was the first file
      const remainingFiles = await db
        .select()
        .from(files)
        .where(eq(files.gistId, file[0].gistId))
        .orderBy(files.createdAt);

      if (remainingFiles.length > 0) {
        await db
          .update(gists)
          .set({
            title: remainingFiles[0].filename,
            updatedAt: now,
          })
          .where(eq(gists.id, file[0].gistId));
      } else {
        // No files left, set title to default
        await db
          .update(gists)
          .set({
            title: 'Untitled Gist',
            updatedAt: now,
          })
          .where(eq(gists.id, file[0].gistId));
      }
    }

    return result.changes > 0;
  }

  /**
   * Create revision from current gist state
   */
  async createRevisionFromCurrentState(gistId: string): Promise<Revision | null> {
    const gist = await this.getGistById(gistId);
    if (!gist) return null;

    return await this.createRevision(gistId, {
      description: gist.description || undefined,
      tags: gist.tags || [],
      fileCount: gist.fileCount,
    }, gist.files.map(file => ({
      filename: file.filename,
      language: file.language,
      content: file.content,
    })));
  }

  /**
   * Create revision
   */
  async createRevision(gistId: string, snapshotMeta: {
    description?: string;
    tags?: string[];
    fileCount: number;
  }, files: Array<{ filename: string; language: string; content: string }>): Promise<Revision> {
    const revisionId = generateId();
    const now = new Date();

    const [revision] = await db
      .insert(revisions)
      .values({
        id: revisionId,
        gistId,
        snapshotMeta,
        createdAt: now,
      })
      .returning();

    const revisionFileData = files.map(file => ({
      id: generateId(),
      revId: revisionId,
      filename: file.filename,
      language: file.language,
      content: file.content,
      size: file.content.length,
    }));

    db.insert(revisionFiles).values(revisionFileData).run();

    return revision;
  }

  /**
   * Get revisions for gist
   */
  async getRevisions(gistId: string): Promise<Revision[]> {
    return await db
      .select()
      .from(revisions)
      .where(eq(revisions.gistId, gistId))
      .orderBy(desc(revisions.createdAt));
  }

  /**
   * Get revision with files
   */
  async getRevisionWithFiles(revisionId: string): Promise<(Revision & { files: any[] }) | null> {
    const revision = await db
      .select()
      .from(revisions)
      .where(eq(revisions.id, revisionId))
      .limit(1);

    if (revision.length === 0) return null;

    const revisionFilesData = await db
      .select()
      .from(revisionFiles)
      .where(eq(revisionFiles.revId, revisionId));

    return { ...revision[0], files: revisionFilesData };
  }

  /**
   * Search gists
   */
  async searchGists(query: string, limit = 20, offset = 0): Promise<(Gist & { owner: User; files: File[]; commentCount: number; forkData?: Gist & { owner: User } })[]> {
    const searchTerm = `%${query}%`;

    const gistResults = await db
      .select({
        gist: gists,
        owner: users,
        commentCount: count(comments.id),
      })
      .from(gists)
      .leftJoin(users, eq(users.id, gists.ownerId))
      .leftJoin(comments, eq(comments.gistId, gists.id))
      .where(
        and(
          eq(gists.visibility, 'public'),
          or(
            like(gists.description, searchTerm),
            like(users.handle, searchTerm),
            like(users.displayName, searchTerm)
          )
        )
      )
      .groupBy(gists.id, users.id)
      .orderBy(desc(gists.createdAt))
      .limit(limit)
      .offset(offset);

    const gistIds = gistResults.map(r => r.gist.id);
    const fileResults = gistIds.length > 0 ? await db
      .select()
      .from(files)
      .where(inArray(files.gistId, gistIds)) : [];

    const filesByGist = new Map<string, File[]>();
    fileResults.forEach(file => {
      if (!filesByGist.has(file.gistId)) {
        filesByGist.set(file.gistId, []);
      }
      filesByGist.get(file.gistId)!.push(file);
    });

    // Fetch fork data for gists that are forks
    const forkIds = gistResults.filter(r => r.gist.forkId).map(r => r.gist.forkId!);
    const forkDataMap = new Map<string, Gist & { owner: User }>();

    if (forkIds.length > 0) {
      const forkResults = await db
        .select({
          forkGist: gists,
          forkOwner: users,
        })
        .from(gists)
        .leftJoin(users, eq(users.id, gists.ownerId))
        .where(inArray(gists.id, forkIds));

      forkResults.forEach(result => {
        forkDataMap.set(result.forkGist.id, { ...result.forkGist, owner: result.forkOwner! });
      });
    }

    return gistResults.map(r => ({
      ...r.gist,
      owner: r.owner!,
      files: filesByGist.get(r.gist.id) || [],
      commentCount: r.commentCount,
      forkData: r.gist.forkId ? forkDataMap.get(r.gist.forkId) : undefined
    }));
  }

  /**
   * Get gist by file ID (for ownership checks)
   */
  async getGistByFileId(fileId: string): Promise<(Gist & { owner: User }) | null> {
    const result = await db
      .select({
        gist: gists,
        owner: users,
      })
      .from(gists)
      .leftJoin(files, eq(files.gistId, gists.id))
      .leftJoin(users, eq(users.id, gists.ownerId))
      .where(eq(files.id, fileId))
      .limit(1);

    if (result.length === 0) return null;

    return { ...result[0].gist, owner: result[0].owner! };
  }

  /**
   * Fork gist
   */
  async forkGist(sourceGistId: string, newOwnerId: string): Promise<Gist | null> {
    const sourceGist = await this.getGistById(sourceGistId);
    if (!sourceGist) return null;

    const newGist = await this.createGist({
      ownerId: newOwnerId,
      title: sourceGist.title || undefined,
      description: sourceGist.description || undefined,
      visibility: 'public',
      tags: sourceGist.tags || [],
      files: sourceGist.files.map(file => ({
        filename: file.filename,
        language: file.language,
        content: file.content,
      })),
    });

    await db
      .update(gists)
      .set({
        forkCount: sql`fork_count + 1`,
      })
      .where(eq(gists.id, sourceGistId));

    await db
      .update(gists)
      .set({
        forkId: sourceGistId,
      })
      .where(eq(gists.id, newGist.id));

    return newGist;
  }
}

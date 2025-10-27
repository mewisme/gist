import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FileData {
  id: string;
  filename: string;
  language: string;
  content: string;
}

export interface GistFormData {
  title?: string;
  description: string;
  visibility: 'public' | 'secret';
  tags: string[];
  files: FileData[];
}

interface GistStore {
  formData: GistFormData;
  updateFormData: (data: Partial<GistFormData>) => void;
  updateFile: (fileId: string, updates: Partial<FileData>) => void;
  addFile: () => void;
  removeFile: (fileId: string) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  resetForm: () => void;
}

const defaultFormData: GistFormData = {
  title: '',
  description: '',
  visibility: 'public',
  tags: [],
  files: [
    {
      id: '1',
      filename: '',
      language: '',
      content: '',
    },
  ],
};

export const useGistStore = create<GistStore>()(
  persist(
    (set, get) => ({
      formData: defaultFormData,

      updateFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
        })),

      updateFile: (fileId, updates) =>
        set((state) => ({
          formData: {
            ...state.formData,
            files: state.formData.files.map((file) =>
              file.id === fileId ? { ...file, ...updates } : file
            ),
          },
        })),

      addFile: () =>
        set((state) => {
          const newFile: FileData = {
            id: Date.now().toString(),
            filename: '',
            language: '',
            content: '',
          };
          return {
            formData: {
              ...state.formData,
              files: [...state.formData.files, newFile],
            },
          };
        }),

      removeFile: (fileId) =>
        set((state) => ({
          formData: {
            ...state.formData,
            files: state.formData.files.filter((file) => file.id !== fileId),
          },
        })),

      addTag: (tag) =>
        set((state) => {
          const trimmedTag = tag.trim();
          if (trimmedTag && !state.formData.tags.includes(trimmedTag)) {
            return {
              formData: {
                ...state.formData,
                tags: [...state.formData.tags, trimmedTag],
              },
            };
          }
          return state;
        }),

      removeTag: (tagToRemove) =>
        set((state) => ({
          formData: {
            ...state.formData,
            tags: state.formData.tags.filter((tag) => tag !== tagToRemove),
          },
        })),

      resetForm: () =>
        set(() => ({
          formData: defaultFormData,
        })),
    }),
    {
      name: 'gist-store',
    }
  )
);

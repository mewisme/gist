'use client';

import clsx from 'clsx';
import { X } from 'lucide-react';
import { KeyboardEvent, useCallback, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type SeparatorKey = 'enter' | 'space' | 'comma' | 'semicolon' | 'tab' | 'newline';

interface TagsInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
  maxTags?: number;
  maxTagLength?: number;
  validateTag?: (tag: string) => boolean;
  transformTag?: (raw: string) => string;
  separators?: SeparatorKey[];
  helpText?: string;
  allowDuplicates?: boolean;
  caseSensitive?: boolean;
  className?: string;
}

export function TagsInput({
  tags,
  onTagsChange,
  placeholder = 'Add tags…',
  label = 'Tags',
  maxTags = 10,
  maxTagLength = 32,
  validateTag,
  transformTag,
  separators = ['enter', 'space', 'comma', 'semicolon', 'tab', 'newline'],
  helpText = 'Press Enter, Space, comma, semicolon, Tab, or paste multiple lines.',
  allowDuplicates = false,
  caseSensitive = false,
  className,
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [statusMsg, setStatusMsg] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizedSet = useMemo(
    () => new Set(tags.map(t => (caseSensitive ? t.trim() : t.trim().toLowerCase()))),
    [tags, caseSensitive]
  );

  const defaultTransform = useCallback(
    (s: string) => {
      const trimmed = s.trim().replace(/\s+/g, ' ');
      return caseSensitive ? trimmed : trimmed.toLowerCase();
    },
    [caseSensitive]
  );

  const isSeparatorChar = (ch: string) =>
    (separators.includes('comma') && ch === ',') ||
    (separators.includes('semicolon') && ch === ';');

  const commitTags = useCallback(
    (candidates: string[]) => {
      if (!candidates.length) return;

      let made = 0;
      const next = [...tags];

      for (const raw of candidates) {
        let t = transformTag ? transformTag(raw) : defaultTransform(raw);

        if (!t || !t.trim()) continue;
        t = t.replace(/^#/, '').trim();
        if (t.length > maxTagLength) t = t.slice(0, maxTagLength);

        if (validateTag && !validateTag(t)) continue;

        const key = caseSensitive ? t : t.toLowerCase();
        if (!allowDuplicates && normalizedSet.has(key)) continue;

        if (next.length >= maxTags) {
          setStatusMsg(`Maximum ${maxTags} tags reached.`);
          break;
        }

        next.push(t);
        normalizedSet.add(key);
        made++;
      }

      if (made > 0) {
        onTagsChange(next);
        setStatusMsg(`Added ${made} tag${made > 1 ? 's' : ''}.`);
      }
    },
    [
      tags,
      onTagsChange,
      transformTag,
      defaultTransform,
      validateTag,
      allowDuplicates,
      normalizedSet,
      maxTags,
      maxTagLength,
      caseSensitive,
    ]
  );

  const splitByDelimiters = (s: string) => {
    const parts: string[] = [];
    let pattern = '';
    if (separators.includes('comma')) pattern += ',';
    if (separators.includes('semicolon')) pattern += ';';
    if (separators.includes('newline')) pattern += '\n\r';
    if (!pattern) return [s];

    const re = new RegExp(`[${pattern}]+`);
    for (const piece of s.split(re)) {
      if (piece !== undefined) parts.push(piece);
    }
    return parts;
  };

  const addFromInput = (finalize = false) => {
    const raw = inputValue;
    if (!raw.trim()) return;
    const candidates = finalize ? [raw] : splitByDelimiters(raw);
    commitTags(candidates);
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
    setStatusMsg(`Removed tag "${tagToRemove}".`);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const key = e.key.toLowerCase();

    const shouldCommit =
      (separators.includes('enter') && key === 'enter') ||
      (separators.includes('space') && key === ' ') ||
      (separators.includes('tab') && key === 'tab');

    if (shouldCommit) {
      e.preventDefault();
      addFromInput(false);
      return;
    }

    if (key === 'backspace' && !inputValue && tags.length > 0) {
      e.preventDefault();
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v.length > 0) {
      const lastChar = v[v.length - 1];
      if (isSeparatorChar(lastChar)) {
        const withoutTrailing = v.replace(/[,\n;\r]+$/g, '');
        const candidates = splitByDelimiters(withoutTrailing);
        commitTags(candidates);
        setInputValue('');
        return;
      }
    }
    setInputValue(v);
    setStatusMsg('');
  };

  const handleBlur = () => {
    if (inputValue.trim()) addFromInput(true);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (!text) return;
    e.preventDefault();
    const candidates = splitByDelimiters(text);
    commitTags(candidates);
    setInputValue('');
  };

  const atCapacity = tags.length >= maxTags;

  return (
    <div className={clsx('space-y-2', className)}>
      <Label htmlFor="tags-input">{label}</Label>
      <div
        className={clsx(
          'flex flex-wrap gap-2 border rounded-md min-h-9 items-center',
          atCapacity && 'opacity-90'
        )}
        aria-live="polite"
      >
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1 ml-2"
            title={tag}
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-destructive transition-colors outline-none focus:ring-2 focus:ring-ring rounded"
              type="button"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          id="tags-input"
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder={tags.length === 0 ? placeholder : 'Add more…'}
          className={clsx(
            'flex-1 min-w-[160px] border-0 px-4 shadow-none py-0 h-9 focus-visible:ring-0 focus-visible:ring-offset-0',
            atCapacity && 'pointer-events-none opacity-50'
          )}
          disabled={atCapacity}
          aria-disabled={atCapacity}
          aria-describedby="tags-help tags-status"
          inputMode="text"
          autoComplete="off"
        />
      </div>
      <div id="tags-status" className="sr-only" aria-live="polite">
        {statusMsg}
      </div>
    </div>
  );
}

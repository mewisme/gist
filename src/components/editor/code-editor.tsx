'use client';

import { Editor } from '@monaco-editor/react';
import { PencilLine, Trash2 } from 'lucide-react';
import { editor as monacoEditor } from 'monaco-editor'
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { detectLanguage, getLanguageDisplayName } from '@/lib/utils/language-detection';

interface CodeEditorProps {
  fileId: string;
  filename: string;
  language: string;
  content: string;
  onUpdate: (fileId: string, updates: { filename?: string; language?: string; content?: string }) => void;
  onRemove: (fileId: string) => void;
  canRemove: boolean;
  isLastFile?: boolean;
  isFirstFile?: boolean;
  totalFiles: number;
}

export function CodeEditor({
  fileId,
  filename,
  language,
  content,
  onUpdate,
  onRemove,
  canRemove,
  isLastFile = false,
  isFirstFile = false,
  totalFiles,
}: CodeEditorProps) {
  const [editorLanguage, setEditorLanguage] = useState(language);
  const [editorContent, setEditorContent] = useState(content);
  const [isFilenameEditing, setIsFilenameEditing] = useState(false);
  const [tempFilename, setTempFilename] = useState(filename);
  const [spacingType, setSpacingType] = useState<'spaces' | 'tabs'>('spaces');
  const [indentSize, setIndentSize] = useState<number>(2);
  const [lineWrap, setLineWrap] = useState<'on' | 'off'>('on');
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const editorRef = useRef<any>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const detectedLanguage = detectLanguage(filename, '');
    if (detectedLanguage !== editorLanguage) {
      setEditorLanguage(detectedLanguage);
      onUpdate(fileId, { language: detectedLanguage });
    }
  }, [filename, fileId, onUpdate, editorLanguage]);

  const handleFilenameChange = (newFilename: string) => {
    setTempFilename(newFilename);
    onUpdate(fileId, { filename: newFilename });

    const detectedLanguage = detectLanguage(newFilename, '');
    if (detectedLanguage !== editorLanguage) {
      setEditorLanguage(detectedLanguage);
      onUpdate(fileId, { language: detectedLanguage });
    }
  };

  const handleContentChange = (value: string | undefined) => {
    const newContent = value || '';
    setEditorContent(newContent);
    onUpdate(fileId, { content: newContent });
  };

  const handleSpacingTypeChange = (value: string) => {
    const newSpacingType = value as 'spaces' | 'tabs';
    setSpacingType(newSpacingType);

    if (editorRef.current) {
      editorRef.current.updateOptions({
        insertSpaces: newSpacingType === 'spaces',
        tabSize: indentSize,
      });
    }
  };

  const handleIndentSizeChange = (value: string) => {
    const newIndentSize = parseInt(value);
    setIndentSize(newIndentSize);

    if (editorRef.current) {
      editorRef.current.updateOptions({
        insertSpaces: spacingType === 'spaces',
        tabSize: newIndentSize,
      });
    }
  };

  const handleLineWrapChange = (value: string) => {
    const newLineWrap = value as 'on' | 'off';
    setLineWrap(newLineWrap);

    if (editorRef.current) {
      editorRef.current.updateOptions({
        wordWrap: newLineWrap,
      });
    }
  };

  const handleEditorDidMount = (editor: monacoEditor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    editor.updateOptions({
      fontFamily:
        "'JetBrains Mono','Fira Code','Consolas','Monaco','Courier New',monospace",
      fontSize: 14,
      lineHeight: 1.5,
      wordWrap: lineWrap,
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      renderWhitespace: 'selection',
      renderControlCharacters: true,
      unicodeHighlight: {
        ambiguousCharacters: false,
        invisibleCharacters: false,
      },
      insertSpaces: spacingType === 'spaces',
      tabSize: indentSize,
    });

    editor.onDidFocusEditorWidget(() => {
      setIsEditorFocused(true);
    });

    editor.onDidBlurEditorWidget(() => {
      setIsEditorFocused(false);
    });
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    if (isEditorFocused && editorContainerRef.current?.contains(e.target as Node)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [isEditorFocused]);

  useEffect(() => {
    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  const stats = useMemo(() => {
    const lines = editorContent ? editorContent.split('\n').length : 1;
    const chars = editorContent.length;
    return { lines, chars };
  }, [editorContent]);

  return (
    <Card className="w-full overflow-hidden border border-border/80 rounded-md pt-2 pb-0">

      <CardHeader className="px-0 border-b [.border-b]:pb-0!">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col md:flex-row min-w-0 w-full justify-between items-center gap-2">
            <div className="flex items-center gap-2 px-2 md:px-0 md:pl-3">
              {isFilenameEditing ? (
                <Input
                  value={tempFilename}
                  onChange={(e) => setTempFilename(e.target.value)}
                  onBlur={() => {
                    setIsFilenameEditing(false);
                    handleFilenameChange(tempFilename.trim() || filename);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsFilenameEditing(false);
                      handleFilenameChange(tempFilename.trim() || filename);
                    }
                    if (e.key === 'Escape') {
                      setIsFilenameEditing(false);
                      setTempFilename(filename);
                    }
                  }}
                  placeholder="Filename including extension"
                  className="h-8 font-mono text-sm w-[280px]"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setIsFilenameEditing(true)}
                  className="max-w-[320px] truncate rounded px-1 py-1 font-mono text-sm hover:bg-background/60 inline-flex items-center gap-1"
                  title="Click to rename"
                >
                  <PencilLine className="h-3.5 w-3.5 opacity-70" />
                  {filename}
                </button>
              )}


              {totalFiles > 1 && (
                <Button variant="ghost" size="icon" className="h-8 px-2 text-sm" onClick={() => onRemove(fileId)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 px-2 md:px-0 md:pr-3">
              <Select value={spacingType} onValueChange={handleSpacingTypeChange}>
                <SelectTrigger className="w-[95px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Indent mode</SelectLabel>
                    <SelectItem value="spaces">Spaces</SelectItem>
                    <SelectItem value="tabs">Tabs</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={indentSize.toString()} onValueChange={handleIndentSizeChange}>
                <SelectTrigger className="w-[60px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Indent size</SelectLabel>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select defaultValue='on' value={lineWrap} onValueChange={handleLineWrapChange}>
                <SelectTrigger className="w-[105px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Line wrap mode</SelectLabel>
                    <SelectItem value='off'>No wrap</SelectItem>
                    <SelectItem value='on'>Wrap</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div ref={editorContainerRef} className="h-96 border-t">
          <Editor
            height="100%"
            language={editorLanguage}
            value={editorContent}
            onChange={handleContentChange}
            onMount={handleEditorDidMount}
            theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
            options={{
              selectOnLineNumbers: true,
              roundedSelection: false,
              readOnly: false,
              cursorStyle: 'line',
              automaticLayout: true,
              fontFamily:
                "'JetBrains Mono','Fira Code','Consolas','Monaco','Courier New',monospace",
              fontSize: 14,
              lineHeight: 1.5,
              wordWrap: lineWrap,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              renderWhitespace: 'selection',
              renderControlCharacters: true,
              unicodeHighlight: {
                ambiguousCharacters: false,
                invisibleCharacters: false,
              },
              insertSpaces: spacingType === 'spaces',
              tabSize: indentSize,
              lineNumbers: 'on',
              glyphMargin: false,
              guides: { indentation: true, bracketPairs: true },
            }}
          />
        </div>


        <div className="flex items-center justify-between border-t bg-muted/40 px-3 py-1.5 text-xs">
          <div className="text-muted-foreground">
            {stats.lines} {stats.lines === 1 ? 'line' : 'lines'} • {stats.chars} chars
          </div>
          <div className="text-muted-foreground">
            {getLanguageDisplayName(editorLanguage)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

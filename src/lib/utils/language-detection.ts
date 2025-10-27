export function detectLanguage(filename: string, content?: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();

  const extensionMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'mjs': 'javascript',
    'cjs': 'javascript',

    'py': 'python',
    'pyw': 'python',
    'pyi': 'python',

    'java': 'java',
    'class': 'java',
    'jar': 'java',

    'c': 'c',
    'h': 'c',
    'cpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp',
    'hpp': 'cpp',
    'hxx': 'cpp',

    'rs': 'rust',

    'go': 'go',

    'php': 'php',
    'phtml': 'php',

    'rb': 'ruby',
    'rbw': 'ruby',

    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',

    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'toml': 'toml',

    'md': 'markdown',
    'markdown': 'markdown',

    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'zsh',
    'fish': 'fish',
    'ps1': 'powershell',

    'sql': 'sql',
    'dockerfile': 'dockerfile',
    'makefile': 'makefile',
    'cmake': 'cmake',
    'vim': 'vim',
    'lua': 'lua',
    'perl': 'perl',
    'r': 'r',
    'swift': 'swift',
    'kt': 'kotlin',
    'kts': 'kotlin',
    'scala': 'scala',
    'dart': 'dart',
    'elm': 'elm',
    'clj': 'clojure',
    'hs': 'haskell',
    'ml': 'ocaml',
    'fs': 'fsharp',
    'erl': 'erlang',
    'ex': 'elixir',
    'jl': 'julia',
    'matlab': 'matlab',
    'm': 'matlab',
    'f90': 'fortran',
    'f': 'fortran',
    'pas': 'pascal',
    'ada': 'ada',
    'cobol': 'cobol',
    'awk': 'awk',
    'sed': 'sed',
    'groovy': 'groovy',
    'gradle': 'groovy',
  };

  if (extension && extensionMap[extension]) {
    return extensionMap[extension];
  }

  if (content) {
    const trimmedContent = content.trim();

    if (trimmedContent.startsWith('#!')) {
      if (trimmedContent.includes('python')) return 'python';
      if (trimmedContent.includes('bash')) return 'bash';
      if (trimmedContent.includes('sh')) return 'bash';
      if (trimmedContent.includes('node')) return 'javascript';
      if (trimmedContent.includes('ruby')) return 'ruby';
      if (trimmedContent.includes('perl')) return 'perl';
    }

    if (trimmedContent.includes('<?php')) return 'php';
    if (trimmedContent.includes('<!DOCTYPE html>') || trimmedContent.includes('<html')) return 'html';
    if (trimmedContent.includes('import React') || trimmedContent.includes('from "react"')) return 'javascript';
    if (trimmedContent.includes('import {') && trimmedContent.includes('from "react"')) return 'typescript';
    if (trimmedContent.includes('def ') && trimmedContent.includes(':')) return 'python';
    if (trimmedContent.includes('function ') && trimmedContent.includes('{')) return 'javascript';
    if (trimmedContent.includes('public class ')) return 'java';
    if (trimmedContent.includes('fn main()')) return 'rust';
    if (trimmedContent.includes('package main')) return 'go';
    if (trimmedContent.includes('<?xml')) return 'xml';
    if (trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) return 'json';
  }

  return 'text';
}

export function getLanguageDisplayName(language: string): string {
  const displayNames: Record<string, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    java: 'Java',
    c: 'C',
    cpp: 'C++',
    rust: 'Rust',
    go: 'Go',
    php: 'PHP',
    ruby: 'Ruby',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    sass: 'Sass',
    less: 'Less',
    json: 'JSON',
    xml: 'XML',
    yaml: 'YAML',
    toml: 'TOML',
    markdown: 'Markdown',
    bash: 'Bash',
    zsh: 'Zsh',
    fish: 'Fish',
    powershell: 'PowerShell',
    sql: 'SQL',
    dockerfile: 'Dockerfile',
    makefile: 'Makefile',
    cmake: 'CMake',
    vim: 'Vim',
    lua: 'Lua',
    perl: 'Perl',
    r: 'R',
    swift: 'Swift',
    kotlin: 'Kotlin',
    scala: 'Scala',
    dart: 'Dart',
    elm: 'Elm',
    clojure: 'Clojure',
    haskell: 'Haskell',
    ocaml: 'OCaml',
    fsharp: 'F#',
    erlang: 'Erlang',
    elixir: 'Elixir',
    julia: 'Julia',
    matlab: 'MATLAB',
    fortran: 'Fortran',
    pascal: 'Pascal',
    ada: 'Ada',
    cobol: 'COBOL',
    awk: 'AWK',
    sed: 'Sed',
    groovy: 'Groovy',
    text: 'Text',
  };

  return displayNames[language] || language;
}

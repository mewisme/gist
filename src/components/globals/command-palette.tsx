'use client'

import Fuse from 'fuse.js'
import { debounce } from 'lodash-es'
import { Bell, FileCode2, FilePlus2, Palette, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { useHotkeys } from '@/hooks/use-hot-keys'
import type { GistDetails } from '@/lib/db/schema'

type CommandDefinition = {
  id: string
  title: string
  subtitle?: string
  keywords?: string[]
  shortcut?: string
  icon?: React.ReactNode
  href?: string
  run?: () => void
}

export function CommandPalette() {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const [gistResults, setGistResults] = useState<GistDetails[]>([])
  const [commandResults, setCommandResults] = useState<CommandDefinition[]>([])

  useHotkeys(['ctrl+k', 'meta+k'], () => setOpen(true))

  const commands: CommandDefinition[] = useMemo(() => [
    {
      id: 'theme',
      title: 'Theme',
      subtitle: 'Toggle between light and dark mode',
      keywords: ['theme', 'light', 'dark', 'system'],
      icon: <Palette />,
      run() {
        const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
        setTheme(newTheme)
      },
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'Open app settings',
      keywords: ['pref', 'config'],
      icon: <Settings />,
      href: '/settings',
    },
    {
      id: 'new-gist',
      title: 'New Gist',
      subtitle: 'Create a new gist',
      keywords: ['create', 'add'],
      icon: <FilePlus2 />,
      href: '/',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'View your notifications',
      keywords: ['notifications', 'notification', 'notification bell'],
      icon: <Bell />,
      href: '/notifications',
    },
  ], [resolvedTheme])

  const fuse = useMemo(
    () =>
      new Fuse(commands, {
        keys: ['title', 'subtitle', 'keywords', 'id'],
        includeScore: false,
        threshold: 0.38,
      }),
    [commands]
  )

  const fetchGists = useMemo(
    () =>
      debounce(async (q: string) => {
        const query = q.trim()
        if (!query || query.startsWith('>')) {
          setGistResults([])
          return
        }
        setLoading(true)
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10&offset=0`)
          const gists = await response.json() as GistDetails[]
          setGistResults(gists ?? [])
        } catch (e) {
          console.error('search gists failed', e)
          setGistResults([])
        } finally {
          setLoading(false)
        }
      }, 300),
    []
  )

  useEffect(() => {
    const raw = search ?? ''
    if (raw.startsWith('>')) {
      const q = raw.slice(1).trim()
      if (!q) {
        setCommandResults(commands)
      } else {
        setCommandResults(fuse.search(q).map(r => r.item))
      }
      setGistResults([])
      setLoading(false)
    } else {
      setCommandResults([])
      fetchGists(raw)
    }
  }, [search, fuse, fetchGists])

  const executeCommand = (cmd: CommandDefinition) => {
    setOpen(false)
    if (cmd.run) {
      cmd.run()
      return
    }
    if (cmd.href) {
      router.push(cmd.href)
    }
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
      <CommandInput
        placeholder="Type > to run a command, or search gists…"
        value={search}
        onValueChange={setSearch}
      />

      <CommandList>
        {/* Loading */}
        {loading && <CommandItem disabled>Searching…</CommandItem>}

        {/* Empty states */}
        {!loading && !search && (
          <CommandEmpty>Try “&gt;theme” or type to search gists.</CommandEmpty>
        )}
        {!loading && search && gistResults.length === 0 && commandResults.length === 0 && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}

        {/* Command mode */}
        {commandResults.length > 0 && (
          <CommandGroup heading="Commands">
            {commandResults.map((cmd) => (
              <CommandItem
                key={cmd.id}
                onSelect={() => executeCommand(cmd)}
              >
                {cmd.icon && (cmd.icon)}
                <div className="flex flex-col">
                  <span className="font-medium">{cmd.title}</span>
                  {cmd.subtitle && (
                    <span className="text-muted-foreground text-xs">
                      {cmd.subtitle}
                    </span>
                  )}
                </div>
                {cmd.shortcut && (
                  <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {gistResults.length > 0 && (
          <CommandGroup heading="Gists">
            {gistResults.map((gist) => (
              <CommandItem
                key={gist.id}
                onSelect={() => {
                  setOpen(false)
                  router.push(`/g/${gist.id}`)
                }}
              >
                <FileCode2 className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">
                    {gist.title || gist.files[0]?.filename || 'Untitled'}
                  </span>
                  {gist.description && (
                    <span className="text-muted-foreground text-xs line-clamp-1">
                      {gist.description}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Tips">
          <CommandItem disabled>
            <span>Switch theme</span>
            <CommandShortcut>&gt;theme</CommandShortcut>
          </CommandItem>
          <CommandItem disabled>
            <span>Open settings</span>
            <CommandShortcut>&gt;settings</CommandShortcut>
          </CommandItem>
          <CommandItem disabled>
            <span>Toggle palette</span>
            <CommandShortcut>
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <span>+</span>
                <Kbd>K</Kbd>
              </KbdGroup>
            </CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

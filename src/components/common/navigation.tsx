'use client';

import { ChevronDown, Download, FileText, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AuthButton } from '@/components/auth/auth-button';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function Navigation() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/discover?search=${encodeURIComponent(q)}` : '/discover');
  };

  return (
    <TooltipProvider>
      <nav className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between md:hidden">
            <Link href="/" aria-label="Home" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary font-bold text-primary-foreground">G</div>
              <span className="text-lg font-bold">Gist</span>
            </Link>

            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="shrink-0">
                <Link href="/discover" className="flex items-center gap-1">
                  All Gists
                </Link>
              </Button>
              <div suppressHydrationWarning>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <Plus className="h-4 w-4 font-bold" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/g/new" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Create New Gist
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/import" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Import from GitHub
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <AuthButton />
            </div>
          </div>

          <div className="pb-3 md:hidden">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  inputMode="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                  aria-label="Search gists"
                />
                <button
                  type="submit"
                  aria-label="Submit search"
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-2 hover:bg-accent"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          <div className="hidden h-16 items-center md:grid md:grid-cols-[auto_1fr_auto] md:gap-4">
            <div className="flex items-center gap-4">
              <Link href="/" aria-label="Home" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-primary font-bold text-primary-foreground">G</div>
                <span className="text-xl font-bold">Gist</span>
              </Link>

              <Link
                href="/discover"
                className="text-sm font-semibold text-muted-foreground hover:text-foreground"
              >
                All Gists
              </Link>
            </div>

            <form onSubmit={handleSearch} className="min-w-0">
              <div className="mx-auto max-w-xl">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    inputMode="search"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-12"
                    aria-label="Search gists"
                  />
                  <button
                    type="submit"
                    aria-label="Submit search"
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-2 hover:bg-accent"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </form>

            <div className="flex items-center gap-4">
              <DropdownMenu>
                <ButtonGroup>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button asChild variant="outline" size="icon" className="shrink-0 pr-0" type="button">
                        <Link href="/" className="flex items-center gap-2">
                          <Plus className="h-4 w-4 font-bold" />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Create new gist</p>
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 pl-0" type="button">
                      <ChevronDown className="h-4 w-4 font-bold" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/g/new" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Create New Gist
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/import" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Import from GitHub
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </ButtonGroup>
              </DropdownMenu>
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>
    </TooltipProvider>
  );
}

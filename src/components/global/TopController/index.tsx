import { Globe, Moon, Search, Sun, Volume2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/hooks/use-theme';

const TopController = () => {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b border-border bg-background px-4">
      <div className="flex shrink-0 items-center gap-3">
        <Link
          to="/home"
          className="text-sm font-medium text-foreground"
        >
          LIMINAL FIELD
        </Link>
      </div>

      <div className="flex max-w-xl flex-1 items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索文档、图片..."
            className="h-8 bg-background pl-8 text-sm"
          />
        </div>
        <span className="max-w-[120px] truncate text-xs text-muted-foreground">
          搜索入口
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          title="主题"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" title="白噪音">
          <Volume2 className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" title="专注">
          <span className="text-xs">◎</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8" title="语言">
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>中文</DropdownMenuItem>
            <DropdownMenuItem>English</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TopController;

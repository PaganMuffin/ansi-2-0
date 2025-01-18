import { useState, useEffect, useRef } from 'react';

interface Title {
  romaji: string;
  english: string;
  other: string;
}

interface Author {
  id: number;
  nick: string;
}

interface Entry {
  title: Title;
  date: number;
  author: Author;
  id: number;
}

const PAGE_SIZE = 20;

type SortDirection = 'asc' | 'desc';

export default function EntryList() {

  const [entries, setEntries] = useState<Entry[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("q") || "";
  });
  const [totalResults, setTotalResults] = useState<number | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchEntries = async (pageNum: number, query: string, sortDirection: SortDirection) => {
    setLoading(true);
    try {
      const url = new URL('/api/search', window.location.origin);
      url.searchParams.set('page', pageNum.toString());
      url.searchParams.set('limit', PAGE_SIZE.toString());
      url.searchParams.set('sort', sortDirection);
      if (query.trim()) {
        url.searchParams.set('q', query.trim());
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json() as {
        entries: Entry[],
        hasMore: boolean,
        total: number
      };

      setEntries(prev => pageNum === 1 ? data.entries : [...prev, ...data.entries]);
      setHasMore(data.hasMore);
      setTotalResults(data.total);

      if (pageNum === 1 && data.entries.length === 0) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };


  // Obsługa infinite scroll
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchEntries(nextPage, searchQuery, sortDirection);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, page, searchQuery, sortDirection]);

  //@ts-ignore
  const handleChange = (event: NavigationEvent) => {
    const url = new URL(event.destination.url);
    const query = url.searchParams.get("q");
    setSearchQuery(query || "");
  }

  useEffect(() => {
    console.log(searchQuery);
    fetchEntries(1, searchQuery, sortDirection);



    // @ts-ignore
    window.navigation.addEventListener("navigate", handleChange)

    return () => {
      // @ts-ignore
      window.navigation.removeEventListener("navigate", handleChange)
    }

  }, []);

  useEffect(() => {
    fetchEntries(1, searchQuery, sortDirection);
  }, [sortDirection, searchQuery]);

  const handleDownload = async (id: number) => {
    try {
      const response = await fetch(``);
      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Utworzenie linku do pobrania
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${id}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Błąd podczas pobierania pliku');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={() => setSortDirection('desc')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${sortDirection === 'desc'
            ? 'bg-red-600 text-white'
            : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
            }`}
        >
          Najnowsze
        </button>
        <button
          onClick={() => setSortDirection('asc')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${sortDirection === 'asc'
            ? 'bg-red-600 text-white'
            : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
            }`}
        >
          Najstarsze
        </button>
      </div>

      {entries.map((entry) => (
        <div
          key={entry.id}
          className="bg-zinc-800 rounded-lg p-4 hover:bg-zinc-750 transition-colors border border-red-600/10 hover:border-red-600/20"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex-grow">
              <h3 className="text-lg font-medium text-orange-600 hover:text-orange-500 transition-colors">
                {entry.title.romaji}
              </h3>
              {entry.title.english !== entry.title.romaji && (
                <p className="text-sm text-zinc-400">
                  {entry.title.english}
                </p>
              )}
              {entry.title.other && entry.title.other !== entry.title.english && (
                <p className="text-sm text-zinc-400">
                  {entry.title.other}
                </p>
              )}
            </div>
            <span className="text-sm text-red-300">
              {new Date(entry.date).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm text-zinc-400">
              Dodane przez: <span className="text-red-400 font-medium">{entry.author.nick}</span>
            </div>
            <a
              href={`/api/download/${entry.id}`}
              className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            >
              Pobierz
            </a>
          </div>
        </div>
      ))}

      {loading && (
        <div className="text-center py-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="text-center text-zinc-400 py-8">
          {searchQuery ? (
            <>
              Nie znaleziono wyników dla: <span className="text-red-400">{searchQuery}</span>
            </>
          ) : (
            'Brak dostępnych wpisów'
          )}
        </div>
      )}

      {hasMore && entries.length > 0 && (
        <div ref={observerTarget} className="h-4" />
      )}
    </div>
  );
}
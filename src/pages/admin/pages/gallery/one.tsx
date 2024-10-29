import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface SearchResult {
    caption?: {
        text?: string;
    };
}

const Search = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const isLoggedIn = document.cookie.includes('loggedIn=true');
        if (!isLoggedIn) {
            router.push('/login'); // Redirect ke halaman login jika belum login
        }
    }, [router]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!query.trim()) {
            setError('Query cannot be empty.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:3001/api/search/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
            });

            if (response.ok) {
                const data = await response.json();
                setResults(data);
            } else {
                const { error } = await response.json();
                setError(error || 'Search failed');
            }
        } catch (err) {
            setError('An error occurred during search.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Search Instagram Content</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSearch}>
                <div>
                    <input
                        type="text"
                        placeholder="Search for tags"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>
            <div>
                <h2>Results</h2>
                {results.length === 0 && !loading && <p>No results found.</p>}
                <ul>
                    {results.map((item, index) => (
                        <li key={index}>
                            {item.caption?.text || 'No caption'}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Search;

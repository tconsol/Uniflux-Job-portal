import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Loader2, ExternalLink } from 'lucide-react';
import { getUsers } from '../api/admin.api';
import Badge from '../components/Badge';

export default function Users() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users', page, query],
    queryFn: () => getUsers(page, query),
    staleTime: 1000 * 30,
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(search);
    setPage(1);
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Users</h1>
        {data && <span className="text-sm text-gray-500">{data.total.toLocaleString()} total</span>}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          Search
        </button>
        {query && (
          <button
            type="button"
            onClick={() => { setSearch(''); setQuery(''); setPage(1); }}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Clear
          </button>
        )}
      </form>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
          </div>
        ) : error || !data ? (
          <p className="text-center text-red-500 py-10">Failed to load users</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Name</th>
                    <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Email</th>
                    <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Status</th>
                    <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Joined</th>
                    <th className="text-right text-xs text-gray-500 font-medium px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            {user.isAdmin && <span className="text-xs text-brand-600">Admin</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge label={user.isActive ? 'active' : 'inactive'} />
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/users/${user._id}`}
                          className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 text-xs font-medium"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {data.users.length === 0 && (
                <p className="text-center text-gray-400 py-12 text-sm">No users found</p>
              )}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Page {data.page} of {data.totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

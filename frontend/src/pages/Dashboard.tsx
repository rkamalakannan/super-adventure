import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { routesApi, type Route } from '../api/client';

const AUSTRIAN_CITIES = [
  'Vienna', 'Salzburg', 'Innsbruck', 'Graz', 'Linz',
  'Klagenfurt', 'Bregenz', 'St. Pölten', 'Wels', 'Villach'
];

export default function Dashboard() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoute, setNewRoute] = useState({
    fromCity: '',
    toCity: '',
    travelDate: '',
    thresholdPrice: 50,
  });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const data = await routesApi.getAll();
      setRoutes(data);
    } catch (err: any) {
      setError('Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await routesApi.create(newRoute);
      setShowAddForm(false);
      setNewRoute({
        fromCity: '',
        toCity: '',
        travelDate: '',
        thresholdPrice: 50,
      });
      fetchRoutes();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add route');
    }
  };

  const handleDeleteRoute = async (id: number) => {
    if (!confirm('Are you sure you want to delete this route?')) return;
    try {
      await routesApi.delete(id);
      fetchRoutes();
    } catch (err: any) {
      setError('Failed to delete route');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-indigo-600">TrainTracker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Tracked Routes</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              {showAddForm ? 'Cancel' : 'Add Route'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {showAddForm && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <form onSubmit={handleAddRoute} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">From</label>
                    <select
                      required
                      value={newRoute.fromCity}
                      onChange={(e) => setNewRoute({ ...newRoute, fromCity: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3"
                    >
                      <option value="">Select city</option>
                      {AUSTRIAN_CITIES.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">To</label>
                    <select
                      required
                      value={newRoute.toCity}
                      onChange={(e) => setNewRoute({ ...newRoute, toCity: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3"
                    >
                      <option value="">Select city</option>
                      {AUSTRIAN_CITIES.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Travel Date</label>
                    <input
                      type="date"
                      required
                      value={newRoute.travelDate}
                      onChange={(e) => setNewRoute({ ...newRoute, travelDate: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Alert Threshold (€)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newRoute.thresholdPrice}
                      onChange={(e) => setNewRoute({ ...newRoute, thresholdPrice: Number(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Add Route
                </button>
              </form>
            </div>
          )}

          {routes.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
              No routes tracked yet. Add your first route to start tracking prices.
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Threshold
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alerts
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {routes.map((route) => (
                    <tr key={route.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {route.fromCity} → {route.toCity}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {route.travelDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        €{route.thresholdPrice}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            route.alertEnabled
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {route.alertEnabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/routes/${route.id}`}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDeleteRoute(route.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
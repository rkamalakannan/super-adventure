import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { routesApi, type Route, type PriceRecord } from '../api/client';

export default function RouteDetail() {
  const { id } = useParams<{ id: string }>();
  const [route, setRoute] = useState<Route | null>(null);
  const [prices, setPrices] = useState<PriceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchPrices();
    }
  }, [id]);

  const fetchPrices = async () => {
    if (!id) return;
    try {
      const data = await routesApi.getPrices(Number(id));
      setRoute(data.route);
      setPrices(data.prices);
    } catch (err: any) {
      setError('Failed to load route');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchPrice = async () => {
    if (!id) return;
    setFetchingPrice(true);
    try {
      await routesApi.fetchPrice(Number(id));
      fetchPrices();
    } catch (err: any) {
      setError('Failed to fetch price');
    } finally {
      setFetchingPrice(false);
    }
  };

  const handleToggleAlerts = async () => {
    if (!route) return;
    try {
      await routesApi.update(route.id, { alertEnabled: !route.alertEnabled });
      setRoute({ ...route, alertEnabled: !route.alertEnabled });
    } catch (err: any) {
      setError('Failed to update alerts');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Route not found</div>
      </div>
    );
  }

  const chartData = [...prices].reverse().map((p) => ({
    date: new Date(p.fetchedAt).toLocaleDateString(),
    price: p.price,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 mr-4">
                ← Back
              </Link>
              <h1 className="text-xl font-bold text-indigo-600">TrainTracker</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {route.fromCity} → {route.toCity}
                </h2>
                <p className="text-gray-500 mt-1">Travel Date: {route.travelDate}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleFetchPrice}
                  disabled={fetchingPrice}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {fetchingPrice ? 'Fetching...' : 'Fetch Latest Price'}
                </button>
                <button
                  onClick={handleToggleAlerts}
                  className={`px-4 py-2 rounded-md ${
                    route.alertEnabled
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  {route.alertEnabled ? 'Alerts On' : 'Alerts Off'}
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-500">Threshold</div>
                <div className="text-lg font-semibold">€{route.thresholdPrice}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Latest Price</div>
                <div className="text-lg font-semibold">
                  {prices.length > 0 ? `€${prices[0].price.toFixed(2)}` : '-'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Alert Status</div>
                <div className="text-lg font-semibold">
                  {route.alertEnabled ? 'Active' : 'Disabled'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Price History</h3>
            {prices.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No price history yet. Click "Fetch Latest Price" to get started.
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={['dataMin - 10', 'dataMax + 10']} />
                    <Tooltip
                      formatter={(value: number) => [`€${value.toFixed(2)}`, 'Price']}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#4f46e5"
                      strokeWidth={2}
                      dot={{ fill: '#4f46e5' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Price Checks</h3>
            {prices.length === 0 ? (
              <div className="text-gray-500">No price checks yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {prices.slice(0, 10).map((price) => (
                      <tr key={price.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(price.fetchedAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          €{price.price.toFixed(2)}
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
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Menu, X } from 'lucide-react';

const DailyIncomeExpenseTracker = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(true);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    category: '',
    amount: '',
    description: ''
  });

  // Fixed: Ensure API URL is always set correctly
  const API_URL = process.env.REACT_APP_API_URL || 'https://income-expense-tracker-sage.vercel.app/api/entries';

  const categories = {
    income: ['Salary', 'Freelance', 'Business', 'Investment', 'Other Income'],
    expense: ['Groceries', 'Rent', 'Utilities', 'Transport', 'Entertainment', 'Shopping', 'Food', 'Health', 'Other Expense']
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      console.log('Fetching from:', API_URL);
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setEntries(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching entries:', error);
      setLoading(false);
      alert('Failed to load entries. Please check your internet connection.');
    }
  };

  const addEntry = async () => {
    if (newEntry.category && newEntry.amount) {
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...newEntry,
            amount: parseFloat(newEntry.amount)
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const savedEntry = await response.json();
        setEntries([savedEntry, ...entries]);

        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          type: 'expense',
          category: '',
          amount: '',
          description: ''
        });
      } catch (error) {
        console.error('Error adding entry:', error);
        alert('Failed to add entry. Please try again.');
      }
    }
  };

  const deleteEntry = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        setEntries(entries.filter(entry => entry._id !== id));
      } catch (error) {
        console.error('Error deleting entry:', error);
        alert('Failed to delete entry. Please try again.');
      }
    }
  };

  const getMonthlyData = () => {
    const monthly = {};

    entries.forEach(entry => {
      const monthKey = entry.date.substring(0, 7);
      if (!monthly[monthKey]) {
        monthly[monthKey] = { income: 0, expense: 0, entries: [] };
      }

      if (entry.type === 'income') {
        monthly[monthKey].income += entry.amount;
      } else {
        monthly[monthKey].expense += entry.amount;
      }
      monthly[monthKey].entries.push(entry);
    });

    return monthly;
  };

  const monthlyData = getMonthlyData();
  const sortedMonths = Object.keys(monthlyData).sort().reverse();

  const formatMonth = (monthKey) => {
    const date = new Date(monthKey + '-01');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 pb-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pt-4 sm:pt-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="text-blue-600" size={28} />
            <span className="break-words">Daily Income & Expense Tracker</span>
          </h1>
        </div>

        {/* Add New Entry Form */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Add New Entry</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="sm:hidden text-blue-600"
            >
              {showForm ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <div className={`${showForm ? 'block' : 'hidden sm:block'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newEntry.type}
                  onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value, category: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newEntry.category}
                  onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                >
                  <option value="">Select...</option>
                  {categories[newEntry.type].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs)</label>
                <input
                  type="number"
                  value={newEntry.amount}
                  onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newEntry.description}
                    onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                    placeholder="Optional"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                  />
                  <button
                    onClick={addEntry}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-1 whitespace-nowrap"
                  >
                    <Plus size={20} />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {sortedMonths[0] && (
            <>
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-700 font-medium">Current Month Income</div>
                <div className="text-xl sm:text-2xl font-bold text-green-800">Rs {monthlyData[sortedMonths[0]].income.toFixed(2)}</div>
              </div>
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="text-sm text-red-700 font-medium">Current Month Expenses</div>
                <div className="text-xl sm:text-2xl font-bold text-red-800">Rs {monthlyData[sortedMonths[0]].expense.toFixed(2)}</div>
              </div>
              <div className={`border-2 rounded-lg p-4 ${monthlyData[sortedMonths[0]].income - monthlyData[sortedMonths[0]].expense >= 0
                ? 'bg-blue-50 border-blue-200'
                : 'bg-orange-50 border-orange-200'
                }`}>
                <div className={`text-sm font-medium ${monthlyData[sortedMonths[0]].income - monthlyData[sortedMonths[0]].expense >= 0
                  ? 'text-blue-700'
                  : 'text-orange-700'
                  }`}>Current Month Balance</div>
                <div className={`text-xl sm:text-2xl font-bold ${monthlyData[sortedMonths[0]].income - monthlyData[sortedMonths[0]].expense >= 0
                  ? 'text-blue-800'
                  : 'text-orange-800'
                  }`}>
                  Rs {(monthlyData[sortedMonths[0]].income - monthlyData[sortedMonths[0]].expense).toFixed(2)}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Monthly Breakdown */}
        {sortedMonths.map(monthKey => (
          <div key={monthKey} className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">{formatMonth(monthKey)}</h2>
              <div className="flex flex-wrap gap-2 sm:gap-4 text-sm sm:text-base">
                <span className="text-green-600 font-semibold">Income: Rs {monthlyData[monthKey].income.toFixed(2)}</span>
                <span className="text-red-600 font-semibold">Expense: Rs {monthlyData[monthKey].expense.toFixed(2)}</span>
                <span className={`font-bold ${monthlyData[monthKey].income - monthlyData[monthKey].expense >= 0 ? 'text-blue-600' : 'text-orange-600'
                  }`}>
                  Balance: Rs {(monthlyData[monthKey].income - monthlyData[monthKey].expense).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Date</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Type</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Category</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Description</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold">Amount (Rs)</th>
                    <th className="px-4 py-2 text-center text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData[monthKey].entries
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((entry) => (
                      <tr key={entry._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{formatDate(entry.date)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${entry.type === 'income'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {entry.type === 'income' ? 'Income' : 'Expense'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">{entry.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{entry.description}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${entry.type === 'income' ? 'text-green-700' : 'text-red-700'
                          }`}>
                          {entry.type === 'income' ? '+' : '-'} Rs {entry.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => deleteEntry(entry._id)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete entry"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {monthlyData[monthKey].entries
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((entry) => (
                  <div key={entry._id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${entry.type === 'income'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {entry.type === 'income' ? 'Income' : 'Expense'}
                        </span>
                        <div className="text-sm text-gray-600 mt-1">{formatDate(entry.date)}</div>
                      </div>
                      <button
                        onClick={() => deleteEntry(entry._id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="font-semibold text-gray-800">{entry.category}</div>
                    {entry.description && (
                      <div className="text-sm text-gray-600 mt-1">{entry.description}</div>
                    )}
                    <div className={`text-lg font-bold mt-2 ${entry.type === 'income' ? 'text-green-700' : 'text-red-700'
                      }`}>
                      {entry.type === 'income' ? '+' : '-'} Rs {entry.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}

        {entries.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
            <p className="text-gray-500 text-base sm:text-lg">No entries yet. Add your first income or expense above!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyIncomeExpenseTracker;
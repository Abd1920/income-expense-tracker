import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, ArrowRight } from 'lucide-react';

const DailyIncomeExpenseTracker = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    category: '',
    amount: '',
    description: ''
  });

  const API_URL = process.env.REACT_APP_API_URL || 'https://income-expense-tracker-sage.vercel.app/api/entries';

  const categories = {
    income: ['Salary', 'Freelance', 'Business', 'Investment', 'Balance from Previous Month', 'Other Income'],
    expense: ['Groceries', 'Rent', 'Utilities', 'Transport', 'Entertainment', 'Shopping', 'Food', 'Health', 'Other Expense']
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
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

  const getPreviousMonthBalance = (currentMonthKey) => {
    const currentDate = new Date(currentMonthKey + '-01');
    currentDate.setMonth(currentDate.getMonth() - 1);
    const previousMonthKey = currentDate.toISOString().substring(0, 7);
    
    if (monthlyData[previousMonthKey]) {
      const prevBalance = monthlyData[previousMonthKey].income - monthlyData[previousMonthKey].expense;
      return prevBalance > 0 ? prevBalance : 0;
    }
    return 0;
  };

  const addCarryForwardBalance = async () => {
    const currentMonthKey = new Date().toISOString().substring(0, 7);
    const previousBalance = getPreviousMonthBalance(currentMonthKey);

    if (previousBalance <= 0) {
      alert('No positive balance from previous month to carry forward!');
      return;
    }

    const carryForwardExists = entries.some(entry => 
      entry.date.substring(0, 7) === currentMonthKey && 
      entry.category === 'Balance from Previous Month'
    );

    if (carryForwardExists) {
      alert('Balance from previous month already added for this month!');
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          type: 'income',
          category: 'Balance from Previous Month',
          amount: previousBalance,
          description: `Carried forward from previous month`
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const savedEntry = await response.json();
      setEntries([savedEntry, ...entries]);
      alert(`Successfully added Rs ${previousBalance.toFixed(2)} from previous month!`);
    } catch (error) {
      console.error('Error adding carry forward:', error);
      alert('Failed to add carry forward balance. Please try again.');
    }
  };

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

  const currentMonthKey = new Date().toISOString().substring(0, 7);
  const previousBalance = getPreviousMonthBalance(currentMonthKey);
  const hasCarryForward = entries.some(entry => 
    entry.date.substring(0, 7) === currentMonthKey && 
    entry.category === 'Balance from Previous Month'
  );

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-blue-600 flex items-center gap-2">
            <div className="bg-blue-600 rounded p-1">
              <Calendar className="text-white" size={20} />
            </div>
            Daily Income & Expense Tracker
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Carry Forward Balance Banner */}
        {previousBalance > 0 && !hasCarryForward && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-800">Previous Month Balance Available</h3>
                <p className="text-sm text-gray-600 mt-1">
                  You have <span className="font-bold text-green-700">Rs {previousBalance.toFixed(2)}</span> from last month
                </p>
              </div>
              <button
                onClick={addCarryForwardBalance}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm"
              >
                <ArrowRight size={18} />
                Add to This Month
              </button>
            </div>
          </div>
        )}

        {/* Add New Entry Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Add New Entry</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={newEntry.type}
                onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value, category: '' })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={newEntry.category}
                onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select...</option>
                {categories[newEntry.type].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount (Rs)</label>
              <input
                type="number"
                value={newEntry.amount}
                onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                placeholder="500"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <input
                type="text"
                value={newEntry.description}
                onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                placeholder="Groceries for the week"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Add Button - Centered and Full Width */}
          <button
            onClick={addEntry}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 mt-2"
          >
            <Plus size={20} />
            Add
          </button>
        </div>

        {/* Monthly Summary Cards */}
        {sortedMonths[0] && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="text-sm text-gray-600 mb-1">Current Month Income</div>
              <div className="text-2xl font-bold text-green-600">Rs {monthlyData[sortedMonths[0]].income.toFixed(2)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="text-sm text-gray-600 mb-1">Current Month Expenses</div>
              <div className="text-2xl font-bold text-red-600">Rs {monthlyData[sortedMonths[0]].expense.toFixed(2)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="text-sm text-gray-600 mb-1">Current Month Balance</div>
              <div className={`text-2xl font-bold ${monthlyData[sortedMonths[0]].income - monthlyData[sortedMonths[0]].expense >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                Rs {(monthlyData[sortedMonths[0]].income - monthlyData[sortedMonths[0]].expense).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Monthly Breakdown */}
        {sortedMonths.map(monthKey => (
          <div key={monthKey} className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{formatMonth(monthKey)}</h2>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-green-600 font-semibold">Income: Rs {monthlyData[monthKey].income.toFixed(2)}</span>
                <span className="text-red-600 font-semibold">Expense: Rs {monthlyData[monthKey].expense.toFixed(2)}</span>
                <span className={`font-bold ${monthlyData[monthKey].income - monthlyData[monthKey].expense >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  Balance: Rs {(monthlyData[monthKey].income - monthlyData[monthKey].expense).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount (Rs)</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData[monthKey].entries
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((entry) => (
                      <tr key={entry._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(entry.date)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${entry.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {entry.type === 'income' ? 'Income' : 'Expense'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{entry.description}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {entry.type === 'income' ? '+' : '-'} Rs {entry.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => deleteEntry(entry._id)}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition"
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
                  <div key={entry._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${entry.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {entry.type === 'income' ? 'Income' : 'Expense'}
                        </span>
                        <div className="text-sm text-gray-600 mt-2">{formatDate(entry.date)}</div>
                      </div>
                      <button
                        onClick={() => deleteEntry(entry._id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="font-semibold text-gray-900">{entry.category}</div>
                    {entry.description && (
                      <div className="text-sm text-gray-600 mt-1">{entry.description}</div>
                    )}
                    <div className={`text-lg font-bold mt-2 ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {entry.type === 'income' ? '+' : '-'} Rs {entry.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}

        {entries.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">No entries yet. Add your first income or expense above!</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center">
          <p className="text-sm text-gray-500">© 2026 Daily Income & Expense Tracker. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default DailyIncomeExpenseTracker;
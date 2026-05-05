import React, { useEffect, useState } from 'react';
import { leadsAPI } from '../services/api';
import { FiSearch, FiPlus, FiFilter } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const LeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', city: '', courseInterested: '', source: 'WEBSITE' });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data } = await leadsAPI.getLeads({
        search,
        status: status || undefined,
        page,
        limit: 10
      });
      setLeads(data.leads);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, status, page]);

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      await leadsAPI.createLead(formData);
      setFormData({ name: '', email: '', phone: '', city: '', courseInterested: '', source: 'WEBSITE' });
      setShowModal(false);
      fetchLeads();
    } catch (error) {
      console.error('Failed to create lead:', error);
    }
  };

  const getScoreBadgeColor = (score) => {
    if (score > 80) return 'bg-red-100 text-red-800';
    if (score > 50) return 'bg-orange-100 text-orange-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="p-8 bg-[#F7F8FC] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#1B2B4B]">Leads</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#F6AD2B] hover:bg-yellow-500 text-white px-4 py-2 rounded-lg transition"
        >
          <FiPlus /> Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F6AD2B]"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F6AD2B]"
          >
            <option value="">All Status</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="ENROLLED">Enrolled</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No leads found</div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-[#1B2B4B] text-white">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Phone</th>
                  <th className="px-6 py-3 text-left">Course</th>
                  <th className="px-6 py-3 text-center">Score</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-[#1B2B4B]">{lead.name}</td>
                    <td className="px-6 py-4 text-gray-600">{lead.email}</td>
                    <td className="px-6 py-4 text-gray-600">{lead.phone}</td>
                    <td className="px-6 py-4 text-gray-600">{lead.courseInterested}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getScoreBadgeColor(lead.activityScore)}`}>
                        {lead.activityScore}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link to={`/leads/${lead.id}`} className="text-[#F6AD2B] hover:underline font-semibold">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-between items-center p-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">Showing {leads.length} of {total} leads</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * 10 >= total}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-[#1B2B4B] mb-6">Add New Lead</h2>
            <form onSubmit={handleCreateLead} className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F6AD2B]"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F6AD2B]"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F6AD2B]"
              />
              <input
                type="text"
                placeholder="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F6AD2B]"
              />
              <input
                type="text"
                placeholder="Course Interested"
                value={formData.courseInterested}
                onChange={(e) => setFormData({ ...formData, courseInterested: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F6AD2B]"
              />
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#F6AD2B]"
              >
                <option value="WEBSITE">Website</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="GOOGLE">Google</option>
                <option value="REFERRAL">Referral</option>
                <option value="WALK_IN">Walk-in</option>
              </select>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-[#F6AD2B] hover:bg-yellow-500 text-white font-bold py-2 rounded-lg transition"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsPage;

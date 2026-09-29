import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Tournaments = () => {
  const { user } = useAuthStore();
  const [tournaments, setTournaments] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({ name: '', clubId: '', refereeId: '' });
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    fetchTournaments();
    axios.get('/api/clubs').then(res => setClubs(res.data)).catch(console.error);
    if (user && ['admin', 'faculty'].includes(user.role)) {
      axios.get('/api/auth/users', { withCredentials: true }).then(res => setUsers(res.data)).catch(console.error);
    }
  }, [user]);

  const fetchTournaments = () => {
    axios.get('/api/tournaments').then(res => setTournaments(res.data)).catch(console.error);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handlePreview = async () => {
    if (!file) return toast.error("Select an Excel file");
    const data = new FormData();
    data.append('file', file);
    data.append('preview', 'true');
    try {
      const res = await axios.post('/api/tournaments/upload', data, { withCredentials: true });
      setPreview(res.data.preview);
      toast.success("Preview loaded");
    } catch (err) {
      toast.error("Failed to load preview");
    }
  };

  const handleConfirm = async () => {
    if (!formData.name || !formData.clubId || !formData.refereeId) {
      return toast.error("Please fill all details");
    }
    const data = new FormData();
    data.append('file', file);
    data.append('name', formData.name);
    data.append('clubId', formData.clubId);
    data.append('refereeId', formData.refereeId);
    
    try {
      await axios.post('/api/tournaments/upload', data, { withCredentials: true });
      toast.success("Tournament and Bracket created!");
      setPreview(null);
      setFile(null);
      setFormData({ name: '', clubId: '', refereeId: '' });
      fetchTournaments();
    } catch (err) {
      toast.error("Failed to create tournament");
    }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Section Name,Class/Year,Student Roll Numbers\nPharma-A,2026,\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tournament_template.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black mb-6">Tournaments</h1>
      
      {user && ['admin', 'faculty'].includes(user.role) && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-bold mb-4">Create Tournament</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input type="text" placeholder="Tournament Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="px-4 py-2 border rounded-xl" />
            <select value={formData.clubId} onChange={e => setFormData({...formData, clubId: e.target.value})} className="px-4 py-2 border rounded-xl">
              <option value="">Select Club</option>
              {clubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <select value={formData.refereeId} onChange={e => setFormData({...formData, refereeId: e.target.value})} className="px-4 py-2 border rounded-xl">
              <option value="">Select Primary Referee</option>
              {users.filter(u => u.role === 'referee' || u.role === 'admin').map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </div>
          <div className="flex gap-4 items-center">
            <input type="file" accept=".xlsx, .csv" onChange={handleFileChange} className="border p-2 rounded-xl" />
            <button onClick={downloadTemplate} className="text-sm text-primary-600 font-bold underline">Download Template</button>
            <button onClick={handlePreview} className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold">Preview Data</button>
          </div>
          
          {preview && (
            <div className="mt-6 border-t pt-4">
              <h3 className="font-bold mb-2">Data Preview ({preview.length} sections)</h3>
              <div className="max-h-60 overflow-y-auto mb-4 border rounded-xl">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr><th className="p-2">Section</th><th className="p-2">Class</th></tr>
                  </thead>
                  <tbody>
                    {preview.map((p, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{p.name}</td>
                        <td className="p-2">{p.classOrYear}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={handleConfirm} className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold w-full">Confirm & Generate Bracket</button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-6">
        {tournaments.map(t => (
           <div key={t._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-black">{t.name}</h2>
              <p className="text-gray-500 mb-4">{t.clubId?.name} • {t.status.toUpperCase()} • {t.sections.length} Teams</p>
              
              <div className="mt-4">
                 {/* Basic Bracket Visualization Link or Component */}
                 <a href={`/tournaments/${t._id}/bracket`} className="text-primary-600 font-bold hover:underline">View Full Bracket Tree &rarr;</a>
              </div>
           </div>
        ))}
        {tournaments.length === 0 && <p className="text-gray-500">No tournaments active.</p>}
      </div>
    </div>
  );
};

export default Tournaments;

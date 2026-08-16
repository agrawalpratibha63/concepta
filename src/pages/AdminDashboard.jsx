import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Clock, ShieldCheck, Search, Database } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AdminDashboard() {
  const { getRegisteredStudents } = useAuth()
  const [realUsers, setRealUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // 🔄 Fetching REAL users from your backend
  useEffect(() => {
    const fetchRealUsers = async () => {
      try {
        const data = await getRegisteredStudents()
        setRealUsers(data || [])
      } catch (error) {
        console.error("Error fetching real users:", error)
        setRealUsers([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRealUsers()
  }, [])

  const filteredUsers = realUsers.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="product-page pt-24 pb-12 min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section (No Sidebar, Just Top Level) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold tracking-tight flex items-center gap-3"
            >
              Founder Access
              <ShieldCheck className="w-8 h-8 text-indigo-500" />
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-500 dark:text-slate-400 mt-1"
            >
              Real-time monitor for actual student logins and platform history.
            </motion.p>
          </div>
        </div>

        {/* Real Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Real Students</h3>
              <p className="text-3xl font-bold mt-1">{isLoading ? '...' : realUsers.length}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Database className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Database Status</h3>
              <p className="text-xl font-bold mt-2 text-emerald-500">Live & Connected</p>
            </div>
          </motion.div>
        </div>

        {/* Real Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              Visit History
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search real users..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-slate-500">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
                Fetching live data from backend...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-slate-500">
                <Database className="w-12 h-12 mb-3 opacity-20" />
                <p>No real users found in the database yet.</p>
                <p className="text-sm mt-1">When students login, they will appear here.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Student Name & Email</th>
                    <th className="px-6 py-4 font-medium">Last Login / Visit</th>
                    <th className="px-6 py-4 font-medium">Platform Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredUsers.map((student, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                            {student.name ? student.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{student.name || 'Unknown Student'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {student.lastLoginAt?.toDate?.().toLocaleString() || 'Recently'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

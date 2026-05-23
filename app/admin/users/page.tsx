'use client'

import { Users, Shield, UserCheck } from 'lucide-react'

const MOCK_USERS = [
  { id: 'u-1', name: 'Super Admin', email: 'admin@globalauto.com', role: 'admin', company: 'GlobalAuto HQ' },
  { id: 'u-2', name: 'Kim Dealer', email: 'kim@dealer.co.kr', role: 'dealer', company: 'Incheon Auto Export' },
  { id: 'u-3', name: 'Alex Kofi', email: 'alex.kofi@gmail.com', role: 'buyer', company: 'Accra Auto Imports' }
]

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Users & Roles</h1>
        <p className="text-slate-400 text-xs mt-0.5">Manage user profiles, assign roles, and grant permissions.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow overflow-x-auto">
        <table className="w-full text-slate-300 text-sm text-left">
          <thead>
            <tr className="border-b border-slate-850 text-slate-400 text-xs uppercase tracking-wider font-bold">
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Company</th>
              <th className="py-3 px-4 text-right">System Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {MOCK_USERS.map((user) => (
              <tr key={user.id} className="hover:bg-slate-800/40 transition">
                <td className="py-3.5 px-4 font-bold text-white flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-slate-400" />
                  <span>{user.name}</span>
                </td>
                <td className="py-3.5 px-4 text-slate-400">{user.email}</td>
                <td className="py-3.5 px-4 text-slate-400 text-xs">{user.company}</td>
                <td className="py-3.5 px-4 text-right">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded capitalize ${
                    user.role === 'admin' 
                      ? 'bg-red-950/40 text-red-400 border border-red-900/30' 
                      : user.role === 'dealer'
                      ? 'bg-blue-950/40 text-blue-400 border border-blue-900/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {user.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

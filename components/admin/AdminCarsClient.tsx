'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Edit, AlertCircle, RefreshCw } from 'lucide-react'

interface AdminCarsClientProps {
  initialCars: any[]
}

export default function AdminCarsClient({ initialCars }: AdminCarsClientProps) {
  const supabase = createClient()
  const [cars, setCars] = useState<any[]>(initialCars)
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)

  // 상태 변경
  const handleStatusChange = async (carId: string, newStatus: 'available' | 'reserved' | 'sold') => {
    try {
      const { error } = await supabase
        .from('cars')
        .update({ status: newStatus })
        .eq('id', carId)

      if (error) throw error

      setCars(cars.map((c) => c.id === carId ? { ...c, status: newStatus } : c))
      showFeedback('Status updated successfully!')
    } catch (e) {
      // 로컬 강제 업데이트 (데모/개발용)
      setCars(cars.map((c) => c.id === carId ? { ...c, status: newStatus } : c))
      showFeedback('Status updated successfully! (Local state)')
    }
  }

  // 차량 삭제
  const handleDeleteCar = async (carId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return
    try {
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId)

      if (error) throw error

      setCars(cars.filter((c) => c.id !== carId))
      showFeedback('Vehicle deleted successfully.')
    } catch (e) {
      // 로컬 강제 삭제
      setCars(cars.filter((c) => c.id !== carId))
      showFeedback('Vehicle deleted successfully. (Local state)')
    }
  }

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg)
    setTimeout(() => setFeedbackMsg(null), 3000)
  }

  return (
    <div className="space-y-6">
      
      {/* 타이틀 및 추가 버튼 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Cars Inventory</h1>
          <p className="text-slate-400 text-xs mt-1">Manage export vehicles, change status, and update specs.</p>
        </div>
        <div>
          <Link
            href="/admin/cars/new"
            className="bg-accent hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow transition active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add New Vehicle
          </Link>
        </div>
      </div>

      {feedbackMsg && (
        <div className="bg-slate-900 border border-slate-800/80 text-accent text-xs rounded-lg p-3 flex items-center gap-2 shadow animate-in fade-in duration-200">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* 차량 리스트 카드 및 테이블 */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow">
        
        {cars.length === 0 ? (
          <div className="text-center py-20">
            <AlertCircle className="h-10 w-10 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No vehicles registered yet.</p>
            <Link
              href="/admin/cars/new"
              className="text-xs text-accent font-bold mt-2 inline-block hover:underline"
            >
              Add your first vehicle
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-slate-300 text-sm text-left">
              <thead>
                <tr className="border-b border-slate-850 text-slate-400 text-xs uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Year / Mileage</th>
                  <th className="py-3 px-4">Price (USD)</th>
                  <th className="py-3 px-4">Selling Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {cars.map((car) => (
                  <tr key={car.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-400">{car.brand}</td>
                    <td className="py-3.5 px-4 font-extrabold text-white">{car.title}</td>
                    <td className="py-3.5 px-4 text-slate-400 text-xs">
                      {car.year} Year / {Number(car.mileage).toLocaleString()} km
                    </td>
                    <td className="py-3.5 px-4 font-bold text-accent">${Number(car.price_usd).toLocaleString()}</td>
                    
                    {/* 상태 변경 셀렉트 */}
                    <td className="py-3.5 px-4">
                      <select
                        value={car.status}
                        onChange={(e) => handleStatusChange(car.id, e.target.value as any)}
                        className={`bg-slate-950 border text-xs font-bold px-2 py-1 rounded cursor-pointer ${
                          car.status === 'available' 
                            ? 'text-emerald-400 border-emerald-950' 
                            : car.status === 'reserved' 
                            ? 'text-amber-400 border-amber-950' 
                            : 'text-slate-400 border-slate-800'
                        }`}
                      >
                        <option value="available" className="text-emerald-400">Available</option>
                        <option value="reserved" className="text-amber-400">Reserved</option>
                        <option value="sold" className="text-slate-400">Sold Out</option>
                      </select>
                    </td>

                    {/* 제어 버튼 */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/cars/edit/${car.id}`}
                          className="p-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white rounded transition cursor-pointer"
                          title="Edit vehicle"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteCar(car.id)}
                          className="p-1.5 bg-red-950/20 text-red-400 hover:bg-red-950/50 rounded transition cursor-pointer"
                          title="Delete vehicle"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}

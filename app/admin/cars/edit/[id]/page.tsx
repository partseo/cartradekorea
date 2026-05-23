'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

// Zod 유효성 검사 스키마
const carFormSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters.' }),
  brand: z.string().min(2, { message: 'Brand must be at least 2 characters.' }),
  model: z.string().min(1, { message: 'Model must be at least 1 character.' }),
  year: z.number().min(2000).max(new Date().getFullYear() + 1),
  mileage: z.number().min(0),
  fuel_type: z.string().min(1, { message: 'Select fuel type.' }),
  transmission: z.string().min(1, { message: 'Select transmission.' }),
  price_usd: z.number().min(100),
  price_krw: z.number().min(100000),
  engine_displacement: z.string().optional(),
  drive_type: z.string().optional(),
  color: z.string().optional(),
  accident_history: z.string().optional(),
  seating_capacity: z.number(),
  description: z.string().optional(),
  options: z.string().optional(),

  // 수출 고도화 추가 필드 (Zod Resolver 타입 충돌 방지를 위해 default 배제)
  stock_number: z.string().min(2, { message: 'Stock number is required.' }),
  photo_verified: z.boolean(),
  dealer_source: z.string().optional(),
  vin_partial: z.string().optional(),
  vehicle_location: z.string().optional(),
  fob_port: z.string().optional(),
  steering_position: z.string(),
  engine_number_partial: z.string().optional(),
  hs_code: z.string().optional(),
  inspection_report_url: z.string().optional(),
  export_certificate_status: z.string(),
  status: z.enum(['available', 'reserved', 'sold'])
})

type CarFormValues = z.infer<typeof carFormSchema>

// 오프라인/데모용 폴백
const MOCK_CARS: Record<string, any> = {
  'avante-2020': {
    title: 'Hyundai Avante 1.6 Smart', brand: 'Hyundai', model: 'Avante', year: 2020, mileage: 45000, fuel_type: 'Gasoline', transmission: 'Automatic', price_usd: 11500, price_krw: 15500000, status: 'available', stock_number: 'ST-HY-001', photo_verified: true, dealer_source: 'Incheon Yard',
    specs: { engine_displacement: '1598cc', drive_type: '2WD', color: 'Polar White', accident_history: 'No accidents', seating_capacity: 5, description: 'Superb condition Avante.', options: 'Smart Key, Navigation, Leather Seats', vin_partial: 'KMHDK41D1LU******', vehicle_location: 'Incheon Port Yard 3', fob_port: 'Incheon Port', steering_position: 'LHD', engine_number_partial: 'G4FL-123***', hs_code: '8703.22.9000', inspection_report_url: '', export_certificate_status: 'completed' }
  }
}

export default function EditCarPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CarFormValues>({
    resolver: zodResolver(carFormSchema),
    defaultValues: {
      title: '',
      brand: '',
      model: '',
      year: 2020,
      mileage: 50000,
      fuel_type: 'Gasoline',
      transmission: 'Automatic',
      price_usd: 12000,
      price_krw: 16000000,
      engine_displacement: '',
      drive_type: '',
      color: '',
      accident_history: '',
      seating_capacity: 5,
      description: '',
      options: '',
      stock_number: '',
      photo_verified: false,
      dealer_source: '',
      vin_partial: '',
      vehicle_location: '',
      fob_port: '',
      steering_position: 'LHD',
      engine_number_partial: '',
      hs_code: '',
      inspection_report_url: '',
      export_certificate_status: 'pending',
      status: 'available'
    }
  })

  const watchPhotoVerified = watch('photo_verified')

  // 1. 기존 데이터 조회 및 폼 채우기
  useEffect(() => {
    async function fetchCarData() {
      setIsLoading(true)
      try {
        const { data: car, error } = await supabase
          .from('cars')
          .select('*, car_specs(*)')
          .eq('id', id)
          .single()

        if (car) {
          reset({
            title: car.title,
            brand: car.brand,
            model: car.model,
            year: car.year,
            mileage: car.mileage,
            fuel_type: car.fuel_type,
            transmission: car.transmission,
            price_usd: Number(car.price_usd),
            price_krw: Number(car.price_krw),
            status: car.status as any,
            stock_number: car.stock_number || '',
            photo_verified: car.photo_verified ?? false,
            dealer_source: car.dealer_source || '',
            engine_displacement: car.car_specs?.engine_displacement || '',
            drive_type: car.car_specs?.drive_type || '',
            color: car.car_specs?.color || '',
            accident_history: car.car_specs?.accident_history || '',
            seating_capacity: car.car_specs?.seating_capacity || 5,
            description: car.car_specs?.description || '',
            options: car.car_specs?.options?.join(', ') || '',
            vin_partial: car.car_specs?.vin_partial || '',
            vehicle_location: car.car_specs?.vehicle_location || '',
            fob_port: car.car_specs?.fob_port || '',
            steering_position: car.car_specs?.steering_position || 'LHD',
            engine_number_partial: car.car_specs?.engine_number_partial || '',
            hs_code: car.car_specs?.hs_code || '',
            inspection_report_url: car.car_specs?.inspection_report_url || '',
            export_certificate_status: car.car_specs?.export_certificate_status || 'pending'
          })
        } else {
          // 데모 폴백
          const mock = MOCK_CARS[id as string] || MOCK_CARS['avante-2020']
          reset({
            title: mock.title,
            brand: mock.brand,
            model: mock.model,
            year: mock.year,
            mileage: mock.mileage,
            fuel_type: mock.fuel_type,
            transmission: mock.transmission,
            price_usd: mock.price_usd,
            price_krw: mock.price_krw,
            status: mock.status,
            stock_number: mock.stock_number,
            photo_verified: mock.photo_verified,
            dealer_source: mock.dealer_source,
            engine_displacement: mock.specs.engine_displacement,
            drive_type: mock.specs.drive_type,
            color: mock.specs.color,
            accident_history: mock.specs.accident_history,
            seating_capacity: mock.specs.seating_capacity,
            description: mock.specs.description,
            options: mock.specs.options,
            vin_partial: mock.specs.vin_partial,
            vehicle_location: mock.specs.vehicle_location,
            fob_port: mock.specs.fob_port,
            steering_position: mock.specs.steering_position,
            engine_number_partial: mock.specs.engine_number_partial,
            hs_code: mock.specs.hs_code,
            inspection_report_url: mock.specs.inspection_report_url,
            export_certificate_status: mock.specs.export_certificate_status
          })
        }
      } catch (err) {
        console.error(err)
        const mock = MOCK_CARS[id as string] || MOCK_CARS['avante-2020']
        reset({
          title: mock.title,
          brand: mock.brand,
          model: mock.model,
          year: mock.year,
          mileage: mock.mileage,
          fuel_type: mock.fuel_type,
          transmission: mock.transmission,
          price_usd: mock.price_usd,
          price_krw: mock.price_krw,
          status: mock.status,
          stock_number: mock.stock_number,
          photo_verified: mock.photo_verified,
          dealer_source: mock.dealer_source,
          engine_displacement: mock.specs.engine_displacement,
          drive_type: mock.specs.drive_type,
          color: mock.specs.color,
          accident_history: mock.specs.accident_history,
          seating_capacity: mock.specs.seating_capacity,
          description: mock.specs.description,
          options: mock.specs.options,
          vin_partial: mock.specs.vin_partial,
          vehicle_location: mock.specs.vehicle_location,
          fob_port: mock.specs.fob_port,
          steering_position: mock.specs.steering_position,
          engine_number_partial: mock.specs.engine_number_partial,
          hs_code: mock.specs.hs_code,
          inspection_report_url: mock.specs.inspection_report_url,
          export_certificate_status: mock.specs.export_certificate_status
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (id) fetchCarData()
  }, [id, reset, supabase])

  const onSubmit = async (values: CarFormValues) => {
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      // 1) cars 업데이트
      const { error: carError } = await supabase
        .from('cars')
        .update({
          title: values.title,
          brand: values.brand,
          model: values.model,
          year: values.year,
          mileage: values.mileage,
          fuel_type: values.fuel_type,
          transmission: values.transmission,
          price_usd: values.price_usd,
          price_krw: values.price_krw,
          status: values.status,
          stock_number: values.stock_number,
          photo_verified: values.photo_verified,
          dealer_source: values.dealer_source
        })
        .eq('id', id)

      if (carError) throw carError

      // 2) car_specs 업데이트
      const optionsArray = values.options ? values.options.split(',').map(s => s.trim()) : []
      const { error: specError } = await supabase
        .from('car_specs')
        .update({
          engine_displacement: values.engine_displacement,
          drive_type: values.drive_type,
          color: values.color,
          accident_history: values.accident_history,
          seating_capacity: values.seating_capacity,
          options: optionsArray,
          description: values.description,
          vin_partial: values.vin_partial,
          vehicle_location: values.vehicle_location,
          fob_port: values.fob_port,
          steering_position: values.steering_position,
          engine_number_partial: values.engine_number_partial,
          hs_code: values.hs_code,
          inspection_report_url: values.inspection_report_url,
          export_certificate_status: values.export_certificate_status
        })
        .eq('car_id', id)

      if (specError) throw specError

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/cars')
        router.refresh()
      }, 2000)

    } catch (err: any) {
      console.error(err)
      setErrorMessage(err.message || 'Error occurred while saving vehicle modifications.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white space-y-4">
        <RefreshCw className="h-10 w-10 text-slate-500 animate-spin" />
        <p className="text-slate-400 font-semibold text-sm">Loading vehicle data...</p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 p-8 sm:p-10 rounded-2xl shadow-xl text-center py-16 animate-in zoom-in-95 duration-200">
        <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-white">Changes Saved!</h2>
        <p className="text-slate-400 text-sm mt-3 px-2 leading-relaxed">
          Vehicle details and export specifications have been successfully updated. Redirecting...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      
      <div className="flex items-center gap-3">
        <Link href="/admin/cars" className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Edit Vehicle Details</h1>
          <p className="text-slate-400 text-xs mt-0.5">Modify parameters and export configurations for this car.</p>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-950/40 border border-red-900/30 text-red-400 text-xs rounded-lg p-3.5 flex items-start gap-2">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* 1. 기본 정보 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow space-y-4">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2 mb-4">Basic Information</h2>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Display Title</label>
            <input
              type="text"
              {...register('title')}
              placeholder="e.g. Hyundai Avante 1.6 Smart"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
            />
            {errors.title && <p className="text-red-400 text-xs mt-1 font-semibold">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Brand</label>
              <input
                type="text"
                {...register('brand')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Model</label>
              <input
                type="text"
                {...register('model')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Model Year</label>
              <input
                type="number"
                {...register('year', { valueAsNumber: true })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mileage (km)</label>
              <input
                type="number"
                {...register('mileage', { valueAsNumber: true })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fuel Type</label>
              <select
                {...register('fuel_type')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none text-white cursor-pointer"
              >
                <option value="Gasoline">Gasoline</option>
                <option value="Diesel">Diesel</option>
                <option value="LPG">LPG</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Electric">Electric</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Transmission</label>
              <select
                {...register('transmission')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none text-white cursor-pointer"
              >
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Seating</label>
              <input
                type="number"
                {...register('seating_capacity', { valueAsNumber: true })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Price USD (FOB)</label>
              <input
                type="number"
                {...register('price_usd', { valueAsNumber: true })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Price KRW (Domestic)</label>
              <input
                type="number"
                {...register('price_krw', { valueAsNumber: true })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sale Status</label>
              <select
                {...register('status')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none text-white cursor-pointer"
              >
                <option value="available">Available (판매중)</option>
                <option value="reserved">Reserved (계약중)</option>
                <option value="sold">Sold (판매완료)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. 수출 특화 운영 데이터 필드 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow space-y-4">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2 mb-4">Export Operations Data</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Stock Number (재고번호)</label>
              <input
                type="text"
                {...register('stock_number')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
              {errors.stock_number && <p className="text-red-400 text-xs mt-1 font-semibold">{errors.stock_number.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Steering Position</label>
              <select
                {...register('steering_position')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none text-white cursor-pointer"
              >
                <option value="LHD">LHD (Left Hand Drive / 좌핸들)</option>
                <option value="RHD">RHD (Right Hand Drive / 우핸들)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dealer/Source Vendor</label>
              <input
                type="text"
                {...register('dealer_source')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">VIN (Partial - 차대번호 일부)</label>
              <input
                type="text"
                {...register('vin_partial')}
                placeholder="e.g. KMHDK41D1LU******"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Engine Number (Partial)</label>
              <input
                type="text"
                {...register('engine_number_partial')}
                placeholder="e.g. G4FL-123***"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">HS Code (관세율표 번호)</label>
              <input
                type="text"
                {...register('hs_code')}
                placeholder="e.g. 8703.22.9000"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">FOB Export Port (수출 항구)</label>
              <input
                type="text"
                {...register('fob_port')}
                placeholder="e.g. Incheon Port / Busan Port"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vehicle Yard Location</label>
              <input
                type="text"
                {...register('vehicle_location')}
                placeholder="e.g. Incheon Port Yard 3"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Export Certificate Status</label>
              <select
                {...register('export_certificate_status')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none text-white cursor-pointer"
              >
                <option value="pending">Pending (말소 예정)</option>
                <option value="completed">Completed (말소 완료)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Inspection Report URL</label>
              <input
                type="text"
                {...register('inspection_report_url')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center space-x-2 text-sm text-slate-300 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={watchPhotoVerified}
                  onChange={(e) => setValue('photo_verified', e.target.checked)}
                  className="h-4 w-4 bg-slate-950 border border-slate-800 rounded text-accent focus:ring-accent"
                />
                <span>Photo Verified (실물 촬영 검증됨)</span>
              </label>
            </div>
          </div>
        </div>

        {/* 3. 스펙 및 상세 특징 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow space-y-4">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2 mb-4">Specs & Detail Features</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Engine Disp. (cc)</label>
              <input
                type="text"
                {...register('engine_displacement')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Drive Type</label>
              <input
                type="text"
                {...register('drive_type')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Exterior Color</label>
              <input
                type="text"
                {...register('color')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Accidents</label>
              <input
                type="text"
                {...register('accident_history')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Key Options (Comma Separated)</label>
            <input
              type="text"
              {...register('options')}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
            <textarea
              rows={4}
              {...register('description')}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-accent hover:bg-amber-700 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition duration-200 disabled:bg-slate-800 disabled:cursor-not-allowed cursor-pointer text-sm"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Saving Modifications...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save & Update Vehicle</span>
            </>
          )}
        </button>

      </form>
    </div>
  )
}

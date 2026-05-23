'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Upload, RefreshCw, AlertCircle, CheckCircle, X } from 'lucide-react'
import Link from 'next/link'

// Zod 유효성 스키마 (수출 필드 12개 적용)
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

export default function NewCarPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 다중 이미지 파일 상태
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CarFormValues>({
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
      engine_displacement: '1598cc',
      drive_type: '2WD',
      color: 'White',
      accident_history: 'No accidents',
      seating_capacity: 5,
      description: '',
      options: 'Smart Key, Navigation, Leather Seats',
      stock_number: '',
      photo_verified: true,
      dealer_source: 'Incheon Yard',
      vin_partial: 'KMHDK41D1LU******',
      vehicle_location: 'Incheon Port Yard 3',
      fob_port: 'Incheon Port',
      steering_position: 'LHD',
      engine_number_partial: 'G4FL-123***',
      hs_code: '8703.22.9000',
      inspection_report_url: '',
      export_certificate_status: 'completed',
      status: 'available'
    }
  })

  const watchPhotoVerified = watch('photo_verified')

  // 이미지 선택 핸들러
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setImageFiles((prev) => [...prev, ...filesArray])
      
      const previewsArray = filesArray.map(file => URL.createObjectURL(file))
      setPreviews((prev) => [...prev, ...previewsArray])
    }
  }

  // 프리뷰 이미지 제거
  const handleRemovePreview = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  const onSubmit = async (values: CarFormValues) => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      // 1. cars 테이블 데이터 삽입
      const { data: carData, error: carError } = await supabase
        .from('cars')
        .insert({
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
          created_by: session?.user?.id || null,
          stock_number: values.stock_number,
          photo_verified: values.photo_verified,
          dealer_source: values.dealer_source
        })
        .select('id')
        .single()

      if (carError) throw carError
      const carId = carData.id

      // 2. car_specs 테이블 데이터 삽입
      const optionsArray = values.options ? values.options.split(',').map(s => s.trim()) : []
      const { error: specError } = await supabase
        .from('car_specs')
        .insert({
          car_id: carId,
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

      if (specError) throw specError

      // 3. 이미지 업로드
      if (imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i]
          const fileExt = file.name.split('.').pop()
          const fileName = `${carId}/${Date.now()}-${i}.${fileExt}`
          
          const { error: uploadError } = await supabase.storage
             .from('car-images')
             .upload(fileName, file)

          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
            .from('car-images')
            .getPublicUrl(fileName)

          const { error: imgError } = await supabase
            .from('car_images')
            .insert({
              car_id: carId,
              image_url: publicUrl,
              is_main: i === 0,
              sort_order: i
            })

          if (imgError) throw imgError
        }
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/cars')
        router.refresh()
      }, 2000)

    } catch (err: any) {
      console.error(err)
      setErrorMessage(err.message || 'Error occurred while registering vehicle.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 p-8 sm:p-10 rounded-2xl shadow-xl text-center py-16 animate-in zoom-in-95 duration-200">
        <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-white">Vehicle Registered!</h2>
        <p className="text-slate-400 text-sm mt-3 px-2 leading-relaxed">
          The vehicle and all export-specific specifications have been successfully saved. Redirecting to inventory...
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
          <h1 className="text-3xl font-black text-white tracking-tight">Register New Car</h1>
          <p className="text-slate-400 text-xs mt-0.5">Fill in detailed information and upload vehicle images.</p>
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
                placeholder="e.g. Hyundai"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
              {errors.brand && <p className="text-red-400 text-xs mt-1 font-semibold">{errors.brand.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Model</label>
              <input
                type="text"
                {...register('model')}
                placeholder="e.g. Avante"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
              {errors.model && <p className="text-red-400 text-xs mt-1 font-semibold">{errors.model.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Model Year</label>
              <input
                type="number"
                {...register('year', { valueAsNumber: true })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
              {errors.year && <p className="text-red-400 text-xs mt-1 font-semibold">{errors.year.message}</p>}
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
              {errors.mileage && <p className="text-red-400 text-xs mt-1 font-semibold">{errors.mileage.message}</p>}
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
              {errors.seating_capacity && <p className="text-red-400 text-xs mt-1 font-semibold">{errors.seating_capacity.message}</p>}
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
              {errors.price_usd && <p className="text-red-400 text-xs mt-1 font-semibold">{errors.price_usd.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Price KRW (Domestic)</label>
              <input
                type="number"
                {...register('price_krw', { valueAsNumber: true })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
              {errors.price_krw && <p className="text-red-400 text-xs mt-1 font-semibold">{errors.price_krw.message}</p>}
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
                placeholder="e.g. ST-HY-001"
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
                placeholder="e.g. Incheon Dealer A"
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
                placeholder="e.g. /temp/report1.pdf"
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
                placeholder="e.g. 1598cc"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Drive Type</label>
              <input
                type="text"
                {...register('drive_type')}
                placeholder="e.g. 2WD / 4WD"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Exterior Color</label>
              <input
                type="text"
                {...register('color')}
                placeholder="e.g. Polar White"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Accidents</label>
              <input
                type="text"
                {...register('accident_history')}
                placeholder="e.g. None / Clean"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Key Options (Comma Separated)</label>
            <input
              type="text"
              {...register('options')}
              placeholder="Navigation, Rear Camera, Sunroof, Heated Seats..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
            <textarea
              rows={4}
              {...register('description')}
              placeholder="Provide a detailed sales explanation for foreign buyers..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
            />
          </div>
        </div>

        {/* 4. 이미지 업로드 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow space-y-4">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2 mb-4">Vehicle Images Upload</h2>
          
          <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-8 text-center transition relative">
            <Upload className="h-10 w-10 text-slate-500 mx-auto mb-2" />
            <span className="text-sm font-semibold text-slate-300 block">Click or Drag images here to upload</span>
            <span className="text-xs text-slate-500 block mt-1">PNG, JPG, JPEG up to 5MB (Max 8 files)</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              {previews.map((preview, idx) => (
                <div key={idx} className="relative aspect-[16/10] bg-slate-950 rounded-xl overflow-hidden group border border-slate-800">
                  <img src={preview} alt="upload preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePreview(idx)}
                    className="absolute top-2 right-2 bg-slate-950/80 hover:bg-red-500 text-white rounded-full p-1.5 transition cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-2 left-2 bg-accent text-white text-[9px] font-black px-2 py-0.5 rounded shadow">
                      Main Photo
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-accent hover:bg-amber-700 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition duration-200 disabled:bg-slate-800 disabled:cursor-not-allowed cursor-pointer text-sm"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Registering Car & Uploading Images...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save & Publish Vehicle</span>
            </>
          )}
        </button>

      </form>
    </div>
  )
}

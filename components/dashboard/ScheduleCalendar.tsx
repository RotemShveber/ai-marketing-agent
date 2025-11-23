'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

const platformColors: Record<string, string> = {
  instagram: 'from-pink-500 to-purple-500',
  facebook: 'from-blue-500 to-blue-600',
  tiktok: 'from-slate-800 to-slate-900',
  linkedin: 'from-blue-600 to-blue-700',
  youtube: 'from-red-500 to-red-600',
  google_ads: 'from-green-500 to-yellow-500',
}

export default function ScheduleCalendar({ tenantId }: { tenantId: string }) {
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    fetchScheduledPosts()
  }, [tenantId, currentMonth])

  const fetchScheduledPosts = async () => {
    setLoading(true)
    try {
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

      const params = new URLSearchParams({
        tenantId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      const response = await fetch(`/api/schedule?${params}`)
      const data = await response.json()

      if (response.ok) {
        setScheduledPosts(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching scheduled posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const postsByDate = scheduledPosts.reduce((acc, post) => {
    const date = new Date(post.scheduled_at).toISOString().split('T')[0]
    if (!acc[date]) acc[date] = []
    acc[date].push(post)
    return acc
  }, {} as Record<string, any[]>)

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth)

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    setSelectedDate(null)
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    setSelectedDate(null)
  }

  const formatDate = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return date.toISOString().split('T')[0]
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    )
  }

  const selectedDatePosts = selectedDate ? postsByDate[selectedDate] || [] : []
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before first day of month */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = formatDate(day)
              const hasPosts = postsByDate[dateStr]?.length > 0
              const isSelected = selectedDate === dateStr

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all ${
                    isSelected
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg'
                      : isToday(day)
                      ? 'bg-indigo-50 text-indigo-600 font-semibold'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="text-sm">{day}</span>
                  {hasPosts && (
                    <div className={`w-1.5 h-1.5 rounded-full mt-1 ${
                      isSelected ? 'bg-white' : 'bg-indigo-500'
                    }`} />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected Date Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-slate-800">
            {selectedDate
              ? new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Select a date'}
          </h3>
        </div>

        {!selectedDate ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">Click on a date to view scheduled posts</p>
          </div>
        ) : selectedDatePosts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">No posts scheduled for this date</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDatePosts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${
                    platformColors[post.platform] || 'from-slate-500 to-slate-600'
                  } text-white`}>
                    {post.platform}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(post.scheduled_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {post.content_items && (
                  <p className="text-sm text-slate-600 line-clamp-3">
                    {post.content_items.text_content}
                  </p>
                )}
                <div className="mt-2">
                  <span className={`text-xs px-2 py-1 rounded-md ${
                    post.status === 'scheduled'
                      ? 'bg-blue-100 text-blue-700'
                      : post.status === 'published'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {post.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

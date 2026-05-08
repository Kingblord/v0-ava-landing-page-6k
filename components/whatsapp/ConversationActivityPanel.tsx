'use client'

import { formatDistanceToNow } from 'date-fns'
import { MessageCircle, Zap, RefreshCw, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'message' | 'ai_reply' | 'reconnect' | 'connected' | 'disconnected' | 'error'
  title: string
  description?: string
  timestamp: number
}

interface ConversationActivityPanelProps {
  activities: ActivityItem[]
  loading?: boolean
}

function getActivityIcon(type: ActivityItem['type']): React.ElementType {
  const icons: Record<ActivityItem['type'], React.ElementType> = {
    message: MessageCircle,
    ai_reply: Zap,
    reconnect: RefreshCw,
    connected: CheckCircle,
    disconnected: XCircle,
    error: AlertCircle,
  }
  return icons[type] || AlertCircle
}

function getActivityColor(type: ActivityItem['type']) {
  const colors: Record<ActivityItem['type'], string> = {
    message: 'text-blue-400',
    ai_reply: 'text-green-400',
    reconnect: 'text-yellow-400',
    connected: 'text-green-400',
    disconnected: 'text-red-400',
    error: 'text-red-400',
  }
  return colors[type]
}

function getActivityBg(type: ActivityItem['type']) {
  const bgs: Record<ActivityItem['type'], string> = {
    message: 'bg-blue-500/10',
    ai_reply: 'bg-green-500/10',
    reconnect: 'bg-yellow-500/10',
    connected: 'bg-green-500/10',
    disconnected: 'bg-red-500/10',
    error: 'bg-red-500/10',
  }
  return bgs[type]
}

export function ConversationActivityPanel({ activities, loading }: ConversationActivityPanelProps) {
  return (
    <div className="bg-[#111827] border border-[#6C5CE7]/15 rounded-2xl p-6">
      <h3 className="text-white font-semibold mb-4">Recent Activity</h3>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-[#6C5CE7]/20 border-t-[#6C5CE7] rounded-full animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[#8892a4] text-sm">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.type)
            const textColor = getActivityColor(activity.type)
            const bgColor = getActivityBg(activity.type)

            return (
              <div key={activity.id} className={`${bgColor} border border-[#6C5CE7]/10 rounded-lg p-3 flex gap-3`}>
                <Icon className={`w-4 h-4 ${textColor} mt-0.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{activity.title}</p>
                  {activity.description && (
                    <p className="text-[#8892a4] text-xs truncate">{activity.description}</p>
                  )}
                  <p className="text-[#6C5CE7]/60 text-xs mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

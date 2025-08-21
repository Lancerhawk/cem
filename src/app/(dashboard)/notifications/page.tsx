'use client'

import { useState, useEffect } from 'react'
import { BellIcon, CheckIcon, XIcon, UserPlusIcon } from 'lucide-react'
import { getPendingInvites } from '@/app/lib/actions/workflow_action'
import { WorkflowInvite } from '@/app/lib/types/workflow'

export default function NotificationsPage() {
  const [invites, setInvites] = useState<WorkflowInvite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)

  useEffect(() => {
    loadInvites()
  }, [])

  const loadInvites = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/workflows/pending-invites')
      const data = await response.json()
      
      if (data.success) {
        setInvites(data.invites)
        console.log('Loaded invites:', data.invites)
      } else {
        console.error('Failed to load invites:', data.message)
      }
    } catch (error) {
      console.error('Error loading invites:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInviteResponse = async (inviteId: string, response: 'Accepted' | 'Declined') => {
    try {
      setRespondingTo(inviteId)
      
      const apiResponse = await fetch('/api/workflows/respond-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteId, response }),
      })

      const result = await apiResponse.json()
      
      if (result.success) {
        // Remove the invite from the list
        setInvites(invites.filter(invite => invite._id !== inviteId))
      }
    } catch (error) {
      console.error('Error responding to invite:', error)
    } finally {
      setRespondingTo(null)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BellIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600">
                Stay updated with important alerts, updates, and workflow invitations.
              </p>
            </div>
          </div>
          <button
            onClick={loadInvites}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Notifications Content */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ) : invites.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="text-gray-500">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">
              You have no new notifications or pending workflow invitations.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {invites.map((invite) => (
            <div key={invite._id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              {/* Invite Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UserPlusIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Workflow Invitation
                    </h3>
                    <p className="text-sm text-gray-600">
                      You've been invited to join a workflow
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                  Pending
                </span>
              </div>

              {/* Invite Details */}
              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Workflow:</span>
                  <span className="text-sm text-gray-900">{invite.workflowName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Invited by:</span>
                  <span className="text-sm text-gray-900">
                    {invite.invitedByFirstName} {invite.invitedByLastName}
                  </span>
                  <span className="text-sm text-gray-500">({invite.invitedByEmail})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Invited:</span>
                  <span className="text-sm text-gray-500">{formatDate(invite.createdAt)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleInviteResponse(invite._id || '', 'Accepted')}
                  disabled={respondingTo === invite._id}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckIcon className="h-4 w-4" />
                  Accept Invite
                </button>
                <button
                  onClick={() => handleInviteResponse(invite._id || '', 'Declined')}
                  disabled={respondingTo === invite._id}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <XIcon className="h-4 w-4" />
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
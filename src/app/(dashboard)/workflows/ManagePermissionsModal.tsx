'use client'

import { useState, useEffect } from 'react'
import { XIcon, SaveIcon, TrashIcon } from 'lucide-react'

interface WorkflowMember {
  userId: string
  email: string
  firstName: string
  lastName: string
  role: string
  status: string
  permissions: {
    canCreateTasks: boolean
    canAssignTasks: boolean
    assignableMembers: string[]
  }
}

interface ManagePermissionsModalProps {
  isOpen: boolean
  onClose: () => void
  member: WorkflowMember | null
  workflowId: string
  allMembers: WorkflowMember[]
  onPermissionsUpdated: () => void
  onMemberRemoved: () => void
}

export default function ManagePermissionsModal({
  isOpen,
  onClose,
  member,
  workflowId,
  allMembers,
  onPermissionsUpdated,
  onMemberRemoved
}: ManagePermissionsModalProps) {
  const [permissions, setPermissions] = useState({
    canCreateTasks: false,
    canAssignTasks: false,
    assignableMembers: [] as string[]
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  useEffect(() => {
    if (member) {
      setPermissions({
        canCreateTasks: member.permissions?.canCreateTasks || false,
        canAssignTasks: member.permissions?.canAssignTasks || false,
        assignableMembers: member.permissions?.assignableMembers || []
      })
    }
  }, [member])

  const handlePermissionChange = (permission: keyof typeof permissions, value: boolean | string[]) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: value
    }))
  }

  const handleAssignableMemberToggle = (memberId: string) => {
    setPermissions(prev => ({
      ...prev,
      assignableMembers: prev.assignableMembers.includes(memberId)
        ? prev.assignableMembers.filter(id => id !== memberId)
        : [...prev.assignableMembers, memberId]
    }))
  }

  const handleUpdatePermissions = async () => {
    if (!member) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/workflows/${workflowId}/update-permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId: member.userId,
          permissions
        }),
      })

      const data = await response.json()

      if (data.success) {
        onPermissionsUpdated()
        onClose()
      } else {
        alert(`Failed to update permissions: ${data.message}`)
      }
    } catch (error) {
      console.error('Error updating permissions:', error)
      alert('An error occurred while updating permissions')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!member || !confirm(`Are you sure you want to remove ${member.firstName} ${member.lastName} from this workflow?`)) {
      return
    }

    setIsRemoving(true)
    try {
      const response = await fetch(`/api/workflows/${workflowId}/remove-member?memberId=${member.userId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        onMemberRemoved()
        onClose()
      } else {
        alert(`Failed to remove member: ${data.message}`)
      }
    } catch (error) {
      console.error('Error removing member:', error)
      alert('An error occurred while removing the member')
    } finally {
      setIsRemoving(false)
    }
  }

  if (!isOpen || !member) return null

  const otherMembers = allMembers.filter(m => m.userId !== member.userId)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Manage Permissions - {member.firstName} {member.lastName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <p className="text-gray-900">{member.firstName} {member.lastName}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <p className="text-gray-900">{member.email}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Role:</span>
                <p className="text-gray-900">{member.role}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <p className="text-gray-900">{member.status}</p>
              </div>
            </div>
          </div>

          {/* Task Creation Permission */}
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={permissions.canCreateTasks}
                onChange={(e) => handlePermissionChange('canCreateTasks', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Can create tasks in this workflow
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-7">
              When enabled, this member can create new tasks and assign them to other members
            </p>
          </div>

          {/* Task Assignment Permission */}
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={permissions.canAssignTasks}
                onChange={(e) => handlePermissionChange('canAssignTasks', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Can assign tasks to other members
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-7">
              When enabled, this member can assign tasks to other workflow members
            </p>
          </div>

          {/* Assignable Members - Only show if they CAN assign tasks */}
          {permissions.canAssignTasks && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">
                Allow assignment to specific members (optional):
              </h3>
              <p className="text-xs text-gray-500">
                Leave all unchecked to allow assignment to ANY member in the workflow. 
                Check specific members to allow assignment to only those people.
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-2 font-medium">Select members this person can assign tasks to:</p>
                {otherMembers.map((otherMember, index) => (
                  <label key={`${otherMember.userId}-${index}`} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={permissions.assignableMembers.includes(otherMember.userId)}
                      onChange={() => handleAssignableMemberToggle(otherMember.userId)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      {otherMember.firstName} {otherMember.lastName} ({otherMember.email})
                    </span>
                  </label>
                ))}
                {otherMembers.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No other members available</p>
                )}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  <strong>How it works:</strong><br/>
                  • <strong>All unchecked:</strong> Can assign tasks to ANY member in the workflow<br/>
                  • <strong>Some checked:</strong> Can ONLY assign tasks to the checked members<br/>
                  • <strong>All checked:</strong> Can assign tasks to ALL members (same as unchecked)<br/>
                  <br/>
                  <strong>Note:</strong> This setting only applies when "Can assign tasks to other members" is checked above.
                </p>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-red-700 mb-3">Danger Zone</h3>
            <button
              onClick={handleRemoveMember}
              disabled={isRemoving}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              {isRemoving ? 'Removing...' : 'Remove Member'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              This action cannot be undone. The member will lose access to this workflow.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdatePermissions}
            disabled={isUpdating}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SaveIcon className="h-4 w-4 mr-2" />
            {isUpdating ? 'Updating...' : 'Update Permissions'}
          </button>
        </div>
      </div>
    </div>
  )
}

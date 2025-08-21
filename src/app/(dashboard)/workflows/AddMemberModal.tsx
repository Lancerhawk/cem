'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { XIcon, SearchIcon, UserPlusIcon } from 'lucide-react'
import { UserWithoutPassword } from '@/app/lib/types/user'

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onMemberAdded: () => void
  workflowId: string
  existingMembers: string[] // Array of existing member emails
}

export default function AddMemberModal({ 
  isOpen, 
  onClose, 
  onMemberAdded, 
  workflowId, 
  existingMembers 
}: AddMemberModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserWithoutPassword[]>([])
  const [selectedMembers, setSelectedMembers] = useState<UserWithoutPassword[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const performSearch = useCallback(async () => {
    if (searchQuery.trim().length < 2) return
    
    try {
      setIsSearching(true)
      const response = await fetch(`/api/workflows/search-users?q=${encodeURIComponent(searchQuery.trim())}`)
      const data = await response.json()
      
      if (data.success) {
        // Filter out already selected members and existing workflow members
        const filteredResults = data.users.filter((user: UserWithoutPassword) => 
          !selectedMembers.some(member => member._id === user._id) &&
          !existingMembers.includes(user.email)
        )
        setSearchResults(filteredResults)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery, selectedMembers, existingMembers])

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      // Debounce search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        performSearch()
      }, 300)
    } else {
      setSearchResults([])
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, performSearch])

  const addMember = (user: UserWithoutPassword) => {
    if (!selectedMembers.some(member => member._id === user._id)) {
      setSelectedMembers([...selectedMembers, user])
      setSearchQuery('')
      setSearchResults([])
    }
  }

  const removeMember = (userId: string) => {
    setSelectedMembers(selectedMembers.filter(member => member._id !== userId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedMembers.length === 0) {
      setError('Please select at least one member to add')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const memberEmails = selectedMembers.map(member => member.email)

      const response = await fetch(`/api/workflows/${workflowId}/add-members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberEmails }),
      })

      const result = await response.json()

      if (result.success) {
        onMemberAdded()
        // Reset form
        setSelectedMembers([])
        setSearchQuery('')
        setSearchResults([])
        onClose()
      } else {
        setError(result.message || 'Failed to add members')
      }
    } catch (error) {
      console.error('Add members error:', error)
      setError('An error occurred while adding members')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Team Members</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Member Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search for Users
            </label>
            
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                placeholder="Search for users by name or email..."
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => addMember(user)}
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                      <UserPlusIcon className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Members */}
            {selectedMembers.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Selected Members:</div>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map((member) => (
                    <div
                      key={member._id}
                      className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      <span>{member.firstName} {member.lastName}</span>
                      <button
                        type="button"
                        onClick={() => removeMember(member._id || '')}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedMembers.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Adding...' : `Add ${selectedMembers.length} Member${selectedMembers.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

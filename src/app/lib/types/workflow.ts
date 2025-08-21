import { UserWithoutPassword } from './user'

export interface Workflow {
  _id?: string
  name: string
  description: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  status: 'Active' | 'Paused' | 'Completed' | 'Cancelled'
  createdBy: string // user ID
  members: WorkflowMember[]
  estimatedMembers: number
  createdAt: Date
  updatedAt: Date
}

export interface WorkflowMember {
  userId: string
  email: string
  firstName: string
  lastName: string
  role: 'Admin' | 'Member' | 'Viewer'
  status: 'Pending' | 'Accepted' | 'Declined'
  permissions: {
    canCreateTasks: boolean
    canAssignTasks: boolean
    assignableMembers: string[] // Array of member IDs they can assign tasks to
  }
  credits?: number
  joinedAt?: Date
}

export interface WorkflowInvite {
  _id?: string
  workflowId: string
  workflowName: string
  invitedBy: string // user ID
  invitedByEmail: string
  invitedByFirstName: string
  invitedByLastName: string
  invitedUser: string // user ID
  invitedUserEmail: string
  status: 'Pending' | 'Accepted' | 'Declined'
  createdAt: Date
  updatedAt: Date
}

export interface CreateWorkflowData {
  name: string
  description: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  estimatedMembers: number
  memberEmails: string[]
}

export interface WorkflowResponse {
  success: boolean
  message: string
  workflow?: Workflow
  workflows?: Workflow[]
  users?: UserWithoutPassword[]
  invites?: WorkflowInvite[]
  task?: any // For task creation responses
  tasks?: any[] // For task retrieval responses
  stats?: {
    totalTasks: number
    completedTasks: number
    pendingTasks: number
    overdueTasks: number
  }
}

export interface Task {
  _id?: string
  workflowId: string
  title: string
  description: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  dueDate?: Date
  assignedMembers: string[]
  status: 'Pending' | 'In Progress' | 'Completed' | 'Awaiting Confirmation' | 'Cancelled'
  createdBy: string
  createdAt: Date
  updatedAt: Date
  statusUpdates?: TaskStatusUpdate[]
  completionMessage?: string
  completedBy?: string
  completedAt?: Date
  confirmedBy?: string
  confirmedAt?: Date
  creditsAwarded?: boolean
  deletedBy?: string
  deletedAt?: Date
  isDeleted?: boolean
  feedbackForCompleter?: string
  feedbackFrom?: string
  feedbackAt?: Date
}

export interface TaskStatusUpdate {
  _id?: string
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled'
  message: string
  updatedBy: string
  updatedAt: Date
}

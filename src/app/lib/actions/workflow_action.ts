'use server'

import clientPromise from '../mongodb'
import { Workflow, WorkflowMember, WorkflowInvite, CreateWorkflowData, WorkflowResponse } from '../types/workflow'
import { UserWithoutPassword } from '../types/user'
import { getUserSession } from '../utils/session'
import { ObjectId } from 'mongodb'

async function getCollections() {
  const client = await clientPromise
  const db = client.db('cem_app')
  
  return {
    workflows: db.collection<Workflow>('workflows'),
    workflowInvites: db.collection<WorkflowInvite>('workflowInvites'),
    users: db.collection<UserWithoutPassword>('users'),
    tasks: db.collection<any>('tasks')
  }
}

export async function createWorkflow(data: CreateWorkflowData): Promise<WorkflowResponse> {
  try {
    const session = await getUserSession()
    if (!session) {
      console.log('Create workflow: No session found')
      return {
        success: false,
        message: 'User not authenticated'
      }
    }

    console.log('Create workflow: Session found:', { userId: session._id, email: session.email })

    const { workflows, workflowInvites, users } = await getCollections()
    
    // Get current user details - convert string ID to ObjectId
    let currentUser = null
    try {
      const objectId = new ObjectId(session._id)
      currentUser = await users.findOne({ _id: objectId } as any)
    } catch (e) {
      console.log('Create workflow: Invalid ObjectId format:', session._id)
      return {
        success: false,
        message: 'Invalid user session'
      }
    }
    
    if (!currentUser) {
      console.log('Create workflow: Current user not found in database:', session._id)
      return {
        success: false,
        message: 'User not found'
      }
    }

    console.log('Create workflow: Current user found:', { 
      userId: currentUser._id, 
      email: currentUser.email,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName
    })

    // Create workflow
    const newWorkflow: Omit<Workflow, '_id'> = {
      name: data.name,
      description: data.description,
      priority: data.priority,
      status: 'Active',
      createdBy: session._id,
      estimatedMembers: data.estimatedMembers,
      members: [
        {
          userId: session._id,
          email: currentUser.email,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          role: 'Admin',
          status: 'Accepted',
          permissions: {
            canCreateTasks: true,
            canAssignTasks: true,
            assignableMembers: [] // Admin can assign to anyone
          },
          joinedAt: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Create workflow: About to insert workflow:', newWorkflow)

    const workflowResult = await workflows.insertOne(newWorkflow)
    if (!workflowResult.acknowledged) {
      console.log('Create workflow: Failed to insert workflow')
      return {
        success: false,
        message: 'Failed to create workflow'
      }
    }

    console.log('Create workflow: Workflow inserted successfully:', workflowResult.insertedId)

    const createdWorkflow = await workflows.findOne({ _id: workflowResult.insertedId })
    if (!createdWorkflow) {
      console.log('Create workflow: Failed to retrieve created workflow')
      return {
        success: false,
        message: 'Failed to retrieve created workflow'
      }
    }

    // Send invites to selected members (excluding the creator)
    console.log('Create workflow: Processing member emails:', data.memberEmails)
    let invitesCreated = 0
    for (const email of data.memberEmails) {
      if (email === currentUser.email) {
        console.log('Create workflow: Skipping creator email:', email)
        continue // Skip creator
      }

      console.log('Create workflow: Looking up user by email:', email)
      const invitedUser = await users.findOne({ email })
      if (invitedUser) {
        console.log('Create workflow: Found invited user:', { 
          userId: invitedUser._id, 
          email: invitedUser.email,
          firstName: invitedUser.firstName,
          lastName: invitedUser.lastName
        })
        
        const invite: Omit<WorkflowInvite, '_id'> = {
          workflowId: workflowResult.insertedId.toString(),
          workflowName: data.name,
          invitedBy: session._id,
          invitedByEmail: currentUser.email,
          invitedByFirstName: currentUser.firstName,
          invitedByLastName: currentUser.lastName,
          invitedUser: invitedUser._id?.toString() || '', // Convert ObjectId to string
          invitedUserEmail: email,
          status: 'Pending',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        console.log('Create workflow: About to create invite:', invite)
        const inviteResult = await workflowInvites.insertOne(invite)
        if (inviteResult.acknowledged) {
          invitesCreated++
          console.log('Create workflow: Invite created successfully for:', email, 'Invite ID:', inviteResult.insertedId)
        } else {
          console.log('Create workflow: Failed to create invite for:', email)
        }
      } else {
        console.log('Create workflow: User not found for email:', email)
      }
    }
    
    console.log('Create workflow: Total invites created:', invitesCreated)

    // Convert ObjectId to string for client-side compatibility
    const serializedWorkflow = {
      ...createdWorkflow,
      _id: createdWorkflow._id?.toString(),
      createdAt: createdWorkflow.createdAt?.toISOString(),
      updatedAt: createdWorkflow.updatedAt?.toISOString()
    } as any

    return {
      success: true,
      message: 'Workflow created successfully',
      workflow: serializedWorkflow
    }
  } catch (error) {
    console.error('Create workflow error:', error)
    return {
      success: false,
      message: 'An error occurred while creating the workflow'
    }
  }
}

export async function getUserWorkflows(): Promise<Workflow[]> {
  try {
    const session = await getUserSession()
    if (!session) return []

    const { workflows } = await getCollections()
    
    // Convert string ID to ObjectId for database query
    let sessionObjectId: ObjectId
    try {
      sessionObjectId = new ObjectId(session._id)
    } catch (e) {
      console.log('Get user workflows: Invalid session ObjectId:', session._id)
      return []
    }
    
    const userWorkflows = await workflows.find({
      $or: [
        { createdBy: session._id },
        { 'members.userId': session._id }
      ]
    }).toArray()

    // Convert ObjectIds to strings for client-side compatibility
    const serializedWorkflows = userWorkflows.map(workflow => ({
      ...workflow,
      _id: workflow._id?.toString(),
      createdAt: workflow.createdAt?.toISOString(),
      updatedAt: workflow.updatedAt?.toISOString()
    })) as any

    return serializedWorkflows
  } catch (error) {
    console.error('Get user workflows error:', error)
    return []
  }
}

export async function searchUsers(query: string): Promise<UserWithoutPassword[]> {
  try {
    const session = await getUserSession()
    if (!session) return []

    const { users } = await getCollections()
    
    // Convert session ID to ObjectId for proper comparison
    let sessionObjectId: ObjectId
    try {
      sessionObjectId = new ObjectId(session._id)
    } catch (e) {
      console.log('Search users: Invalid session ObjectId:', session._id)
      return []
    }
    
    const searchQuery = {
      $and: [
        {
          $or: [
            { firstName: { $regex: query, $options: 'i' } },
            { lastName: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        },
        { _id: { $ne: sessionObjectId } } // Exclude current user using ObjectId
      ]
    } as any

    console.log('Search users query:', searchQuery)
    const searchResults = await users.find(searchQuery).limit(10).toArray()
    console.log('Search users results count:', searchResults.length)
    
    // Convert ObjectIds to strings for client-side compatibility
    const serializedResults = searchResults.map(user => ({
      ...user,
      _id: user._id?.toString()
    }))
    
    return serializedResults
  } catch (error) {
    console.error('Search users error:', error)
    return []
  }
}

export async function respondToWorkflowInvite(inviteId: string, response: 'Accepted' | 'Declined'): Promise<WorkflowResponse> {
  try {
    const session = await getUserSession()
    if (!session) {
      console.log('Respond to invite: No session found')
      return {
        success: false,
        message: 'User not authenticated'
      }
    }

    console.log('Respond to invite: Session found:', { userId: session._id, email: session.email })
    console.log('Respond to invite: Processing invite:', { inviteId, response })

    const { workflowInvites, workflows, users } = await getCollections()
    
    // Convert inviteId to ObjectId for database query
    let inviteObjectId: ObjectId
    try {
      inviteObjectId = new ObjectId(inviteId)
    } catch (e) {
      console.log('Respond to invite: Invalid inviteId ObjectId format:', inviteId)
      return {
        success: false,
        message: 'Invalid invite ID format'
      }
    }
    
    // Update invite status
    console.log('Respond to invite: Updating invite with ObjectId:', inviteObjectId)
    const inviteResult = await workflowInvites.updateOne(
      { _id: inviteObjectId, invitedUser: session._id } as any,
      { 
        $set: { 
          status: response,
          updatedAt: new Date()
        }
      }
    )

    console.log('Respond to invite: Update result:', inviteResult)

    if (inviteResult.modifiedCount === 0) {
      console.log('Respond to invite: No invite found or already responded')
      return {
        success: false,
        message: 'Invite not found or already responded'
      }
    }

    if (response === 'Accepted') {
      // Get invite details
      const invite = await workflowInvites.findOne({ _id: inviteObjectId } as any)
      if (!invite) {
        console.log('Respond to invite: Invite not found after update')
        return {
          success: false,
          message: 'Invite not found'
        }
      }

      console.log('Respond to invite: Found invite:', invite)

      // Get user details - convert string ID to ObjectId
      let user = null
      try {
        const objectId = new ObjectId(session._id)
        user = await users.findOne({ _id: objectId } as any)
      } catch (e) {
        console.log('Respond to invite: Invalid ObjectId format:', session._id)
        return {
          success: false,
          message: 'Invalid user session'
        }
      }
      
      if (!user) {
        console.log('Respond to invite: User not found')
        return {
          success: false,
          message: 'User not found'
        }
      }

      console.log('Respond to invite: Found user:', { userId: user._id, email: user.email })

      // Convert workflowId to ObjectId for database query
      let workflowObjectId: ObjectId
      try {
        workflowObjectId = new ObjectId(invite.workflowId)
      } catch (e) {
        console.log('Respond to invite: Invalid workflowId ObjectId format:', invite.workflowId)
        return {
          success: false,
          message: 'Invalid workflow ID format'
        }
      }

      // Add user to workflow
      console.log('Respond to invite: Adding user to workflow:', workflowObjectId)
      const workflowResult = await workflows.updateOne(
        { _id: workflowObjectId } as any,
        {
          $push: {
            members: {
              userId: session._id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: 'Member',
              status: 'Accepted',
              permissions: {
                canCreateTasks: false, // Default: no task creation permission
                canAssignTasks: false, // Default: no task assignment permission
                assignableMembers: [] // Default: can't assign to anyone
              },
              joinedAt: new Date()
            }
          },
          $set: { updatedAt: new Date() }
        }
      )

      console.log('Respond to invite: Workflow update result:', workflowResult)

      if (!workflowResult.acknowledged) {
        return {
          success: false,
          message: 'Failed to add user to workflow'
        }
      }
    }

    console.log('Respond to invite: Successfully processed response:', response)
    return {
      success: true,
      message: `Invite ${response.toLowerCase()} successfully`
    }
  } catch (error) {
    console.error('Respond to workflow invite error:', error)
    return {
      success: false,
      message: 'An error occurred while responding to the invite'
    }
  }
}

export async function getPendingInvites(): Promise<WorkflowInvite[]> {
  try {
    const session = await getUserSession()
    if (!session) return []

    const { workflowInvites } = await getCollections()
    
    // Convert string ID to ObjectId for database query
    let sessionObjectId: ObjectId
    try {
      sessionObjectId = new ObjectId(session._id)
    } catch (e) {
      console.log('Get pending invites: Invalid session ObjectId:', session._id)
      return []
    }
    
    console.log('Get pending invites: Looking for invites for user:', session._id, 'ObjectId:', sessionObjectId)
    
    const pendingInvites = await workflowInvites.find({
      invitedUser: session._id, // This should work since we store string IDs in invites
      status: 'Pending'
    }).toArray()

    console.log('Get pending invites: Found raw invites:', pendingInvites.length)
    console.log('Get pending invites: Raw invites:', pendingInvites)

    // Convert ObjectIds to strings for client-side compatibility
    const serializedInvites = pendingInvites.map(invite => ({
      ...invite,
      _id: invite._id?.toString(),
      createdAt: invite.createdAt?.toISOString(),
      updatedAt: invite.updatedAt?.toISOString()
    })) as any

    console.log('Get pending invites: Returning serialized invites:', serializedInvites.length)
    return serializedInvites
  } catch (error) {
    console.error('Get pending invites error:', error)
    return []
  }
}

export async function deleteWorkflow(workflowId: string): Promise<WorkflowResponse> {
  try {
    const session = await getUserSession()
    if (!session) {
      console.log('Delete workflow: No session found')
      return {
        success: false,
        message: 'User not authenticated'
      }
    }

    console.log('Delete workflow: Session found:', { userId: session._id, email: session.email })
    console.log('Delete workflow: Processing workflow:', workflowId)

    const { workflows, workflowInvites } = await getCollections()
    
    // Convert workflowId to ObjectId for database query
    let workflowObjectId: ObjectId
    try {
      workflowObjectId = new ObjectId(workflowId)
    } catch (e) {
      console.log('Delete workflow: Invalid workflowId ObjectId format:', workflowId)
      return {
        success: false,
        message: 'Invalid workflow ID format'
      }
    }

    // Check if user is the creator of the workflow
    const workflow = await workflows.findOne({ _id: workflowObjectId } as any)
    if (!workflow) {
      console.log('Delete workflow: Workflow not found')
      return {
        success: false,
        message: 'Workflow not found'
      }
    }

    if (workflow.createdBy !== session._id) {
      console.log('Delete workflow: User not authorized to delete this workflow')
      return {
        success: false,
        message: 'You are not authorized to delete this workflow'
      }
    }

    console.log('Delete workflow: User authorized, proceeding with deletion')

    // Delete the workflow
    const workflowResult = await workflows.deleteOne({ _id: workflowObjectId } as any)
    if (!workflowResult.acknowledged) {
      console.log('Delete workflow: Failed to delete workflow')
      return {
        success: false,
        message: 'Failed to delete workflow'
      }
    }

    // Delete all related invites
    const invitesResult = await workflowInvites.deleteMany({ workflowId: workflowId })
    console.log('Delete workflow: Deleted invites:', invitesResult.deletedCount)

    console.log('Delete workflow: Successfully deleted workflow and related invites')
    return {
      success: true,
      message: 'Workflow deleted successfully'
    }
  } catch (error) {
    console.error('Delete workflow error:', error)
    return {
      success: false,
      message: 'An error occurred while deleting the workflow'
    }
  }
}

export async function getWorkflowById(workflowId: string): Promise<WorkflowResponse> {
  try {
    const session = await getUserSession()
    if (!session) {
      console.log('Get workflow by ID: No session found')
      return {
        success: false,
        message: 'User not authenticated'
      }
    }

    console.log('Get workflow by ID: Session found:', { userId: session._id, email: session.email })
    console.log('Get workflow by ID: Processing workflow:', workflowId)

    const { workflows } = await getCollections()
    
    // Convert workflowId to ObjectId for database query
    let workflowObjectId: ObjectId
    try {
      workflowObjectId = new ObjectId(workflowId)
    } catch (e) {
      console.log('Get workflow by ID: Invalid workflowId ObjectId format:', workflowId)
      return {
        success: false,
        message: 'Invalid workflow ID format'
      }
    }

    // Find the workflow
    const workflow = await workflows.findOne({ _id: workflowObjectId } as any)
    if (!workflow) {
      console.log('Get workflow by ID: Workflow not found')
      return {
        success: false,
        message: 'Workflow not found'
      }
    }

    // Check if user has access to this workflow (creator or member)
    const hasAccess = workflow.createdBy === session._id || 
                     workflow.members.some((member: any) => member.userId === session._id)
    
    if (!hasAccess) {
      console.log('Get workflow by ID: User not authorized to access this workflow')
      return {
        success: false,
        message: 'You do not have access to this workflow'
      }
    }

    console.log('Get workflow by ID: User authorized, returning workflow')

    // Convert ObjectIds to strings for client-side compatibility
    const serializedWorkflow = {
      ...workflow,
      _id: workflow._id?.toString(),
      createdAt: workflow.createdAt?.toISOString(),
      updatedAt: workflow.updatedAt?.toISOString()
    } as any

    return {
      success: true,
      message: 'Workflow retrieved successfully',
      workflow: serializedWorkflow
    }
  } catch (error) {
    console.error('Get workflow by ID error:', error)
    return {
      success: false,
      message: 'An error occurred while retrieving the workflow'
    }
  }
}

export async function addMembersToWorkflow(workflowId: string, memberEmails: string[]): Promise<WorkflowResponse> {
  try {
    const session = await getUserSession()
    if (!session) {
      console.log('Add members to workflow: No session found')
      return {
        success: false,
        message: 'User not authenticated'
      }
    }

    console.log('Add members to workflow: Session found:', { userId: session._id, email: session.email })
    console.log('Add members to workflow: Processing workflow:', workflowId, 'Emails:', memberEmails)

    const { workflows, workflowInvites, users } = await getCollections()
    
    // Convert workflowId to ObjectId for database query
    let workflowObjectId: ObjectId
    try {
      workflowObjectId = new ObjectId(workflowId)
    } catch (e) {
      console.log('Add members to workflow: Invalid workflowId ObjectId format:', workflowId)
      return {
        success: false,
        message: 'Invalid workflow ID format'
      }
    }

    // Check if user is the creator of the workflow
    const workflow = await workflows.findOne({ _id: workflowObjectId } as any)
    if (!workflow) {
      console.log('Add members to workflow: Workflow not found')
      return {
        success: false,
        message: 'Workflow not found'
      }
    }

    if (workflow.createdBy !== session._id) {
      console.log('Add members to workflow: User not authorized to add members')
      return {
        success: false,
        message: 'You are not authorized to add members to this workflow'
      }
    }

    console.log('Add members to workflow: User authorized, proceeding with member addition')

    // Get current user details for invite creation
    const currentUser = await users.findOne({ _id: new ObjectId(session._id) } as any)
    if (!currentUser) {
      console.log('Add members to workflow: Current user not found')
      return {
        success: false,
        message: 'Current user not found'
      }
    }

    // Add creator as admin member
    const creatorMember: WorkflowMember = {
      userId: currentUser._id?.toString() || '',
      email: currentUser.email,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      role: 'Admin',
      status: 'Accepted',
      permissions: {
        canCreateTasks: true,
        canAssignTasks: true,
        assignableMembers: [] // Admin can assign to anyone
      },
      joinedAt: new Date()
    }

    // Process each member email
    let invitesCreated = 0
    for (const email of memberEmails) {
      // Skip if already a member
      if (workflow.members.some((member: any) => member.email === email)) {
        console.log('Add members to workflow: User already a member:', email)
        continue
      }

      console.log('Add members to workflow: Looking up user by email:', email)
      const invitedUser = await users.findOne({ email })
      if (invitedUser) {
        console.log('Add members to workflow: Found invited user:', { 
          userId: invitedUser._id, 
          email: invitedUser.email,
          firstName: invitedUser.firstName,
          lastName: invitedUser.lastName
        })
        
        const invite = {
          workflowId: workflowId,
          workflowName: workflow.name,
          invitedBy: session._id,
          invitedByEmail: currentUser.email,
          invitedByFirstName: currentUser.firstName,
          invitedByLastName: currentUser.lastName,
          invitedUser: invitedUser._id?.toString() || '',
          invitedUserEmail: email,
          status: 'Pending' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        console.log('Add members to workflow: About to create invite:', invite)
        const inviteResult = await workflowInvites.insertOne(invite)
        if (inviteResult.acknowledged) {
          invitesCreated++
          console.log('Add members to workflow: Invite created successfully for:', email, 'Invite ID:', inviteResult.insertedId)
        } else {
          console.log('Add members to workflow: Failed to create invite for:', email)
        }
      } else {
        console.log('Add members to workflow: User not found for email:', email)
      }
    }
    
    console.log('Add members to workflow: Total invites created:', invitesCreated)

    return {
      success: true,
      message: `Successfully sent ${invitesCreated} invitation(s)`
    }
  } catch (error) {
    console.error('Add members to workflow error:', error)
    return {
      success: false,
      message: 'An error occurred while adding members to the workflow'
    }
  }
}

export async function createWorkflowTask(workflowId: string, taskData: {
  title: string
  description: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  dueDate?: Date
  assignedMembers: string[]
}): Promise<WorkflowResponse> {
  try {
    const session = await getUserSession()
    if (!session) {
      console.log('Create task: No session found')
      return {
        success: false,
        message: 'User not authenticated'
      }
    }

    console.log('Create task: Session found:', { userId: session._id, email: session.email })
    console.log('Create task: Processing workflow:', workflowId, 'task data:', taskData)

    const { workflows, tasks, users } = await getCollections()

    // Convert workflowId to ObjectId for database query
    let workflowObjectId: ObjectId
    try {
      workflowObjectId = new ObjectId(workflowId)
    } catch (e) {
      console.log('Create task: Invalid workflowId ObjectId format:', workflowId)
      return {
        success: false,
        message: 'Invalid workflow ID format'
      }
    }

    // Check if user has access to this workflow and can create tasks
    const workflow = await workflows.findOne({ _id: workflowObjectId } as any)
    if (!workflow) {
      console.log('Create task: Workflow not found')
      return {
        success: false,
        message: 'Workflow not found'
      }
    }

    // Find the current user's member record
    const currentMember = workflow.members.find((member: any) => member.userId === session._id)
    if (!currentMember) {
      console.log('Create task: User not a member of this workflow')
      return {
        success: false,
        message: 'You are not a member of this workflow'
      }
    }

    // Check if user can create tasks (creator always can)
    if (!currentMember.permissions?.canCreateTasks && workflow.createdBy !== session._id) {
      return {
        success: false,
        message: 'You do not have permission to create tasks in this workflow'
      }
    }

    // For task assignment, allow if:
    // 1. User is the workflow creator (admin)
    // 2. User has canAssignTasks permission
    // 3. User is the task creator (can always assign their own tasks)
    const canAssignTasks = workflow.createdBy === session._id || 
                          currentMember.permissions?.canAssignTasks === true

    if (!canAssignTasks) {
      return {
        success: false,
        message: 'You do not have permission to assign tasks in this workflow'
      }
    }

    // If user has specific member restrictions, check assignable members
    // But skip this check for admins
    if (currentMember.permissions?.assignableMembers &&
        currentMember.permissions.assignableMembers.length > 0 &&
        workflow.createdBy !== session._id) {
      const canAssignToAll = taskData.assignedMembers.every(memberId =>
        currentMember.permissions.assignableMembers.includes(memberId)
      )
      if (!canAssignToAll) {
        return {
          success: false,
          message: 'You can only assign tasks to specific members in this workflow'
        }
      }
    }
    // If assignableMembers is empty array, user can assign to anyone (no restrictions)

    // Validate that all assigned members are actually workflow members
    const workflowMemberIds = workflow.members.map((member: any) => member.userId)
    const invalidAssignments = taskData.assignedMembers.filter(memberId => 
      !workflowMemberIds.includes(memberId)
    )
    
    if (invalidAssignments.length > 0) {
      console.log('Create task: Invalid member assignments:', invalidAssignments)
      return {
        success: false,
        message: 'Some assigned members are not part of this workflow'
      }
    }

    // Create the task
    const newTask = {
      workflowId: workflowId,
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      dueDate: taskData.dueDate,
      assignedMembers: taskData.assignedMembers,
      status: 'Pending',
      createdBy: session._id,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Create task: About to insert task:', newTask)

    const taskResult = await tasks.insertOne(newTask)
    if (!taskResult.acknowledged) {
      console.log('Create task: Failed to insert task')
      return {
        success: false,
        message: 'Failed to create task'
      }
    }

    console.log('Create task: Task created successfully:', taskResult.insertedId)

    // Get the created task with enriched data
    const createdTask = await tasks.findOne({ _id: taskResult.insertedId })
    if (!createdTask) {
      console.log('Create task: Failed to retrieve created task')
      return {
        success: false,
        message: 'Task created but failed to retrieve'
      }
    }

    // Serialize the task for client-side compatibility
    const serializedTask = {
      ...createdTask,
      _id: createdTask._id?.toString(),
      createdAt: createdTask.createdAt?.toISOString(),
      updatedAt: createdTask.updatedAt?.toISOString(),
      dueDate: createdTask.dueDate ? (createdTask.dueDate instanceof Date ? createdTask.dueDate.toISOString() : createdTask.dueDate) : undefined
    }

    return {
      success: true,
      message: 'Task created successfully',
      task: serializedTask
    }
  } catch (error) {
    console.error('Create task error:', error)
    return {
      success: false,
      message: 'An error occurred while creating the task'
    }
  }
}

export async function getWorkflowStats(workflowId: string): Promise<WorkflowResponse> {
  try {
    const session = await getUserSession()
    if (!session) {
      console.log('Get workflow stats: No session found')
      return {
        success: false,
        message: 'User not authenticated'
      }
    }

    console.log('Get workflow stats: Session found:', { userId: session._id, email: session.email })
    console.log('Get workflow stats: Processing workflow:', workflowId)

    const { workflows, tasks } = await getCollections()
    
    // Convert workflowId to ObjectId for database query
    let workflowObjectId: ObjectId
    try {
      workflowObjectId = new ObjectId(workflowId)
    } catch (e) {
      console.log('Get workflow stats: Invalid workflowId ObjectId format:', workflowId)
      return {
        success: false,
        message: 'Invalid workflow ID format'
      }
    }

    // Check if user has access to this workflow (creator or member)
    const workflow = await workflows.findOne({ _id: workflowObjectId } as any)
    if (!workflow) {
      console.log('Get workflow stats: Workflow not found')
      return {
        success: false,
        message: 'Workflow not found'
      }
    }

    const hasAccess = workflow.createdBy === session._id || 
                     workflow.members.some((member: any) => member.userId === session._id)
    
    if (!hasAccess) {
      console.log('Get workflow stats: User not authorized to access this workflow')
      return {
        success: false,
        message: 'You do not have access to this workflow'
      }
    }

    console.log('Get workflow stats: User authorized, calculating statistics')

    // Get all tasks for this workflow (excluding deleted ones)
    const workflowTasks = await tasks.find({ 
      workflowId: workflowId,
      isDeleted: { $ne: true }
    }).toArray()
    
    // Calculate statistics
    const totalTasks = workflowTasks.length
    const completedTasks = workflowTasks.filter((task: any) => task.status === 'Completed').length
    const pendingTasks = workflowTasks.filter((task: any) => task.status === 'Pending').length
    
    // Calculate overdue tasks (due date is in the past and status is not completed)
    const now = new Date()
    const overdueTasks = workflowTasks.filter((task: any) => {
      if (task.status === 'Completed' || !task.dueDate) return false
      return new Date(task.dueDate) < now
    }).length

    const stats = {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks
    }

    console.log('Get workflow stats: Calculated stats:', stats)

    return {
      success: true,
      message: 'Workflow statistics retrieved successfully',
      stats
    }
  } catch (error) {
    console.error('Get workflow stats error:', error)
    return {
      success: false,
      message: 'An error occurred while retrieving workflow statistics'
    }
  }
}

export async function getWorkflowTasks(workflowId: string): Promise<WorkflowResponse> {
  try {
    const session = await getUserSession()
    if (!session) {
      console.log('Get workflow tasks: No session found')
      return {
        success: false,
        message: 'User not authenticated'
      }
    }

    console.log('Get workflow tasks: Session found:', { userId: session._id, email: session.email })
    console.log('Get workflow tasks: Processing workflow:', workflowId)

    const { workflows, tasks, users } = await getCollections()
    
    // Convert workflowId to ObjectId for database query
    let workflowObjectId: ObjectId
    try {
      workflowObjectId = new ObjectId(workflowId)
    } catch (e) {
      console.log('Get workflow tasks: Invalid workflowId ObjectId format:', workflowId)
      return {
        success: false,
        message: 'Invalid workflow ID format'
      }
    }

    // Check if user has access to this workflow (creator or member)
    const workflow = await workflows.findOne({ _id: workflowObjectId } as any)
    if (!workflow) {
      console.log('Get workflow tasks: Workflow not found')
      return {
        success: false,
        message: 'Workflow not found'
      }
    }

    const hasAccess = workflow.createdBy === session._id || 
                     workflow.members.some((member: any) => member.userId === session._id)
    
    if (!hasAccess) {
      console.log('Get workflow tasks: User not authorized to access this workflow')
      return {
        success: false,
        message: 'You do not have access to this workflow'
      }
    }

    console.log('Get workflow tasks: User authorized, retrieving tasks')

    // Get all tasks for this workflow
    const workflowTasks = await tasks.find({ 
      workflowId: workflowId,
      isDeleted: { $ne: true } // Filter out deleted tasks
    }).toArray()
    
    // Get user details for assigned members
    const enrichedTasks = await Promise.all(
      workflowTasks.map(async (task: any) => {
        // Get creator details
        let creator = null
        try {
          const creatorObjectId = new ObjectId(task.createdBy)
          creator = await users.findOne({ _id: creatorObjectId } as any)
        } catch (e) {
          console.log('Get workflow tasks: Invalid creator ObjectId:', task.createdBy)
        }

        // Get assigned member details
        const assignedMembers = await Promise.all(
          (task.assignedMembers || []).map(async (memberId: string) => {
            try {
              const memberObjectId = new ObjectId(memberId)
              const member = await users.findOne({ _id: memberObjectId } as any)
              return member ? {
                userId: member._id?.toString(),
                firstName: member.firstName,
                lastName: member.lastName,
                email: member.email
              } : null
            } catch (e) {
              console.log('Get workflow tasks: Invalid member ObjectId:', memberId)
              return null
            }
          })
        )

        // Filter out null members
        const validAssignedMembers = assignedMembers.filter(member => member !== null)

        return {
          ...task,
          _id: task._id?.toString(),
          createdAt: task.createdAt instanceof Date ? task.createdAt.toISOString() : task.createdAt,
          updatedAt: task.updatedAt instanceof Date ? task.updatedAt.toISOString() : task.updatedAt,
          dueDate: task.dueDate ? (task.dueDate instanceof Date ? task.dueDate.toISOString() : task.dueDate) : undefined,
          createdBy: task.createdBy,
          creator: creator ? {
            userId: creator._id?.toString(),
            firstName: creator.firstName,
            lastName: creator.lastName,
            email: creator.email
          } : null,
          assignedMembers: validAssignedMembers
        }
      })
    )

    console.log('Get workflow tasks: Retrieved and enriched tasks:', enrichedTasks.length)

    return {
      success: true,
      message: 'Workflow tasks retrieved successfully',
      tasks: enrichedTasks
    }
  } catch (error) {
    console.error('Get workflow tasks error:', error)
    return {
      success: false,
      message: 'An error occurred while retrieving workflow tasks'
    }
  }
}

export async function getCompletedWorkflowTasks(
  workflowId: string
): Promise<WorkflowResponse> {
  try {
    const session = await getUserSession()
    if (!session) {
      return { success: false, message: 'No session found' }
    }

    const { workflows, tasks } = await getCollections()
    let workflowObjectId: ObjectId
    
    try {
      workflowObjectId = new ObjectId(workflowId)
    } catch (e) {
      return { success: false, message: 'Invalid workflow ID format' }
    }

    const workflow = await workflows.findOne({ _id: workflowObjectId } as any)
    if (!workflow) {
      return { success: false, message: 'Workflow not found' }
    }

    // Check if user is a member of this workflow
    const currentMember = workflow.members.find((member: any) => member.userId === session._id)
    if (!currentMember) {
      return { success: false, message: 'You are not a member of this workflow' }
    }

    // Get all completed tasks for this workflow (excluding deleted ones)
    const completedTasks = await tasks.find({ 
      workflowId: workflowId,
      status: 'Completed',
      isDeleted: { $ne: true }
    }).toArray()

    // Serialize the tasks
    const serializedTasks = completedTasks.map((task: any) => ({
      ...task,
      _id: task._id.toString(),
      createdAt: task.createdAt instanceof Date ? task.createdAt.toISOString() : task.createdAt,
      updatedAt: task.updatedAt instanceof Date ? task.updatedAt.toISOString() : task.updatedAt,
      dueDate: task.dueDate instanceof Date ? task.dueDate.toISOString() : task.dueDate,
      completedAt: task.completedAt instanceof Date ? task.completedAt.toISOString() : task.completedAt,
      confirmedAt: task.confirmedAt instanceof Date ? task.confirmedAt.toISOString() : task.confirmedAt
    }))

    return { 
      success: true, 
      message: 'Completed tasks retrieved successfully',
      tasks: serializedTasks
    }
  } catch (error) {
    console.error('Get completed workflow tasks error:', error)
    return { success: false, message: 'An error occurred while retrieving completed tasks' }
  }
}

export async function removeMemberFromWorkflow(workflowId: string, memberId: string): Promise<WorkflowResponse> {
  try {
    const session = await getUserSession()
    if (!session) {
      console.log('Remove member: No session found')
      return {
        success: false,
        message: 'User not authenticated'
      }
    }

    console.log('Remove member: Session found:', { userId: session._id, email: session.email })
    console.log('Remove member: Processing workflow:', workflowId, 'member:', memberId)

    const { workflows, workflowInvites } = await getCollections()

    // Convert IDs to ObjectId for database queries
    let workflowObjectId: ObjectId
    let memberObjectId: ObjectId
    try {
      workflowObjectId = new ObjectId(workflowId)
      memberObjectId = new ObjectId(memberId)
    } catch (e) {
      console.log('Remove member: Invalid ObjectId format:', { workflowId, memberId })
      return {
        success: false,
        message: 'Invalid workflow or member ID format'
      }
    }

    // Check if user is the creator/admin of this workflow
    const workflow = await workflows.findOne({ _id: workflowObjectId } as any)
    if (!workflow) {
      console.log('Remove member: Workflow not found')
      return {
        success: false,
        message: 'Workflow not found'
      }
    }

    if (workflow.createdBy !== session._id) {
      console.log('Remove member: User not authorized to remove members')
      return {
        success: false,
        message: 'Only workflow creators can remove members'
      }
    }

    // Check if trying to remove the creator
    if (workflow.createdBy === memberId) {
      console.log('Remove member: Cannot remove workflow creator')
      return {
        success: false,
        message: 'Cannot remove the workflow creator'
      }
    }

    // Remove member from workflow
    const result = await workflows.updateOne(
      { _id: workflowObjectId } as any,
      { $pull: { members: { userId: memberId } } }
    )

    if (result.modifiedCount === 0) {
      console.log('Remove member: Member not found in workflow')
      return {
        success: false,
        message: 'Member not found in workflow'
      }
    }

    // Remove any pending invites for this member
    await workflowInvites.updateMany(
      { 
        workflowId: workflowId, 
        invitedUser: memberId,
        status: 'Pending'
      },
      { $set: { status: 'Declined' } }
    )

    console.log('Remove member: Member removed successfully')

    return {
      success: true,
      message: 'Member removed from workflow successfully'
    }
  } catch (error) {
    console.error('Remove member error:', error)
    return {
      success: false,
      message: 'An error occurred while removing the member'
    }
  }
}

export async function updateMemberPermissions(
  workflowId: string, 
  memberId: string, 
  permissions: {
    canCreateTasks: boolean
    canAssignTasks: boolean
    assignableMembers: string[]
  }
): Promise<WorkflowResponse> {
  try {
    const session = await getUserSession()
    if (!session) {
      console.log('Update permissions: No session found')
      return {
        success: false,
        message: 'User not authenticated'
      }
    }

    console.log('Update permissions: Session found:', { userId: session._id, email: session.email })
    console.log('Update permissions: Processing workflow:', workflowId, 'member:', memberId, 'permissions:', permissions)

    const { workflows } = await getCollections()

    // Convert IDs to ObjectId for database queries
    let workflowObjectId: ObjectId
    let memberObjectId: ObjectId
    try {
      workflowObjectId = new ObjectId(workflowId)
      memberObjectId = new ObjectId(memberId)
    } catch (e) {
      console.log('Update permissions: Invalid ObjectId format:', { workflowId, memberId })
      return {
        success: false,
        message: 'Invalid workflow or member ID format'
      }
    }

    // Check if user is the creator/admin of this workflow
    const workflow = await workflows.findOne({ _id: workflowObjectId } as any)
    if (!workflow) {
      console.log('Update permissions: Workflow not found')
      return {
        success: false,
        message: 'Workflow not found'
      }
    }

    if (workflow.createdBy !== session._id) {
      console.log('Update permissions: User not authorized to update permissions')
      return {
        success: false,
        message: 'Only workflow creators can update member permissions'
      }
    }

    // Check if trying to update creator's permissions
    if (workflow.createdBy === memberId) {
      console.log('Update permissions: Cannot update creator permissions')
      return {
        success: false,
        message: 'Cannot update creator permissions'
      }
    }

    // Update member permissions
    const result = await workflows.updateOne(
      { 
        _id: workflowObjectId,
        'members.userId': memberId
      } as any,
      {
        $set: {
          'members.$.permissions': permissions,
          updatedAt: new Date()
        }
      }
    )

    if (result.modifiedCount === 0) {
      console.log('Update permissions: Member not found in workflow')
      return {
        success: false,
        message: 'Member not found in workflow'
      }
    }

    console.log('Update permissions: Member permissions updated successfully')

    return {
      success: true,
      message: 'Member permissions updated successfully'
    }
  } catch (error) {
    console.error('Update permissions error:', error)
    return {
      success: false,
      message: 'An error occurred while updating member permissions'
    }
  }
}

export async function updateWorkflowTask(
  workflowId: string,
  taskId: string,
  taskData: {
    title: string
    description: string
    priority: 'Low' | 'Medium' | 'High' | 'Critical'
    dueDate?: Date
    assignedMembers: string[]
  }
): Promise<WorkflowResponse> {
  try {
    const session = await getUserSession()
    if (!session) {
      return { success: false, message: 'No session found' }
    }

    const { workflows, tasks } = await getCollections()
    let workflowObjectId: ObjectId
    let taskObjectId: ObjectId
    
    try {
      workflowObjectId = new ObjectId(workflowId)
      taskObjectId = new ObjectId(taskId)
    } catch (e) {
      return { success: false, message: 'Invalid workflow or task ID format' }
    }

    const workflow = await workflows.findOne({ _id: workflowObjectId } as any)
    if (!workflow) {
      return { success: false, message: 'Workflow not found' }
    }

    const currentMember = workflow.members.find((member: any) => member.userId === session._id)
    if (!currentMember) {
      return { success: false, message: 'You are not a member of this workflow' }
    }

    const task = await tasks.findOne({ _id: taskObjectId } as any)
    if (!task) {
      return { success: false, message: 'Task not found' }
    }

    // Check if user can edit this task (admin or creator only)
    const canEdit = workflow.createdBy === session._id || 
                   task.createdBy === session._id

    if (!canEdit) {
      return { success: false, message: 'You do not have permission to edit this task' }
    }

    // Update the task
    const result = await tasks.updateOne(
      { _id: taskObjectId } as any,
      {
        $set: {
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
          assignedMembers: taskData.assignedMembers,
          updatedAt: new Date()
        }
      }
    )

    if (result.modifiedCount === 0) {
      return { success: false, message: 'Failed to update task' }
    }

    return { success: true, message: 'Task updated successfully' }
  } catch (error) {
    console.error('Update workflow task error:', error)
    return { success: false, message: 'An error occurred while updating the task' }
  }
}

export async function updateTaskStatus(
  workflowId: string,
  taskId: string,
  statusData: {
    status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled' | 'Awaiting Confirmation'
    message: string
  }
): Promise<WorkflowResponse> {
  try {
    const session = await getUserSession()
    if (!session) {
      return { success: false, message: 'No session found' }
    }

    const { workflows, tasks } = await getCollections()
    let workflowObjectId: ObjectId
    let taskObjectId: ObjectId
    
    try {
      workflowObjectId = new ObjectId(workflowId)
      taskObjectId = new ObjectId(taskId)
    } catch (e) {
      return { success: false, message: 'Invalid workflow or task ID format' }
    }

    const workflow = await workflows.findOne({ _id: workflowObjectId } as any)
    if (!workflow) {
      return { success: false, message: 'Workflow not found' }
    }

    const currentMember = workflow.members.find((member: any) => member.userId === session._id)
    if (!currentMember) {
      return { success: false, message: 'You are not a member of this workflow' }
    }

    const task = await tasks.findOne({ _id: taskObjectId } as any)
    if (!task) {
      return { success: false, message: 'Task not found' }
    }

    // Check if user is assigned to this task
    const isAssigned = task.assignedMembers.some((member: any) =>
      typeof member === 'string' ? member === session._id : member.userId === session._id
    )
    if (!isAssigned) {
      return { success: false, message: 'You are not assigned to this task' }
    }

    // Prevent assigned members from setting status to 'Completed' directly
    // They must go through 'Awaiting Confirmation' first
    const isAdmin = workflow.createdBy === session._id
    const isTaskCreator = task.createdBy === session._id
    
    if (statusData.status === 'Completed' && !isAdmin && !isTaskCreator) {
      return { 
        success: false, 
        message: 'Assigned members cannot mark tasks as completed directly. Please use "Awaiting Confirmation" status instead.' 
      }
    }

    // Create status update
    const statusUpdate = {
      _id: new ObjectId(),
      status: statusData.status,
      message: statusData.message,
      updatedBy: session._id,
      updatedAt: new Date()
    }

    // Update the task
    const updateData: any = {
      status: statusData.status,
      updatedAt: new Date()
    }

    // If status is completed, add completion details
    if (statusData.status === 'Completed') {
      updateData.completionMessage = statusData.message
      updateData.completedBy = session._id
      updateData.completedAt = new Date()
    }

    // If status is awaiting confirmation, add completion details
    if (statusData.status === 'Awaiting Confirmation') {
      updateData.completionMessage = statusData.message
      updateData.completedBy = session._id
      updateData.completedAt = new Date()
    }

    const result = await tasks.updateOne(
      { _id: taskObjectId } as any,
      { 
        $set: updateData,
        $push: { statusUpdates: statusUpdate } as any
      }
    )

    if (result.modifiedCount === 0) {
      return { success: false, message: 'Failed to update task status' }
    }

    return { success: true, message: 'Task status updated successfully' }
  } catch (error) {
    console.error('Update task status error:', error)
    return { success: false, message: 'An error occurred while updating the task status' }
  }
}

export async function confirmTaskCompletion(
  workflowId: string,
  taskId: string,
  confirmationData: { 
    awardCredits: boolean;
    feedback?: string; // Optional feedback for task completer
  }
): Promise<WorkflowResponse> {
  try {
    const session = await getUserSession()
    if (!session) {
      return { success: false, message: 'No session found' }
    }

    const { workflows, tasks } = await getCollections()
    let workflowObjectId: ObjectId
    let taskObjectId: ObjectId
    
    try {
      workflowObjectId = new ObjectId(workflowId)
      taskObjectId = new ObjectId(taskId)
    } catch (e) {
      return { success: false, message: 'Invalid workflow or task ID format' }
    }

    const workflow = await workflows.findOne({ _id: workflowObjectId } as any)
    if (!workflow) {
      return { success: false, message: 'Workflow not found' }
    }

    const currentMember = workflow.members.find((member: any) => member.userId === session._id)
    if (!currentMember) {
      return { success: false, message: 'You are not a member of this workflow' }
    }

    const task = await tasks.findOne({ _id: taskObjectId } as any)
    if (!task) {
      return { success: false, message: 'Task not found' }
    }

    // Check if user can confirm completion (admin or task creator)
    const canConfirm = workflow.createdBy === session._id || task.createdBy === session._id
    if (!canConfirm) {
      return { success: false, message: 'You do not have permission to confirm task completion' }
    }

    // Check if task is already confirmed
    if (task.confirmedBy) {
      return { success: false, message: 'Task completion is already confirmed' }
    }

    // Update the task
    const updateData: any = {
      status: 'Completed', // Change status to Completed
      confirmedBy: session._id,
      confirmedAt: new Date(),
      updatedAt: new Date()
    }

    // Store feedback for the task completer if provided
    if (confirmationData.feedback && confirmationData.feedback.trim()) {
      updateData.feedbackForCompleter = confirmationData.feedback.trim()
      updateData.feedbackFrom = session._id
      updateData.feedbackAt = new Date()
    }

    // If awarding credits, update the member's credits
    if (confirmationData.awardCredits && task.completedBy) {
      updateData.creditsAwarded = true
      
      // Update member credits in workflow
      const memberUpdate = await workflows.updateOne(
        { _id: workflowObjectId, 'members.userId': task.completedBy } as any,
        { $inc: { 'members.$.credits': 1 } }
      )
      
      if (memberUpdate.modifiedCount === 0) {
        console.warn('Failed to update member credits')
      }
    }

    const result = await tasks.updateOne(
      { _id: taskObjectId } as any,
      { $set: updateData }
    )

    if (result.modifiedCount === 0) {
      return { success: false, message: 'Failed to confirm task completion' }
    }

    return { success: true, message: 'Task completion confirmed successfully' }
  } catch (error) {
    console.error('Confirm task completion error:', error)
    return { success: false, message: 'An error occurred while confirming task completion' }
  }
}

export async function deleteWorkflowTask(
  workflowId: string,
  taskId: string
): Promise<WorkflowResponse> {
  try {
    const session = await getUserSession()
    if (!session) {
      return { success: false, message: 'No session found' }
    }

    const { workflows, tasks } = await getCollections()
    let workflowObjectId: ObjectId
    let taskObjectId: ObjectId
    
    try {
      workflowObjectId = new ObjectId(workflowId)
      taskObjectId = new ObjectId(taskId)
    } catch (e) {
      return { success: false, message: 'Invalid workflow or task ID format' }
    }

    const workflow = await workflows.findOne({ _id: workflowObjectId } as any)
    if (!workflow) {
      return { success: false, message: 'Workflow not found' }
    }

    const currentMember = workflow.members.find((member: any) => member.userId === session._id)
    if (!currentMember) {
      return { success: false, message: 'You are not a member of this workflow' }
    }

    const task = await tasks.findOne({ _id: taskObjectId } as any)
    if (!task) {
      return { success: false, message: 'Task not found' }
    }

    // Check if user can delete this task (admin or task creator only)
    const canDelete = workflow.createdBy === session._id || task.createdBy === session._id
    if (!canDelete) {
      return { success: false, message: 'You do not have permission to delete this task' }
    }

    // Soft delete the task
    const result = await tasks.updateOne(
      { _id: taskObjectId } as any,
      {
        $set: {
          isDeleted: true,
          deletedBy: session._id,
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      }
    )

    if (result.modifiedCount === 0) {
      return { success: false, message: 'Failed to delete task' }
    }

    return { success: true, message: 'Task deleted successfully' }
  } catch (error) {
    console.error('Delete workflow task error:', error)
    return { success: false, message: 'An error occurred while deleting the task' }
  }
}

export async function deleteCompletionMessage(
  workflowId: string,
  taskId: string
): Promise<WorkflowResponse> {
  try {
    const session = await getUserSession()
    if (!session) {
      return { success: false, message: 'No session found' }
    }

    const { workflows, tasks } = await getCollections()
    let workflowObjectId: ObjectId
    let taskObjectId: ObjectId
    
    try {
      workflowObjectId = new ObjectId(workflowId)
      taskObjectId = new ObjectId(taskId)
    } catch (e) {
      return { success: false, message: 'Invalid workflow or task ID format' }
    }

    const workflow = await workflows.findOne({ _id: workflowObjectId } as any)
    if (!workflow) {
      return { success: false, message: 'Workflow not found' }
    }

    const currentMember = workflow.members.find((member: any) => member.userId === session._id)
    if (!currentMember) {
      return { success: false, message: 'You are not a member of this workflow' }
    }

    const task = await tasks.findOne({ _id: taskObjectId } as any)
    if (!task) {
      return { success: false, message: 'Task not found' }
    }

    // Check if user is the one who completed the task
    if (task.completedBy !== session._id) {
      return { success: false, message: 'You can only delete your own completion message' }
    }

    // Remove the completion message and related fields
    const result = await tasks.updateOne(
      { _id: taskObjectId } as any,
      {
        $unset: {
          completionMessage: "",
          completedBy: "",
          completedAt: ""
        },
        $set: {
          status: 'In Progress', // Reset status back to In Progress
          updatedAt: new Date()
        }
      }
    )

    if (result.modifiedCount === 0) {
      return { success: false, message: 'Failed to delete completion message' }
    }

    return { success: true, message: 'Completion message deleted successfully' }
  } catch (error) {
    console.error('Delete completion message error:', error)
    return { success: false, message: 'An error occurred while deleting the completion message' }
  }
}

export async function deleteFeedbackMessage(
  workflowId: string,
  taskId: string
): Promise<WorkflowResponse> {
  try {
    const session = await getUserSession()
    if (!session) {
      return { success: false, message: 'No session found' }
    }

    const { workflows, tasks } = await getCollections()
    let workflowObjectId: ObjectId
    let taskObjectId: ObjectId
    
    try {
      workflowObjectId = new ObjectId(workflowId)
      taskObjectId = new ObjectId(taskId)
    } catch (e) {
      return { success: false, message: 'Invalid workflow or task ID format' }
    }

    const workflow = await workflows.findOne({ _id: workflowObjectId } as any)
    if (!workflow) {
      return { success: false, message: 'Workflow not found' }
    }

    const currentMember = workflow.members.find((member: any) => member.userId === session._id)
    if (!currentMember) {
      return { success: false, message: 'You are not a member of this workflow' }
    }

    const task = await tasks.findOne({ _id: taskObjectId } as any)
    if (!task) {
      return { success: false, message: 'Task not found' }
    }

    // Check if user is the one who completed the task (the one who received the feedback)
    if (task.completedBy !== session._id) {
      return { success: false, message: 'You can only delete feedback messages for tasks you completed' }
    }

    // Remove the feedback message and related fields
    const result = await tasks.updateOne(
      { _id: taskObjectId } as any,
      {
        $unset: {
          feedbackForCompleter: "",
          feedbackFrom: "",
          feedbackAt: ""
        },
        $set: {
          updatedAt: new Date()
        }
      }
    )

    if (result.modifiedCount === 0) {
      return { success: false, message: 'Failed to delete feedback message' }
    }

    return { success: true, message: 'Feedback message deleted successfully' }
  } catch (error) {
    console.error('Delete feedback message error:', error)
    return { success: false, message: 'An error occurred while deleting the feedback message' }
  }
}

export async function updateWorkflow(
  workflowId: string,
  updateData: { name: string; description: string }
): Promise<WorkflowResponse> {
  try {
    const session = await getUserSession()
    if (!session) {
      return { success: false, message: 'No session found' }
    }

    const { workflows } = await getCollections()
    let workflowObjectId: ObjectId
    
    try {
      workflowObjectId = new ObjectId(workflowId)
    } catch (e) {
      return { success: false, message: 'Invalid workflow ID format' }
    }

    const workflow = await workflows.findOne({ _id: workflowObjectId } as any)
    if (!workflow) {
      return { success: false, message: 'Workflow not found' }
    }

    // Check if user is the workflow creator (admin)
    if (workflow.createdBy !== session._id) {
      return { success: false, message: 'Only the workflow creator can update workflow details' }
    }

    // Update the workflow
    const result = await workflows.updateOne(
      { _id: workflowObjectId } as any,
      {
        $set: {
          name: updateData.name,
          description: updateData.description,
          updatedAt: new Date()
        }
      }
    )

    if (result.modifiedCount === 0) {
      return { success: false, message: 'Failed to update workflow' }
    }

    // Get the updated workflow
    const updatedWorkflow = await workflows.findOne({ _id: workflowObjectId } as any)
    if (!updatedWorkflow) {
      return { success: false, message: 'Workflow updated but failed to retrieve updated data' }
    }

    return { 
      success: true, 
      message: 'Workflow updated successfully',
      workflow: updatedWorkflow
    }
  } catch (error) {
    console.error('Update workflow error:', error)
    return { success: false, message: 'An error occurred while updating the workflow' }
  }
}

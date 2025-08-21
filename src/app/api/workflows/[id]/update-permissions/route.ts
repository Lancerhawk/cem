import { NextRequest, NextResponse } from 'next/server'
import { updateMemberPermissions } from '@/app/lib/actions/workflow_action'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { memberId, permissions } = body

    if (!memberId || !permissions) {
      return NextResponse.json(
        { success: false, message: 'Member ID and permissions are required' },
        { status: 400 }
      )
    }

    console.log('Update permissions API: Request received for workflow:', id, 'member:', memberId, 'permissions:', permissions)

    const result = await updateMemberPermissions(id, memberId, permissions)

    if (result.success) {
      return NextResponse.json(
        { success: true, message: result.message },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Update permissions API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

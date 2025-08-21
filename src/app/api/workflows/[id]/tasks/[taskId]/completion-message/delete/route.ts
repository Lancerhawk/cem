import { NextRequest, NextResponse } from 'next/server'
import { deleteCompletionMessage } from '@/app/lib/actions/workflow_action'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id, taskId } = await params

    const result = await deleteCompletionMessage(id, taskId)
    
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message }, { status: 200 })
    } else {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 })
    }
  } catch (error) {
    console.error('Delete completion message API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

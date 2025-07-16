import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { KnowledgeBaseService } from '@/services/knowledge-base';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const item = await KnowledgeBaseService.getKnowledgeItem(id, userId);

    if (!item) {
      return NextResponse.json({ error: 'Knowledge item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to fetch knowledge item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge item' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const updates = await request.json();
    const item = await KnowledgeBaseService.updateKnowledgeItem(id, userId, updates);

    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to update knowledge item:', error);
    return NextResponse.json(
      { error: 'Failed to update knowledge item' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await KnowledgeBaseService.deleteKnowledgeItem(id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete knowledge item:', error);
    return NextResponse.json(
      { error: 'Failed to delete knowledge item' },
      { status: 500 },
    );
  }
}

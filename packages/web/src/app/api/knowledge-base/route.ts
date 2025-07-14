import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { KnowledgeBaseService } from '@/services/knowledge-base';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    const limit = Number(searchParams.get('limit')) || 20;
    const offset = Number(searchParams.get('offset')) || 0;
    const query = searchParams.get('query');
    
    // Parse filters
    const filters: any = {};
    if (searchParams.get('platforms')) {
      filters.platforms = searchParams.get('platforms')?.split(',');
    }
    if (searchParams.get('contentTypes')) {
      filters.contentTypes = searchParams.get('contentTypes')?.split(',');
    }
    if (searchParams.get('processingStatus')) {
      filters.processingStatus = searchParams.get('processingStatus')?.split(',');
    }
    if (searchParams.get('tags')) {
      filters.tags = searchParams.get('tags')?.split(',');
    }
    if (searchParams.get('dateStart')) {
      filters.dateRange = {
        start: searchParams.get('dateStart'),
        end: searchParams.get('dateEnd') || undefined,
      };
    }

    let result;
    if (query) {
      // 语义搜索
      const items = await KnowledgeBaseService.semanticSearch(userId, query, limit);
      result = {
        items,
        total: items.length,
        hasMore: false,
        nextCursor: undefined,
      };
    } else {
      // 普通查询
      result = await KnowledgeBaseService.getKnowledgeItems(userId, filters, limit, offset);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch knowledge items:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch knowledge items',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const item = await KnowledgeBaseService.createKnowledgeItem({
      ...body,
      userId,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to create knowledge item:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge item' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getEmailTemplate } from '@/lib/email-templates';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  return requireRole('ADMIN')(async (req: NextRequest) => {
    try {
      const template = getEmailTemplate(type);
      
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(template);
    } catch (error) {
      console.error('Template fetch error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(req);
}


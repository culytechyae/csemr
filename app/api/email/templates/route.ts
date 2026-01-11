import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { z } from 'zod';
import { emailTemplates, getAllEmailTemplates } from '@/lib/email-templates';

// In-memory storage for templates (in production, use database)
// TODO: Move to database table
const templates = emailTemplates;

const templateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  type: z.string(),
});

export const GET = requireRole('ADMIN')(async (req: NextRequest) => {
  try {
    const templatesList = getAllEmailTemplates();
    return NextResponse.json(templatesList);
  } catch (error) {
    console.error('Templates fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = requireRole('ADMIN')(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const data = templateSchema.parse(body);

    // Update template
    if (templates[data.type]) {
      templates[data.type] = {
        ...templates[data.type],
        ...data,
      };
      return NextResponse.json(templates[data.type]);
    }

    return NextResponse.json(
      { error: 'Template type not found' },
      { status: 404 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Template update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});


import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logSecurityEvent } from '@/security/audit/audit-logger';

/**
 * GET /api/security/incidents
 * Get all security incidents (Admin only)
 */
export const GET = requireAuth(async (req: NextRequest, user) => {
  try {
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (category) where.category = category;

    const incidents = await prisma.securityIncident.findMany({
      where,
      include: {
        reportedByUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignedToUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.securityIncident.count({ where });

    await logSecurityEvent(
      'INCIDENTS_ACCESSED',
      user.id,
      'INFO',
      'Security incidents accessed',
      req
    );

    return NextResponse.json({
      incidents,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/security/incidents
 * Create a new security incident
 */
export const POST = requireAuth(async (req: NextRequest, user) => {
  try {

    const body = await req.json();
    const {
      title,
      description,
      severity,
      category,
      assignedTo,
      detectedAt,
      affectedSystems,
      affectedData,
    } = body;

    if (!title || !description || !severity || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const incident = await prisma.securityIncident.create({
      data: {
        title,
        description,
        severity,
        category,
        reportedBy: user.id,
        assignedTo,
        detectedAt: detectedAt ? new Date(detectedAt) : new Date(),
        affectedSystems,
        affectedData,
      },
      include: {
        reportedByUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignedToUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await logSecurityEvent(
      'INCIDENT_REPORTED',
      user.id,
      severity === 'CRITICAL' ? 'CRITICAL' : severity === 'HIGH' ? 'ERROR' : 'WARNING',
      `Security incident created: ${title}`,
      req,
      { incidentId: incident.id }
    );

    return NextResponse.json(incident, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create incident' },
      { status: 500 }
    );
  }
});


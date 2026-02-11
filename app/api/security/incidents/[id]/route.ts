import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logSecurityEvent } from '@/security/audit/audit-logger';

/**
 * GET /api/security/incidents/[id]
 * Get a specific security incident
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req: NextRequest, user) => {
    try {
      if (user.role !== 'ADMIN' && user.role !== 'CLINIC_MANAGER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

    const incident = await prisma.securityIncident.findUnique({
      where: { id: params.id },
      include: {
        reportedByUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignedToUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }

    await logSecurityEvent(
      'INCIDENT_ACCESSED',
      user.id,
      'INFO',
      `Security incident accessed: ${params.id}`,
      req
    );

    return NextResponse.json(incident);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Failed to fetch incident' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * PATCH /api/security/incidents/[id]
 * Update a security incident (Admin or assigned user only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(async (req: NextRequest, user) => {
    try {

    const incident = await prisma.securityIncident.findUnique({
      where: { id: params.id },
    });

    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      );
    }

    // Only Admin or assigned user can update
    if (user.role !== 'ADMIN' && incident.assignedTo !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo;
    if (body.impact !== undefined) updateData.impact = body.impact;
    if (body.rootCause !== undefined) updateData.rootCause = body.rootCause;
    if (body.remediation !== undefined) updateData.remediation = body.remediation;
    if (body.affectedSystems !== undefined) updateData.affectedSystems = body.affectedSystems;
    if (body.affectedData !== undefined) updateData.affectedData = body.affectedData;
    if (body.breachConfirmed !== undefined) updateData.breachConfirmed = body.breachConfirmed;
    if (body.notified !== undefined) updateData.notified = body.notified;

    // Set timestamps based on status
    if (body.status === 'CONTAINED' && !incident.containedAt) {
      updateData.containedAt = new Date();
    }
    if (body.status === 'RESOLVED' && !incident.resolvedAt) {
      updateData.resolvedAt = new Date();
    }
    if (body.status === 'CLOSED' && !incident.closedAt) {
      updateData.closedAt = new Date();
    }
    if (body.notified && !incident.notifiedAt) {
      updateData.notifiedAt = new Date();
    }

    const updatedIncident = await prisma.securityIncident.update({
      where: { id: params.id },
      data: updateData,
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
      'INCIDENT_UPDATED',
      user.id,
      'WARNING',
      `Security incident updated: ${params.id}`,
      req,
      { changes: updateData }
    );

    return NextResponse.json(updatedIncident);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Failed to update incident' },
        { status: 500 }
      );
    }
  })(req);
}


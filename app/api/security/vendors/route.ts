import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getAuthUser } from '@/lib/auth';
import { logSecurityEvent } from '@/security/audit/audit-logger';

/**
 * GET /api/security/vendors
 * Get all vendors (Admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const riskLevel = searchParams.get('riskLevel');
    const hasSystemAccess = searchParams.get('hasSystemAccess');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (status) where.status = status;
    if (riskLevel) where.riskLevel = riskLevel;
    if (hasSystemAccess) where.hasSystemAccess = hasSystemAccess === 'true';

    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        createdByUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.vendor.count({ where });

    await logSecurityEvent(
      'VENDORS_ACCESSED',
      user.id,
      'INFO',
      'Vendors accessed',
      req
    );

    return NextResponse.json({
      vendors,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/security/vendors
 * Create a new vendor (Admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      contactName,
      contactEmail,
      contactPhone,
      companyName,
      address,
      riskLevel,
      hasSystemAccess,
      hasDataAccess,
      hasNetworkAccess,
      accessLevel,
      services,
      contractStart,
      contractEnd,
      complianceStatus,
      securityCertifications,
    } = body;

    if (!name || !contactName || !contactEmail || !contactPhone || !companyName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const vendor = await prisma.vendor.create({
      data: {
        name,
        contactName,
        contactEmail,
        contactPhone,
        companyName,
        address,
        riskLevel: riskLevel || 'MEDIUM',
        hasSystemAccess: hasSystemAccess || false,
        hasDataAccess: hasDataAccess || false,
        hasNetworkAccess: hasNetworkAccess || false,
        accessLevel,
        services,
        contractStart: contractStart ? new Date(contractStart) : null,
        contractEnd: contractEnd ? new Date(contractEnd) : null,
        complianceStatus,
        securityCertifications,
        createdBy: user.id,
      },
      include: {
        createdByUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await logSecurityEvent(
      'VENDOR_CREATED',
      user.id,
      'INFO',
      `Vendor created: ${name}`,
      req,
      { vendorId: vendor.id }
    );

    return NextResponse.json(vendor, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create vendor' },
      { status: 500 }
    );
  }
}


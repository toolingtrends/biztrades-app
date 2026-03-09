import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {prisma } from '@/lib/prisma';

// GET - Get user settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        settings: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const settings = {
      profileVisibility: user.settings?.profileVisibility || 'public',
      phoneNumber: user.phone || '',
      email: user.email || '',
      introduceMe: user.settings?.marketingEmails ?? true,
      emailNotifications: user.settings?.emailNotifications ?? true,
      eventReminders: user.settings?.eventUpdates ?? true,
      newMessages: user.settings?.pushNotifications ?? true,
      connectionRequests: user.settings?.pushNotifications ?? true,
      isVerified: user.isVerified,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      role: user.role
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update user settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      profileVisibility,
      phoneNumber,
      email,
      introduceMe,
      emailNotifications,
      eventReminders,
      newMessages,
      connectionRequests
    } = body;

    // Update user settings
    const updatedSettings = await prisma.settings.upsert({
      where: { userId: session.user.id },
      update: {
        profileVisibility,
        emailNotifications,
        pushNotifications: newMessages || connectionRequests,
        smsNotifications: false,
        marketingEmails: introduceMe,
        eventUpdates: eventReminders,
        showEmail: profileVisibility === 'public',
        showPhone: profileVisibility === 'public'
      },
      create: {
        userId: session.user.id,
        profileVisibility,
        emailNotifications,
        pushNotifications: newMessages || connectionRequests,
        smsNotifications: false,
        marketingEmails: introduceMe,
        eventUpdates: eventReminders,
        showEmail: profileVisibility === 'public',
        showPhone: profileVisibility === 'public'
      }
    });

    // Update user profile if phone or email changed
    const userUpdateData: any = {};
    if (phoneNumber !== undefined) userUpdateData.phone = phoneNumber;
    if (email !== undefined) userUpdateData.email = email;

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: userUpdateData
      });
    }

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
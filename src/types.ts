export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'reseller' | 'user';
  referredBy?: string;
  lastReferralKey?: string;
  balance?: number;
  totalBuildLimit?: number;
  usedBuildCount?: number;
  apiSecret?: string;
  businessName?: string;
  createdAt: number;
}

export interface AppBuild {
  id: string;
  licenseId: string;
  resellerId: string;
  appName: string;
  packageName: string;
  version: string;
  isActive: boolean;
  status?: 'queued' | 'processing' | 'finished' | 'failed';
  downloadUrl?: string;
  config?: any;
  createdAt: number;
}

export interface SystemConfig {
  telegramId: string;
  siteName: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in days
  durationUnit: 'days' | 'lifetime';
  buildLimit: number;
  features: string[];
  isPopular?: boolean;
}

export interface InviteCode {
  id: string; // the code itself
  createdBy: string; // admin uid
  usedBy?: string; // reseller uid
  createdAt: number;
  expiresAt: number; // For managing expiry
  isUsed: boolean;
  status: 'active' | 'suspended' | 'expired';
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'topup' | 'purchase' | 'refund';
  description: string;
  createdAt: number;
}

export interface License {
  id: string; // The ID in Firestore (matches key)
  key: string;
  resellerId: string;
  resellerEmail?: string;
  deviceId: string | null;
  status: 'active' | 'paused' | 'expired' | 'suspended';
  expiresAt: number; // timestamp
  maxUsage: number;
  currentUsage: number;
  price?: number; 
  note?: string;
  appName?: string; // Track which app is using this license
  buildCount: number;
  buildLimit: number;
  createdAt: number;
}

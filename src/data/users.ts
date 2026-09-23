import { User } from '../types';

export interface StoredUser extends User {
  passwordHash: string; // Plaintext for prototype demonstration
}

export const INITIAL_USERS: StoredUser[] = [
  {
    id: 'usr-bidder-001',
    username: 'bidder001',
    passwordHash: 'bidder123',
    name: 'Rajesh Sharma',
    role: 'bidder',
    email: 'compliance@abctechnologies.in',
    organization: 'ABC Technologies Pvt. Ltd.',
    designation: 'Director - Govt Procurement & Tenders',
    bidderId: 'bidder-001',
  },
  {
    id: 'usr-officer-001',
    username: 'officer001',
    passwordHash: 'officer123',
    name: 'Dr. Vikram Malhotra',
    role: 'officer',
    email: 'v.malhotra@gem.gov.in',
    organization: 'GeM Procurement & Compliance Directorate',
    designation: 'Senior Procurement & Compliance Officer (L-12)',
  },
  {
    id: 'usr-bidder-002',
    username: 'bidder002',
    passwordHash: 'bidder123',
    name: 'Sunita Rao',
    role: 'bidder',
    email: 'tenders@bharatheavytools.co.in',
    organization: 'Bharat Heavy Engineering & Tools Ltd.',
    designation: 'Head of Regulatory Affairs',
    bidderId: 'bidder-002',
  },
];

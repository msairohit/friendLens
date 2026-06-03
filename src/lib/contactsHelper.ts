// ============================================================
// contactsHelper — Phone contacts access + normalization
// ============================================================

import * as Contacts from 'expo-contacts';

/**
 * Request permission to access device contacts.
 * Returns true if permission was granted.
 */
export async function requestContactsPermission(): Promise<boolean> {
  const { status } = await Contacts.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Check if contacts permission is already granted.
 */
export async function checkContactsPermission(): Promise<boolean> {
  const { status } = await Contacts.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Normalize a phone number by stripping spaces, dashes, parentheses, dots.
 * Keeps digits and leading '+'.
 * e.g. "+1 (555) 123-4567" → "+15551234567"
 */
export function normalizePhoneNumber(phone: string): string {
  // Strip everything except digits and +
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Fetch all phone contacts from the device, extract and normalize all phone numbers.
 * Returns a unique list of normalized phone numbers.
 */
export async function getContactPhoneNumbers(): Promise<string[]> {
  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.PhoneNumbers],
  });

  if (!data || data.length === 0) return [];

  const phoneSet = new Set<string>();

  for (const contact of data) {
    if (contact.phoneNumbers) {
      for (const phoneEntry of contact.phoneNumbers) {
        if (phoneEntry.number) {
          const normalized = normalizePhoneNumber(phoneEntry.number);
          if (normalized.length >= 7) {
            // Only include numbers that look valid (at least 7 digits)
            phoneSet.add(normalized);
          }
        }
      }
    }
  }

  return Array.from(phoneSet);
}

export interface ContactPhoneInfo {
  number: string;
  name: string;
}

/**
 * Fetch all device contacts with both phone numbers and names.
 */
export async function getContactPhonesWithNames(): Promise<ContactPhoneInfo[]> {
  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
  });

  if (!data || data.length === 0) return [];

  const list: ContactPhoneInfo[] = [];
  const seenNumbers = new Set<string>();

  for (const contact of data) {
    if (contact.phoneNumbers) {
      for (const phoneEntry of contact.phoneNumbers) {
        if (phoneEntry.number) {
          const normalized = normalizePhoneNumber(phoneEntry.number);
          if (normalized.length >= 7 && !seenNumbers.has(normalized)) {
            seenNumbers.add(normalized);
            list.push({
              number: normalized,
              name: contact.name || 'Unknown Contact',
            });
          }
        }
      }
    }
  }

  return list;
}

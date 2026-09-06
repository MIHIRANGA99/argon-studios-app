import type { BusinessCard } from '../types';

export function generateVCard(card: BusinessCard): string {
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${card.fullName}`,
    `N:${card.fullName.split(' ').reverse().join(';')};;;`,
    `ORG:${card.companyName}`,
    `TITLE:${card.jobTitle}`,
    card.phone ? `TEL;TYPE=CELL,VOICE:${card.phone}` : '',
    card.email ? `EMAIL;TYPE=WORK,INTERNET:${card.email}` : '',
    card.websiteUrl ? `URL:${card.websiteUrl}` : '',
    card.tagline ? `NOTE:${card.tagline}` : '',
    'END:VCARD'
  ]
    .filter(Boolean)
    .join('\r\n');

  return vcard;
}

export function downloadVCard(card: BusinessCard) {
  const vcardText = generateVCard(card);
  const blob = new Blob([vcardText], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${card.fullName.replace(/\s+/g, '_')}_Contact.vcf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

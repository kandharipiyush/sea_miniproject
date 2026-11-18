// Standard Doctor Avatars (100% Reliable Local SVGs)
export const DEFAULT_MALE_DOCTOR = '/avatars/male-doctor.svg';
export const DEFAULT_FEMALE_DOCTOR = '/avatars/female-doctor.svg';

const FEMALE_NAMES = [
  'priya', 'ananya', 'sneha', 'sunita', 'pooja', 'neha', 'kavita', 'ritu',
  'shweta', 'meera', 'shalini', 'priyanka', 'divya', 'tanvi', 'swati', 'aarti',
  'rashmi', 'jyoti', 'rekha', 'vandana', 'shruti', 'dr. ananya', 'dr. priya',
  'dr. sneha', 'dr. pooja', 'dr. neha', 'dr. kavita', 'dr. ritu', 'dr. meera'
];

export function isFemaleDoctor(name?: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return FEMALE_NAMES.some((fn) => lower.includes(fn));
}

export function getDoctorPhoto(doctor?: { name?: string; profile_photo?: string }): string {
  if (!doctor) return DEFAULT_MALE_DOCTOR;
  const isFemale = isFemaleDoctor(doctor.name);

  // If already set to local avatar or if no photo exists
  if (!doctor.profile_photo || doctor.profile_photo.trim() === '') {
    return isFemale ? DEFAULT_FEMALE_DOCTOR : DEFAULT_MALE_DOCTOR;
  }

  // Return standard photo or avatar
  return doctor.profile_photo;
}

export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>, name?: string) {
  const isFemale = isFemaleDoctor(name);
  e.currentTarget.onerror = null; // Prevent infinite fallback loops
  e.currentTarget.src = isFemale ? DEFAULT_FEMALE_DOCTOR : DEFAULT_MALE_DOCTOR;
}

export type StoredProfile = {
  mobileNumber?: string | null;
  mobileCountry?: string | null;
  registrationNumber?: string | null;
  schoolCollegeName?: string | null;
};

export type ProfileSubmission = {
  mobileNumber: string;
  mobileCountry: string;
  registrationNumber: string;
  schoolCollegeName: string;
  isVitStudent: boolean;
};

export function isVitStudentEmail(email?: string | null) {
  return email?.toLowerCase().endsWith("@vitstudent.ac.in") ?? false;
}

export function normalizeProfileValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "";
}

export function getDefaultSchoolCollegeName(email?: string | null) {
  return isVitStudentEmail(email) ? "Vellore Institute Of Technology" : "";
}

export function buildProfileSubmission(params: {
  email: string;
  body: StoredProfile;
}): ProfileSubmission {
  const isVitStudent = isVitStudentEmail(params.email);

  return {
    mobileNumber: normalizeProfileValue(params.body.mobileNumber),
    mobileCountry: normalizeProfileValue(params.body.mobileCountry),
    registrationNumber: normalizeProfileValue(params.body.registrationNumber),
    schoolCollegeName: isVitStudent
      ? getDefaultSchoolCollegeName(params.email)
      : normalizeProfileValue(params.body.schoolCollegeName),
    isVitStudent,
  };
}

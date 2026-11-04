export type AccessParticipant = {
  participant_type: string;
  status: string;
  full_name: string;
  school: string | null;
  experience: string | null;
  committee_id: string | null;
  country: string | null;
  mesa_roster_id: string | null;
};
export type AccessState = {
  participant: AccessParticipant | null;
  roles: string[];
  house: string | null;
};

export function isAdministrator(roles: string[]) {
  return roles.includes("admin") || roles.includes("super_admin");
}

export function hasValidRegistration(part: AccessParticipant | null) {
  if (!part || part.status !== "active" || !part.full_name?.trim() || !part.school?.trim()) return false;
  if (part.participant_type === "delegado") {
    return !!part.committee_id && !!part.country?.trim() && ["Principiante", "Intermedio", "Avanzado"].includes(part.experience ?? "");
  }
  if (part.participant_type === "mesa") return !!part.committee_id && !!part.mesa_roster_id;
  return part.participant_type === "staff" || part.participant_type === "profesor";
}

export function canAttendSorting(state: AccessState) {
  const part = state.participant;
  if (!hasValidRegistration(part) || !part) return false;
  return (part.participant_type === "delegado" && state.roles.includes("delegate")) ||
    (part.participant_type === "mesa" && state.roles.includes("mesa"));
}

export function accessDestination(state: AccessState): "/admin" | "/registro" | "/sorting" | "/portal" | "/estado" {
  if (isAdministrator(state.roles)) return "/admin";
  if (!state.participant) return "/registro";
  // Existing assignments remain accessible, including legacy backfilled records.
  if (state.house && state.participant.status === "active" &&
    ((state.participant.participant_type === "delegado" && state.roles.includes("delegate")) ||
    (state.participant.participant_type === "mesa" && state.roles.includes("mesa")))) return "/portal";
  if (!canAttendSorting(state)) return "/estado";
  return state.house ? "/portal" : "/sorting";
}

export function redirectForAccess(state: AccessState, path: string) {
  const destination = accessDestination(state);
  if (path === "/admin" && !isAdministrator(state.roles)) return destination;
  if (["/registro", "/sorting", "/portal", "/estado"].includes(path)) {
    // Administrators may reopen the existing portal only when a House exists.
    if (path === "/portal" && isAdministrator(state.roles) && state.house) return null;
    return path === destination ? null : destination;
  }
  if (!isAdministrator(state.roles) && destination !== "/portal") return destination;
  return null;
}
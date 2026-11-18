export interface EventAttendeeRequest{
  eventId: number;
}

export enum AttendanceStatus {
  PENDIENTE = 'PENDIENTE',
  ASISTIO = 'ASISTIO',
  NO_ASISTIO = 'NO_ASISTIO'
}

export interface EventAttendeeResponse{
  id: number;
  attendeeEmail: string;
  attendeeName?: string | null;
  attendeePhone: string;
  attendanceStatus: AttendanceStatus;
  registeredAt: string;
}

export interface RegisterAttendanceRequest{
  eventAttendeeId: number;
  status: AttendanceStatus;
}


export interface Service {
    id: number;
    name: string;
}



export interface Staff {
  id: number;
  
  user_id: number;
  user_username: string;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  services_offered: Service[];
  slot_duration: number;
  lead_time: string | null;
  finish_time: string | null;
  work_on_saturday: boolean;
  work_on_sunday: boolean;
  created_at: string;
  set_timetable: boolean;
}

export interface NewStaffPayload {
  username: string;
  email: string;
  password: string;
  user_first_name?: string;
  user_last_name?: string;

  slot_duration?: number;
  lead_time?: string;        
  finish_time?: string;     
  appointment_buffer_time?: number;

  work_on_saturday?: boolean;
  work_on_sunday?: boolean;
  set_timetable?: boolean;

  services_offered?: Service[];
}


export interface WorkingHours{
    staff_member_id: number;
    day_of_week: number;
    start_time: string;
    end_time:string
}

export interface DayOff {
  staff_member_id:number;
  user_first_name?:string;
  user_last_name?:string;
  start_date: string;
  end_date: string;
  description: string;
}
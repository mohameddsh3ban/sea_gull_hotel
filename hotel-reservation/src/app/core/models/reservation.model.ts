// =================================================================================
// File: hotel-reservation/src/app/core/models/reservation.model.ts
// =================================================================================

export interface Reservation {
  id?: string;
  restaurant: string;
  restaurantId?: string; // Backend sometimes sends this
  date: string;
  time: string;
  guests: number;
  room: string;
  first_name: string;
  last_name: string;
  email: string;
  main_courses: string[];
  comments?: string;
  upsell_items?: { [key: string]: number };
  upsell_total_price?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
  paid?: boolean;
  email_status?: string;
  is_vip?: boolean;
  vip_level?: string;
}

export interface PaginationMeta {
  current_page_items: number;
  per_page: number;
  next_last_id: string | null;
  has_next: boolean;
}

export interface ReservationResponse {
  items: Reservation[];
  pagination: PaginationMeta;
}

export interface RestaurantConfig {
  restaurantId: string;
  isActive: boolean;
  openingTime: string;
  closingTime: string;
  intervalMinutes: number;
}

export interface CapacityData {
  [key: string]: {
    capacity: number;
    reserved_guests: number;
    available: number;
  }; 
}

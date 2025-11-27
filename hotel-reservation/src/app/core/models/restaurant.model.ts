export interface Restaurant {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  order: number;
  media: {
    cardImage: string;
    coverImage: string;
    menuPdfUrl: string;
  };
  config: {
    openingTime: string;
    closingTime: string;
    timeSlotInterval: number;
    maxGuestsPerBooking: number;
  };
  menuConfig: {
    hasMainCourseSelection: boolean;
    mainCourseLabel: string;
    mainCourses: MainCourseItem[];
    hasUpsells: boolean;
    upsellLabel: string;
    upsellItems: UpsellItem[];
  };
}

export interface MainCourseItem {
  id: string;
  label: string;
  available: boolean;
}

export interface UpsellItem {
  id: string;
  label: string;
  price: number;
  category: string;
}

export type UserRole = 'USER' | 'DEALER' | 'ADMIN';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
}

export type VehicleCategory = 'ALL' | 'NEW' | 'USED';
export type VehicleStatus = 'ACTIVE' | 'SOLD' | 'DELETE';
export type VehicleType = 'SUV' | 'SEDAN' | 'HATCHBACK' | 'COUPE' | 'HYBRID' | 'CONVERTIBLE' | 'VAN' | 'TRUCK' | 'ELECTRIC';
export type VehicleBrand = 'AUDI' | 'BMW' | 'FORD' | 'MERCEDES' | 'PEUGEOT' | 'VOLKSWAGEN' | 'BENTLEY' | 'NISSAN' | 'JEEP' | 'TOYOTA' | 'KIA' | 'HYUNDAI';
export type VehicleGearbox = 'AUTOMATIC' | 'MANUAL' | 'CVT';
export type VehicleFuel = 'PETROL' | 'DIESEL' | 'GAS' | 'EV' | 'HYBRID';

export interface Vehicle {
  _id: string;
  vehicleCategory: VehicleCategory;
  vehicleStatus: VehicleStatus;
  vehicleType: VehicleType;
  vehicleBrand: VehicleBrand;
  vehicleGearbox: VehicleGearbox;
  vehicleFuel: VehicleFuel;
  vehicleModel: string;
  vehicleAddress: string;
  vehiclePrice: number;
  vehicleMileage: number;
  vehicleMadeYear: number;
  vehicleViews: number;
  vehicleLikes: number;
  vehicleComments: number;
  vehicleRank: number;
  vehicleImages: string[];
  vehicleDesc?: string | null;
  memberId: string;
  soldAt?: string | null;
  deletedAt?: string | null;
  constructedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  _id: string;
  title: string;
  content: string;
  coverImage?: string | null;
  tags: string[];
  author: string;
  likeCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

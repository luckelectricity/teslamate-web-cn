import { create } from 'zustand';
import { Car } from '@/types';

interface CarState {
  selectedCarId: number | null;
  cars: Car[];
  setSelectedCarId: (id: number) => void;
  setCars: (cars: Car[]) => void;
}

export const useCarStore = create<CarState>((set) => ({
  selectedCarId: 1,
  cars: [],
  setSelectedCarId: (id: number) => set({ selectedCarId: id }),
  setCars: (cars: Car[]) => set({ cars, selectedCarId: cars[0]?.id || 1 }),
}));

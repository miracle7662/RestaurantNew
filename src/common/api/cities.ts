import httpClient from '../helpers/httpClient';

// Interfaces
export interface CityItem {
  cityid: string;
  city_name: string;
  city_code: string;
  stateId: string;
  state_name?: string;
  countryid: string;
  country_name?: string;
  status: number;
  created_by_id: string;
  created_date: string;
  updated_by_id: string;
  updated_date: string;
}

export interface StateItem {
  stateid: number;
  state_name: string;
  status: number;
}

export interface CountryItem {
  countryid: number;
  country_name: string;
  status: number;
}

// API Functions
export const getCities = async (): Promise<CityItem[]> => {
  return await httpClient.get<CityItem[]>('/cities');
};

export const createCity = async (data: Partial<CityItem>): Promise<CityItem> => {
  return await httpClient.post<CityItem>('/cities', data);
};

export const updateCity = async (id: string, data: Partial<CityItem>): Promise<CityItem> => {
  return await httpClient.put<CityItem>(`/cities/${id}`, data);
};

export const deleteCity = async (id: string): Promise<void> => {
  return await httpClient.delete<void>(`/cities/${id}`);
};

export const getStates = async (): Promise<StateItem[]> => {
  return await httpClient.get<StateItem[]>('/states');
};

export const getCountries = async (): Promise<CountryItem[]> => {
  return await httpClient.get<CountryItem[]>('/countries');
};

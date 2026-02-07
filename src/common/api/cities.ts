import HttpClient from '../helpers/httpClient'

/* =======================
   Interfaces
======================= */

export interface CityItem {
   cityid: number;
  city_name: string;
  city_Code: string;
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
  stateid: number
  state_name: string
  status: number
}

export interface CountryItem {
  countryid: number
  country_name: string
  status: number
}

/* =======================
   Types
======================= */

type CityPayload =
  | {
      created_by_id: string;
      created_date: string;
      city_name: string;
      city_Code: string;
      stateId: string | undefined;
      countryid: string | undefined;
      iscoastal: number;
      status: number;
    }
  | {
      updated_by_id: string;
      updated_date: string;
      city_name: string;
      city_Code: string;
      stateId: string | undefined;
      countryid: string | undefined;
      iscoastal: number;
      status: number;
    };

type CityQueryParams = {
  q?: string
}

/* =======================
   Service
======================= */

function CityService() {
  return {
    /* -------- Cities -------- */

    list: (params?: CityQueryParams) => {
      return HttpClient.get('/cities', { params })
    },

    create: (payload: CityPayload) => {
      return HttpClient.post('/cities', payload)
    },

    update: (id: number, payload: CityPayload) => {
      return HttpClient.put(`/cities/${id}`, payload)
    },

    remove: (id: number) => {
      return HttpClient.delete(`/cities/${id}`)
    },

    /* -------- Masters -------- */

    states: () => {
      return HttpClient.get('/states')
    },

    countries: () => {
      return HttpClient.get('/countries')
    },
  }
}

export const getCities = CityService().list;
export const createCity = CityService().create;
export const updateCity = CityService().update;
export const deleteCity = CityService().remove;
export const getStates = CityService().states;
export const getCountries = CityService().countries;

export default CityService()

export { default as authApi } from './auth'
export { default as profileApi } from './profile'
export { default as countryApi } from './countries'
export { default as blockApi } from './blocks'
export { default as floorApi } from './floors'
export { default as hotelCategoryApi } from './hotelCategories'
export { default as hotelTypeApi } from './hotelTypes'
export { default as FeatureAPI } from './features'  
export { default as fragmentApi } from './fragments'
export { default as nationalityApi } from './nationalities'
export { default as roomCateogyApi } from "./roomCategoryService"
export {default as taxApi} from "./taxes"
export { default as departmentApi } from './departments'

// Common function to get dropdown options
export const getDropdownOptions = (data: any[], labelKey: string, valueKey: string) =>
  data.map(item => ({ label: item[labelKey], value: item[valueKey] }))

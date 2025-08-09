import { toast } from 'react-toastify'
import outletService from './../common/api/outlet'

export interface KitchenCategoryItem {
  kitchencategoryid: number
  Kitchen_Category: string
  status: number | string
}

export interface KitchenMainGroupItem {
  kitchenmaingroupid: number
  Kitchen_main_Group: string
  status: number | string
}

export interface KitchenSubCategoryItem {
  kitchensubcategoryid: number
  Kitchen_sub_category: string
  status: number | string
}

export interface ItemGroupItem {
  item_groupid: number
  itemgroupname: string
  status: number
}

export interface ItemMainGroupItem {
  item_maingroupid: number
  item_group_name: string
  status: number
}

export interface unitmasterItem {
  unitid: number
  unit_name: string
  status: number
}

export interface TaxGroup {
  taxgroupid: number
  taxgroup_name: string
  status: number
}

export const fetchKitchenCategory = async (
  setKitchen_Category: (data: KitchenCategoryItem[]) => void,
  setkitchencategoryid: (id: number) => void,
  currentkitchencategoryid?: number,
) => {
  try {
    const res = await fetch('http://localhost:3001/api/KitchenCategory')
    const data: KitchenCategoryItem[] = await res.json()
    setKitchen_Category(data)
    if (data.length > 0 && !currentkitchencategoryid) {
      setkitchencategoryid(data[0].kitchencategoryid)
    }
  } catch (err) {
    toast.error('Failed to fetch kitchen categories')
    console.error('Fetch kitchen categories error:', err)
  }
}

export const fetchKitchenMainGroup = async (
  setKitchen_main_Group: (data: KitchenMainGroupItem[]) => void,
  setkitchenmaingroupid: (id: number) => void,
  currentkitchenmaingroupid?: string,
) => {
  try {
    const res = await fetch('http://localhost:3001/api/KitchenMainGroup')
    const data: KitchenMainGroupItem[] = await res.json()
    setKitchen_main_Group(data)
    if (data.length > 0 && !currentkitchenmaingroupid) {
      setkitchenmaingroupid(data[0].kitchenmaingroupid)
    }
  } catch (err) {
    toast.error('Failed to fetch kitchen main groups')
    console.error('Fetch kitchen main groups error:', err)
  }
}

export const fetchKitchenSubCategory = async (
  setKitchen_sub_Category: (data: KitchenSubCategoryItem[]) => void,
  setkitchensubcategoryid: (id: number) => void,
  currentkitchensubcategoryid?: string,
) => {
  try {
    const res = await fetch('http://localhost:3001/api/KitchenSubCategory')
    const data: KitchenSubCategoryItem[] = await res.json()
    setKitchen_sub_Category(data)
    if (data.length > 0 && !currentkitchensubcategoryid) {
      setkitchensubcategoryid(data[0].kitchensubcategoryid)
    }
  } catch (err) {
    toast.error('Failed to fetch kitchen sub categories')
    console.error('Fetch kitchen sub categories error:', err)
  }
}

export const fetchItemGroup = async (
  setItemGroup: (data: ItemGroupItem[]) => void,
  setitemgroupid: (id: number) => void,
  currentitemgroupid?: string,
) => {
  try {
    const res = await fetch('http://localhost:3001/api/ItemGroup')
    const data: ItemGroupItem[] = await res.json()
    setItemGroup(data)
    if (data.length > 0 && !currentitemgroupid) {
      setitemgroupid(data[0].item_groupid)
    }
  } catch (err) {
    toast.error('Failed to fetch item groups')
    console.error('Fetch item groups error:', err)
    setItemGroup([])
  }
}

export const fetchItemMainGroup = async (
  setItemMainGroup: (data: ItemMainGroupItem[]) => void,
  setitemmaingroupid: (id: number) => void,
  currentitemmaingroupid?: string,
) => {
  try {
    const res = await fetch('http://localhost:3001/api/ItemMainGroup')
    const data: ItemMainGroupItem[] = await res.json()
    setItemMainGroup(data)
    if (data.length > 0 && !currentitemmaingroupid) {
      setitemmaingroupid(data[0].item_maingroupid)
    }
  } catch (err) {
    toast.error('Failed to fetch item main groups')
    console.error('Fetch item main groups error:', err)
    setItemMainGroup([])
  }
}

export const fetchunitmaster = async (
  setStockUnits: React.Dispatch<React.SetStateAction<unitmasterItem[]>>,
  setStockUnit: React.Dispatch<React.SetStateAction<number | null>>,
  defaultUnitId?: string | number
) => {
  try {
    const response = await fetch('http://localhost:3001/api/unitmaster', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: unitmasterItem[] = await response.json();
    setStockUnits(data.filter((unit) => unit.status === 0)); // Active units only

    if (defaultUnitId) {
      const defaultUnit = data.find((unit) => unit.unitid === Number(defaultUnitId));
      if (defaultUnit) {
        setStockUnit(defaultUnit.unitid);
      }
    }
  } catch (error) {
    console.error('Fetch stock units error:', error);
    setStockUnits([]);
  }
}

export const fetchData = async (
  setTaxGroups: React.Dispatch<React.SetStateAction<TaxGroup[]>>,
  setTaxgroupid: React.Dispatch<React.SetStateAction<number | null>>,
  defaultTaxGroupId?: string
) => {
  try {
    const response = await fetch('http://localhost:3001/api/taxgroup', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('TaxGroup API response:', responseData);

    // Handle nested response structure
    const data = responseData?.data?.taxGroups || responseData;

    // Ensure data is an array
    if (!Array.isArray(data)) {
      console.error('TaxGroup data is not an array:', data);
      setTaxGroups([]);
      return;
    }

    // Filter active tax groups - include status 0 and 1 as valid
    const activeTaxGroups = data.filter((tax: TaxGroup) => 
      tax.status === 0 || tax.status === 1 || tax.status === '0' || tax.status === '1'
    );
    
    console.log('Filtered tax groups:', activeTaxGroups);
    setTaxGroups(activeTaxGroups);

    // Set default tax group if provided
    if (defaultTaxGroupId) {
      const defaultTaxGroup = activeTaxGroups.find(
        (tax: TaxGroup) => tax.taxgroupid === Number(defaultTaxGroupId)
      );
      if (defaultTaxGroup) {
        setTaxgroupid(defaultTaxGroup.taxgroupid);
      } else {
        setTaxgroupid(null);
      }
    }
  } catch (error) {
    console.error('Fetch tax groups error:', error);
    setTaxGroups([]);
  }
}

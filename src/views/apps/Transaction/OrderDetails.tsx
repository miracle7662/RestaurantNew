import React, { useState, useEffect, Dispatch, SetStateAction, useRef, useMemo, useCallback } from 'react';
import { Row, Col, Card, Modal, Offcanvas, Table } from 'react-bootstrap';
import { fetchMenu, MenuItem } from '@/utils/commonfunction';
import MenuService from '@/common/api/menu';
import CustomerModal from './Customers';
import VariantModal from '@/components/VariantModal';

// Interface for variant options
interface VariantOption {
  variant_value_id: number;
  value_name: string;
  price: number;
}

// Interface for menu items used in state
interface MenuItemState {
  id: number;
  name: string;
  price: number;
  qty: number;
  isBilled: number;
  isNCKOT: number;
  NCName: string;
  NCPurpose: string;
  kotNo?: number;
  isNew?: boolean; // Added to track new items not yet sent to KOT
  variantId?: number;
  variantName?: string;

}

// Interface for card items (aligned with Menu.tsx)
interface CardItem {
  userId: string;
  itemCode: string;
  ItemName: string;
  shortName: string;
  price: number;
  cardStatus: string;
  item_group_id: number | null;
  variants?: VariantOption[]; // Variants for this item
}

// Interface for code search results (includes base items and variants)
interface CodeSearchResult {
  type: 'base' | 'variant';
  userId: string;
  itemCode: string;
  ItemName: string;
  shortName: string;
  price: number;
  variantId?: number;
  variantName?: string;
}


// Interface for table items (from Orders.tsx)
interface TableItem {
  tablemanagementid: string;
  table_name: string;
  hotel_name: string;
  outlet_name: string;
  status: number;
  created_by_id: string;
  created_date: string;
  updated_by_id: string;
  updated_date: string;
  outletid: string;
  hotelid: string;
  marketid: string;
  isActive: boolean;
  isCommonToAllDepartments: boolean;
  departmentid?: number;
  tableid: number;
}

// Interface for component props
interface OrderDetailsProps {
  tableId?: string | null;
  onChangeTable?: () => void;
  items: MenuItemState[];
  setItems: Dispatch<SetStateAction<MenuItemState[]>>;
  setSelectedTable: Dispatch<SetStateAction<string | null>>;
  invalidTable: string;
  setInvalidTable: Dispatch<SetStateAction<string>>;
  filteredTables: TableItem[];
  setSelectedDeptId: Dispatch<SetStateAction<number | null>>;
  setSelectedOutletId: Dispatch<SetStateAction<number | null>>;
  selectedDeptId: number | null; // Added: current selected department ID
  focusMode: boolean;
  setFocusMode: Dispatch<SetStateAction<boolean>>;
  triggerFocus: number;
  refreshItemsForTable: (tableIdNum: number) => Promise<void>;
  reverseQtyMode: boolean;
  setReverseQtyMode: Dispatch<SetStateAction<boolean>>;
  isBilled: boolean;
}


const OrderDetails: React.FC<OrderDetailsProps> = ({
  tableId,
  onChangeTable,
  items,
  setItems,
  setSelectedTable,
  invalidTable,
  setInvalidTable,
  filteredTables,
  setSelectedDeptId,
  setSelectedOutletId,
  selectedDeptId, // Destructure the selected department ID
  focusMode,
  setFocusMode,
  triggerFocus,
  refreshItemsForTable,
  reverseQtyMode,
  setReverseQtyMode,
  isBilled,
}) => {
  const [searchTable, setSearchTable] = useState<string>(tableId || '');
  const [searchCode, setSearchCode] = useState<string>('');
  const [searchName, setSearchName] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [filteredItems, setFilteredItems] = useState<CardItem[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [hasTyped, setHasTyped] = useState<boolean>(false);
  const [isTableInvalid, setIsTableInvalid] = useState<boolean>(false);
  const [cardItems, setCardItems] = useState<CardItem[]>([]);
  const [showNameDropdown, setShowNameDropdown] = useState<boolean>(false);
  const [selectedNameIndex, setSelectedNameIndex] = useState(-1);
  // Code dropdown state
  const [showCodeDropdown, setShowCodeDropdown] = useState<boolean>(false);
  // Store selected code/name result for qty confirmation
  const [selectedCodeResult, setSelectedCodeResult] = useState<CodeSearchResult | null>(null);
  const [selectedNameResult, setSelectedNameResult] = useState<CardItem | null>(null);
  const [selectedCodeIndex, setSelectedCodeIndex] = useState(-1);
  const [codeSearchResults, setCodeSearchResults] = useState<CodeSearchResult[]>([]);
  // Add state for name search results with variants
  const [nameSearchResults, setNameSearchResults] = useState<CodeSearchResult[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedItemGroup, setSelectedItemGroup] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]); // State for sidebar menu items

  // Variant modal state
  const [showVariantModal, setShowVariantModal] = useState<boolean>(false);
  const [selectedItemForVariant, setSelectedItemForVariant] = useState<CardItem | null>(null);
  const [itemVariants, setItemVariants] = useState<VariantOption[]>([]);

  const tableInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (triggerFocus > 0 && tableInputRef.current) {
      // When KOT is saved with Focus Mode ON, clear the table search and focus it.
      setSearchTable('');
      tableInputRef.current.focus();
      tableInputRef.current.select();
    }
  }, [triggerFocus]);

  // Global key event listener for F4, F5, F6
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'f4') {
        e.preventDefault();
        tableInputRef.current?.focus();
        tableInputRef.current?.select();
      } else if (key === 'f5') {
        e.preventDefault();
        codeInputRef.current?.focus();
        codeInputRef.current?.select();
      } else if (key === 'f6') {
        e.preventDefault();
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

// Sync searchTable state with tableId prop
  useEffect(() => {
    setSearchTable(tableId || '');
  }, [tableId]);

  // Auto-focus table input when NEW tableId arrives (table click opens page)
  useEffect(() => {
    if (tableId && tableInputRef.current) {
      // Small delay ensures input value/ref ready after prop change
      setTimeout(() => {
        tableInputRef.current?.focus();
        tableInputRef.current?.select();
      }, 100);
    }
  }, [tableId]);

  // Derive valid tables from filteredTables
  const validTables = useMemo(
    () =>
      filteredTables
        .filter((table) => table && table.table_name)
        .map((table) => table.table_name),
    [filteredTables]
  );

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Validate table input
  useEffect(() => {
    if (searchTable) {
      setHasTyped(true);
      const matchedTable = filteredTables.find(
        (table) => table.table_name.toLowerCase() === searchTable.toLowerCase()
      );
      setReverseQtyMode(false); // Turn off reverse mode on table change
      if (matchedTable) {
        setSelectedTable(searchTable);
        // setItems([]); // This was clearing items fetched by the parent component.
        setInvalidTable('');
        setIsTableInvalid(false);
        // Set selectedDeptId and selectedOutletId for tax calculation
        setSelectedDeptId(Number(matchedTable.departmentid));
        setSelectedOutletId(Number(matchedTable.outletid));

        const tableIdNum = Number(matchedTable.tableid ?? matchedTable.tablemanagementid);
        if (tableIdNum) {
          refreshItemsForTable(tableIdNum);
        }
      } else {
        setInvalidTable(searchTable);
        setIsTableInvalid(true);
        setItems([]);
      }
    } else if (hasTyped) {
      setReverseQtyMode(false); // Turn off reverse mode when clearing table
      setSelectedTable(null);
      setInvalidTable('');
      setIsTableInvalid(false);
      setHasTyped(false);
      setItems([]);
    }
  }, [searchTable, setSelectedTable, setInvalidTable, hasTyped, validTables, filteredTables, setSelectedDeptId, setSelectedOutletId, refreshItemsForTable, setItems, setReverseQtyMode]);

  // Fetch menu items for sidebar and card items using common MenuService API
  const fetchMenuItems = async (hotelid?: number, outletid?: number) => {
    try {
      setLoading(true);
      setError(null);

      // Use common MenuService API with optional filters
      const response = await MenuService.list({ hotelid, outletid });

      // Handle different response formats based on HttpClient interceptor
      const rawData = Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);
      // console.log('Fetched menu items:', rawData);
      setMenuItems(rawData);

      // Map fetched menu items to card items
      const mappedItems: CardItem[] = rawData
        .filter((item: any) => item.status === 1)
        .map((item: any) => ({
          userId: String(item.restitemid || item.menuid),
          itemCode: String(item.item_no),
          ItemName: item.item_name,
          shortName: item.short_name || '',
          price: item.price || 0,
          item_group_id: item.item_group_id,
          cardStatus: item.status === 1 ? '✅ Available' : '❌ Unavailable',
        }));
      setCardItems(mappedItems);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch menu items');
      // console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch menu and item groups
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchMenuItems(); // Fetch menu items for sidebar
        await fetchMenu(
          (data: MenuItem[]) => {
            const mappedItems: CardItem[] = data
              .filter((item) => item.status === 1)
              .map((item) => ({
                ItemID: item.restitemid || item.menuid,
                userId: String(item.menuid),
                itemCode: String(item.item_no),
                ItemName: item.item_name,
                shortName: item.short_name || '',
                price: item.price || 0,
                item_group_id: item.item_group_id,
                cardStatus: item.status === 1 ? '✅ Available' : '❌ Unavailable',
              }));
            setCardItems(mappedItems);
          },
          () => { }
        );
      } catch (error) {
        // console.error('Fetch error:', error);
        setCardItems([]);
        setError('Failed to fetch menu items');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Categorize items dynamically based on item groups
  // const itemCategories = useMemo(() => {
  //   const categories: { [key: string]: CardItem[] } = { All: cardItems };
  //   menuItems.forEach((item) => {
  //     if (item.item_group_id !== null && item.groupname) {
  //       const groupName = item.groupname;
  //       if (!categories[groupName]) {
  //         categories[groupName] = [];
  //       }
  //       const cardItem = cardItems.find((ci) => ci.userId === String(item.menuid));
  //       if (cardItem) {
  //         categories[groupName].push(cardItem);
  //       }
  //     }
  //   });
  //   return categories;
  // }, [cardItems, menuItems]);

  const allItems: CardItem[] = cardItems;

  // Toggle category dropdown (no longer needed for static categories)

  // Helper function to get department-specific price from menuItems
  const getDepartmentPrice = (itemId: string, deptId: number | null): number => {
    if (!deptId) return 0;
    const menuItem = menuItems.find((m: any) => String(m.restitemid) === itemId);
    if (menuItem && menuItem.department_details && menuItem.department_details.length > 0) {
      // Find the department detail matching the selected department
      const deptDetail = menuItem.department_details.find((d: any) =>
        d.departmentid === deptId
      );
      if (deptDetail) {
        return deptDetail.item_rate || 0;
      }
    }
    return 0;
  };

  // Helper function to get display price (department price if available, otherwise base price)
  const getDisplayPrice = (itemId: string, basePrice: number, deptId: number | null): number => {
    if (deptId) {
      const deptPrice = getDepartmentPrice(itemId, deptId);
      if (deptPrice > 0) {
        return deptPrice;
      }
    }
    return basePrice;
  };

  // Helper function to check if item has price for selected department
  const hasDepartmentPrice = (itemId: string, deptId: number | null): boolean => {
    if (!deptId) return true; // If no department selected, show all
    const price = getDepartmentPrice(itemId, deptId);
    return price > 0;
  };

  // Filter items based on search, selected item group, AND selected department
  const filterItems = useCallback(() => {
    let baseItems = selectedItemGroup !== null
      ? cardItems.filter(item => item.item_group_id === selectedItemGroup)
      : allItems;

    // Filter by department: only show items that have price set for selected department
    if (selectedDeptId) {
      baseItems = baseItems.filter(item => hasDepartmentPrice(item.userId, selectedDeptId));
    }

    return baseItems.filter((item) => {
      const matchesCode = searchCode
        ? item.itemCode.toLowerCase().includes(searchCode.toLowerCase())
        : true;
      const matchesName = searchName
        ? item.ItemName.toLowerCase().includes(searchName.toLowerCase()) ||
        item.shortName.toLowerCase().includes(searchName.toLowerCase())
        : true;
      return matchesCode && matchesName;
    });
  }, [searchCode, searchName, allItems, selectedItemGroup, selectedDeptId, menuItems]);

  // Filter dropdown items for code or name (with department filtering)


  useEffect(() => {
    setFilteredItems(filterItems());
  }, [filterItems]);

  // Handle input changes
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setSearchCode(code);

    // Start with all items and filter by department first
    let baseItems = selectedItemGroup !== null
      ? cardItems.filter(item => item.item_group_id === selectedItemGroup)
      : cardItems;

    // Filter by department: only show items that have price set for selected department
    if (selectedDeptId) {
      baseItems = baseItems.filter(item => hasDepartmentPrice(item.userId, selectedDeptId));
    }

    // Find all items that match the code (prefix match)
    const matchedItems = baseItems.filter((item) =>
      item.itemCode.toLowerCase().includes(code.toLowerCase())
    );

    // console.log('Code search:', code, 'Matched items:', matchedItems.length);
    // console.log('MenuItems sample:', menuItems.slice(0, 2));

    // Build code search results with variant priority logic
    const results: CodeSearchResult[] = [];

    matchedItems.forEach((item) => {
      const menuItem = menuItems.find((m: any) => String(m.restitemid) === item.userId);
      // console.log('Menu item for', item.itemCode, ':', menuItem?.department_details?.length, 'details');

      let hasValidVariants = false;
      const validVariants: VariantOption[] = [];

      if (menuItem && menuItem.department_details && menuItem.department_details.length > 0) {
        const deptDetails = selectedDeptId
          ? menuItem.department_details.filter((d: any) => d.departmentid === selectedDeptId)
          : menuItem.department_details;

        deptDetails.forEach((detail: any) => {
          if (detail.variant_value_id && detail.variant_value_name && detail.item_rate > 0) {
            validVariants.push({
              variant_value_id: detail.variant_value_id,
              value_name: detail.variant_value_name,
              price: detail.item_rate
            });
            hasValidVariants = true;
          }
        });
      }

      if (hasValidVariants) {
        const variantMap = new Map<number, VariantOption>();
        validVariants.forEach(v => variantMap.set(v.variant_value_id, v));
        variantMap.forEach((variant) => {
          results.push({
            type: 'variant',
            userId: item.userId,
            itemCode: item.itemCode,
            ItemName: item.ItemName,
            shortName: item.shortName,
            price: variant.price,
            variantId: variant.variant_value_id,
            variantName: variant.value_name,
          });
        });
      } else {
        results.push({
          type: 'base',
          userId: item.userId,
          itemCode: item.itemCode,
          ItemName: item.ItemName,
          shortName: item.shortName,
          price: getDisplayPrice(item.userId, item.price, selectedDeptId),
        });
      }
    });


    // console.log('Total results:', results.length);
    setCodeSearchResults(results.slice(0, 10)); // Limit to 10 results

    // Always show dropdown when typing and there are results
    if (code.length > 0 && results.length > 0) {
      setShowCodeDropdown(true);
    } else {
      setShowCodeDropdown(false);
    }
    setSelectedCodeIndex(-1);

    // Set search name if exact match found
    const exactMatch = matchedItems.find((item) => item.itemCode.toLowerCase() === code.toLowerCase());
    if (exactMatch) {
      setSearchName(exactMatch.ItemName);
    } else {
      setSearchName('');
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchName(value);
    setShowNameDropdown(!!value);
    setSelectedNameIndex(-1);

    // Build name search results including variants (department-wise)
    let baseItems = selectedItemGroup !== null
      ? cardItems.filter(item => item.item_group_id === selectedItemGroup)
      : cardItems;

    // Filter by department: only show items that have price set for selected department
    if (selectedDeptId) {
      baseItems = baseItems.filter(item => hasDepartmentPrice(item.userId, selectedDeptId));
    }

    // Find all items that match the name
    const matchedItems = baseItems.filter((item) =>
      item.ItemName.toLowerCase().includes(value.toLowerCase()) ||
      item.shortName.toLowerCase().includes(value.toLowerCase())
    );

    // Build name search results with variant priority logic
    const results: CodeSearchResult[] = [];

    matchedItems.forEach((item) => {
      const menuItem = menuItems.find((m: any) => String(m.restitemid) === item.userId);

      let hasValidVariants = false;
      const validVariants: VariantOption[] = [];

      if (menuItem && menuItem.department_details && menuItem.department_details.length > 0) {
        const deptDetails = selectedDeptId
          ? menuItem.department_details.filter((d: any) => d.departmentid === selectedDeptId)
          : menuItem.department_details;

        // Check for valid variants (variant_value_id, name, and price > 0)
        deptDetails.forEach((detail: any) => {
          if (detail.variant_value_id && detail.variant_value_name && detail.item_rate > 0) {
            validVariants.push({
              variant_value_id: detail.variant_value_id,
              value_name: detail.variant_value_name,
              price: detail.item_rate
            });
            hasValidVariants = true;
          }
        });
      }

      if (hasValidVariants) {
        // Show only variants if valid ones exist
        const variantMap = new Map<number, VariantOption>();
        validVariants.forEach(v => variantMap.set(v.variant_value_id, v));
        variantMap.forEach((variant) => {
          results.push({
            type: 'variant',
            userId: item.userId,
            itemCode: item.itemCode,
            ItemName: item.ItemName,
            shortName: item.shortName,
            price: variant.price,
            variantId: variant.variant_value_id,
            variantName: variant.value_name,
          });
        });
      } else {
        // Show base item if no valid variants
        results.push({
          type: 'base',
          userId: item.userId,
          itemCode: item.itemCode,
          ItemName: item.ItemName,
          shortName: item.shortName,
          price: getDisplayPrice(item.userId, item.price, selectedDeptId),
        });
      }
    });


    setNameSearchResults(results.slice(0, 10));

    if (value === '') {
      setSearchCode('');
    } else {
      const matchedItem = allItems.find(
        (item) =>
          item.ItemName.toLowerCase() === value.toLowerCase() ||
          item.shortName.toLowerCase() === value.toLowerCase()
      );
      if (matchedItem) {
        setSearchCode(matchedItem.itemCode);
      }
    }
  };

  // Handle item selection
  const handleCodeSelect = (item: CardItem) => {
    setSearchCode(item.itemCode);
    setSearchName(item.ItemName);
    setShowCodeDropdown(false);
    setSelectedCodeIndex(-1);
    // Store selected result for qty confirmation
    setSelectedCodeResult({
      type: 'base',
      userId: item.userId,
      itemCode: item.itemCode,
      ItemName: item.ItemName,
      shortName: item.shortName,
      price: item.price,
    });
    if (quantityInputRef.current) {
      quantityInputRef.current.focus();
      quantityInputRef.current.select();
    }
  };

  // Handle code selection with variant support
  // Only set values and focus on qty - don't add item yet
  const handleCodeSelectWithVariant = (result: CodeSearchResult) => {
    setSearchCode(result.itemCode);
    setSearchName(result.ItemName);
    setShowCodeDropdown(false);
    setSelectedCodeIndex(-1);

    // Store the selected result for later use when qty is confirmed
    setSelectedCodeResult(result);

    // Focus on qty field - don't add item yet
    if (quantityInputRef.current) {
      quantityInputRef.current.focus();
      quantityInputRef.current.select();
    }
  };

  // Handle name selection with variant support
  const handleNameSelectWithVariant = (result: CodeSearchResult) => {
    setSearchName(result.ItemName);
    setSearchCode(result.itemCode);
    setShowNameDropdown(false);
    setSelectedNameIndex(-1);

    // Store the selected result for later use when qty is confirmed
    setSelectedNameResult(null); // Clear the old CardItem result
    setSelectedCodeResult(result); // Use the CodeSearchResult like code dropdown

    // Focus on qty field - don't add item yet
    if (quantityInputRef.current) {
      quantityInputRef.current.focus();
      quantityInputRef.current.select();
    }
  };

  const handleNameSelect = (item: CardItem) => {
    setSearchName(item.ItemName);
    setSearchCode(item.itemCode);
    setShowNameDropdown(false);
    setSelectedNameIndex(-1);
    // Store selected result for qty confirmation
    setSelectedNameResult(item);
    if (quantityInputRef.current) {
      quantityInputRef.current.focus();
      quantityInputRef.current.select();
    }
  };

  // Handle keyboard events for code input
  const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showCodeDropdown && codeSearchResults.length > 0) {
        setSelectedCodeIndex((prev) => (prev < codeSearchResults.length - 1 ? prev + 1 : prev));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showCodeDropdown && codeSearchResults.length > 0) {
        setSelectedCodeIndex((prev) => (prev > 0 ? prev - 1 : -1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedCodeIndex >= 0 && showCodeDropdown && codeSearchResults[selectedCodeIndex]) {
        const selected = codeSearchResults[selectedCodeIndex];
        handleCodeSelectWithVariant(selected);
      } else {
        // Try exact match
        const matchedItem = cardItems.find((item) => item.itemCode.toLowerCase() === searchCode.toLowerCase());
        if (matchedItem) {
          handleCodeSelect(matchedItem);
        }
      }
    } else if (e.key === 'Escape') {
      setShowCodeDropdown(false);
      setSelectedCodeIndex(-1);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showNameDropdown && nameSearchResults.length > 0) {
        setSelectedNameIndex((prev) => (prev < nameSearchResults.length - 1 ? prev + 1 : prev));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showNameDropdown && nameSearchResults.length > 0) {
        setSelectedNameIndex((prev) => (prev > 0 ? prev - 1 : -1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedNameIndex >= 0 && showNameDropdown && nameSearchResults[selectedNameIndex]) {
        const selectedResult = nameSearchResults[selectedNameIndex];
        handleNameSelectWithVariant(selectedResult);
      } else if (searchName) {
        const matchedItem = cardItems.find(
          (item) =>
            item.ItemName.toLowerCase() === searchName.toLowerCase() ||
            item.shortName.toLowerCase() === searchName.toLowerCase()
        );
        if (matchedItem) {
          handleNameSelect(matchedItem);
        }
      }
    } else if (e.key === 'Escape') {
      setShowNameDropdown(false);
      setSelectedNameIndex(-1);
    }
  };

  const handleTableKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (codeInputRef.current) {
        codeInputRef.current.focus();
        codeInputRef.current.select();
      }
    }
  };

  const handleQuantityKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (searchName || searchCode || selectedCodeResult || selectedNameResult)) {
      e.preventDefault();
      const qty = parseInt(quantity) || 1;

      // Use stored selected results if available, otherwise fallback to search
      if (selectedCodeResult) {
        // Code dropdown item was selected
        if (selectedCodeResult.type === 'variant' && selectedCodeResult.variantId && selectedCodeResult.variantName) {
          // Variant item - use the price from the variant (already department-specific)
          handleAddItem({
            id: Number(selectedCodeResult.userId),
            name: selectedCodeResult.ItemName,
            price: selectedCodeResult.price,
            isBilled: 0,
            isNCKOT: 0,
            NCName: '',
            NCPurpose: '',
            variantId: selectedCodeResult.variantId,
            variantName: selectedCodeResult.variantName
          }, qty);
        } else {
          // Base item - check for variants or add directly with department price
          const cardItem = cardItems.find(item => item.userId === selectedCodeResult.userId);
          if (cardItem) {
            handleShowVariantModalForQty(cardItem, qty);
          }
        }
      } else if (selectedNameResult) {
        // Name dropdown item was selected
        const cardItem = cardItems.find(item => item.userId === selectedNameResult.userId);
        if (cardItem) {
          handleShowVariantModalForQty(cardItem, qty);
        }
      } else {
        // Fallback: try to find from search text
        const matchedItem = cardItems.find(
          (item) =>
            item.ItemName.toLowerCase() === searchName.toLowerCase() ||
            item.itemCode.toLowerCase() === searchCode.toLowerCase()
        );
        if (matchedItem) {
          handleShowVariantModalForQty(matchedItem, qty);
        }
      }

      // Clear all states after adding
      setSearchCode('');
      setSearchName('');
      setQuantity('1');
      setShowCodeDropdown(false);
      setShowNameDropdown(false);
      setSelectedNameIndex(-1);
      setSelectedCodeIndex(-1);
      setCodeSearchResults([]);  // Clear search results
      setNameSearchResults([]);  // Clear name search results
      setSelectedCodeResult(null);

      if (codeInputRef.current) {
        codeInputRef.current.focus();
      }
    }
  };

  // Handle variant modal from qty field (separate function)
  const handleShowVariantModalForQty = (item: CardItem, qty: number) => {
    const menuItem = menuItems.find((m: any) => String(m.restitemid) === item.userId);
    if (menuItem && menuItem.department_details && menuItem.department_details.length > 0) {
      // Filter variants by selected department
      const deptDetails = selectedDeptId
        ? menuItem.department_details.filter((d: any) => d.departmentid === selectedDeptId)
        : menuItem.department_details;

      const variantMap = new Map<number, VariantOption>();
      deptDetails.forEach((detail: any) => {
        if (detail.variant_value_id && detail.variant_value_name) {
          variantMap.set(detail.variant_value_id, {
            variant_value_id: detail.variant_value_id,
            value_name: detail.variant_value_name,
            price: detail.item_rate || 0
          });
        }
      });
      const variants = Array.from(variantMap.values());
      if (variants.length > 0) {
        // Store item and qty for variant selection, then show modal
        setSelectedItemForVariant(item);
        setItemVariants(variants);
        // Store qty to use when variant is selected
        setQuantity(String(qty));
        setShowVariantModal(true);
      } else {
        // No variants, add directly with department price
        handleAddItem({ id: Number(item.userId), name: item.ItemName, price: getDisplayPrice(item.userId, item.price, selectedDeptId), isBilled: 0, isNCKOT: 0, NCName: '', NCPurpose: '' }, qty);
      }
    } else {
      // No department_details, add directly with base price
      handleAddItem({ id: Number(item.userId), name: item.ItemName, price: getDisplayPrice(item.userId, item.price, selectedDeptId), isBilled: 0, isNCKOT: 0, NCName: '', NCPurpose: '' }, qty);
    }
  };

  // Add item to order
  const handleAddItem = (newItem: Omit<MenuItemState, 'qty'>, qty: number = 1) => {
    if (reverseQtyMode) {
      return; // Prevent adding new items in reverse qty mode
    }
    // Always find and update quantity for existing new items with same id AND variant.
    // This prevents merging different variants (Half, Full, Large) of the same item.
    setItems((prevItems) => {
      const existingNewItemIndex = prevItems.findIndex(
        (item) => item.id === newItem.id && item.variantId === newItem.variantId && item.isNew
      );

      if (existingNewItemIndex > -1) {
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingNewItemIndex];
        updatedItems[existingNewItemIndex] = {
          ...existingItem,
          qty: existingItem.qty + qty,
        };
        return updatedItems;
      } else {
        return [...prevItems, { ...newItem, qty, isNew: true }];
      }
    });
  };

  // Delete all items
  const handleDeleteAll = () => {
    window.location.reload();
  };

  // Handle customer modal
  const handleShowCustomerModal = () => setShowCustomerModal(true);
  const handleCloseCustomerModal = () => setShowCustomerModal(false);

  // Handle variant modal
  const handleShowVariantModal = (item: CardItem) => {
    setSelectedItemForVariant(item);
    // Get variants from menuItems based on the item's restitemid
    const menuItem = menuItems.find((m: any) => String(m.restitemid) === item.userId);
    if (menuItem && menuItem.department_details && menuItem.department_details.length > 0) {
      // Filter variants by selected department
      const deptDetails = selectedDeptId
        ? menuItem.department_details.filter((d: any) => d.departmentid === selectedDeptId)
        : menuItem.department_details;

      // Extract unique variants from department_details
      const variantMap = new Map<number, VariantOption>();
      deptDetails.forEach((detail: any) => {
        if (detail.variant_value_id && detail.variant_value_name) {
          variantMap.set(detail.variant_value_id, {
            variant_value_id: detail.variant_value_id,
            value_name: detail.variant_value_name,
            price: detail.item_rate || 0
          });
        }
      });
      const variants = Array.from(variantMap.values());
      setItemVariants(variants);
      if (variants.length > 0) {
        setShowVariantModal(true);
      } else {
        // No variants, add directly with department price
        handleAddItem({ id: Number(item.userId), name: item.ItemName, price: getDisplayPrice(item.userId, item.price, selectedDeptId), isBilled: 0, isNCKOT: 0, NCName: '', NCPurpose: '' }, parseInt(quantity) || 1);
      }
    } else {
      // No department_details, add directly with department price
      handleAddItem({ id: Number(item.userId), name: item.ItemName, price: getDisplayPrice(item.userId, item.price, selectedDeptId), isBilled: 0, isNCKOT: 0, NCName: '', NCPurpose: '' }, parseInt(quantity) || 1);
    }
  };

  const handleCloseVariantModal = () => {
    setShowVariantModal(false);
    setSelectedItemForVariant(null);
    setItemVariants([]);
  };

  const handleVariantSelect = (variant: VariantOption) => {
    if (selectedItemForVariant) {
      handleAddItem({
        id: Number(selectedItemForVariant.userId),
        name: selectedItemForVariant.ItemName,
        price: variant.price,
        isBilled: 0,
        isNCKOT: 0,
        NCName: '',
        NCPurpose: '',
        variantId: variant.variant_value_id,
        variantName: variant.value_name
      }, parseInt(quantity) || 1);
    }
    handleCloseVariantModal();
  };

  // Optional: billing trigger here if this component hosts a Billing action later
  // const handleBilling = async (billId?: number, total?: number) => {
  //   if (!billId || !total) return;
  //   try {
  //     await settleBill(billId, [{ PaymentType: 'Cash', Amount: total }]);
  //   } catch (err) {}
  // };

  return (
    <div className="container-fluid vh-100 d-flex flex-column p-0">
      <div className="row flex-grow-1">
        <div className="col-12 d-flex flex-column">
          <div className="row">
            <div className="col-12 p-2 border-bottom w-100">
              <nav className="navbar navbar-expand-lg navbar-light">
                <div className="container-fluid px-2 position-relative">
                  <div className="d-flex align-items-center">

                    {/* Left Side */}
                    <button
                      className="navbar-toggler"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#navbarNav"
                    >
                      <span className="navbar-toggler-icon"></span>
                    </button>

                    {/* Center Controls */}
                    <div className="position-absolute start-50 translate-middle-x d-flex align-items-center justify-content-center gap-3 flex-wrap">

                      <button
                        className="btn btn-sm btn-outline-primary px-3"
                        onClick={onChangeTable}
                      >
                        <i className="bi bi-table me-1"></i>
                        Change Table
                      </button>

                      <button
                        className="btn btn-sm btn-outline-success px-3"
                        onClick={handleShowCustomerModal}
                      >
                        <i className="bi bi-person-plus me-1"></i>
                        Add Customer
                      </button>

                      <button
                        className="btn btn-sm btn-outline-warning px-3"
                        onClick={() => window.location.reload()}
                      >
                        <i className="bi bi-arrow-clockwise me-1"></i>
                        Refresh
                      </button>

                      {/* Focus Mode */}
                      <div className="form-check form-switch ms-2 d-flex align-items-center">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="focusModeSwitch"
                          checked={focusMode}
                          onChange={(e) => setFocusMode(e.target.checked)}
                        />
                        <label className="form-check-label small ms-1" htmlFor="focusModeSwitch">
                          Focus Mode
                        </label>
                      </div>

                    </div>

                    {/* Right Side Icons */}
                    <div className="d-flex align-items-center gap-3 ms-auto">

                      <button className="btn btn-light btn-sm">
                        <i className="bi bi-search" style={{ fontSize: "1.2rem" }}></i>
                      </button>

                      <button className="btn btn-light btn-sm">
                        <i className="bi bi-person" style={{ fontSize: "1.2rem" }}></i>
                      </button>

                    </div>

                  </div>
                </div>
              </nav>
            </div>
          </div>

          <div className="row">
            <div className="col-12 p-2 border-bottom w-100" style={{ backgroundColor: 'transparent' }}>
              <style>
                {`
                  .no-hover:hover, .no-hover input:hover, .no-hover button:hover {
                    background-color: inherit !important;
                    border-color: rgba(65, 149, 246, 1) !important;
                    box-shadow: none !important;
                    transform: none !important;
                  }
                  .rounded-search {
                    border-radius: 20px !important;
                    position: relative;
                  }
                  .rounded-search .form-control {
                    border-radius: 20px !important;
                    background-color: #f4f4f4;
                    border: 1px solid #ced4da;
                    padding: 0.5rem;
                    fontSize: 0.875rem;
                    width: 150px;
                    height: 32px;
                    box-sizing: border-box;
                  }
                  .rounded-button {
                    border-radius: 20px !important;
                  }
                  .dropdown-menu {
                    width: 100%;
                    max-height: 200px;
                    overflow-y: auto;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                  }
                  .dropdown-item {
                    font-size: 0.875rem;
                    padding: 0.5rem 1rem;
                  }
                  .dropdown-item:hover, .dropdown-item.selected {
                    background-color: #e9ecef;
                  }
                  @media (max-width: 768px) {
                    .search-row {
                      flex-wrap: nowrap;
                      overflow-x: auto;
                      padding-bottom: 8px;
                    }
                    .search-row .input-group {
                      min-width: 120px;
                      margin-right: 8px;
                    }
                    .search-row .btn {
                      white-space: nowrap;
                    }
                    .rounded-search .form-control {
                      width: 120px;
                    }
                    .dropdown-menu {
                      width: 120px;
                    }
                  }
                `}
              </style>
              <div className="d-flex flex-nowrap justify-content-start gap-1 no-hover search-row align-items-start">
                <div style={{ maxWidth: '100px', minHeight: '38px' }}>
                  <div className="input-group rounded-search">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Table"
                      value={searchTable}
                      onChange={(e) => setSearchTable(e.target.value)}
                      onKeyDown={handleTableKeyDown}
                      ref={tableInputRef}
                      disabled={reverseQtyMode && isBilled}
                      style={{
                        maxWidth: '100px',
                        minHeight: '60px',
                        fontSize: '1.2rem',
                        border: '2px solid #4A90E2',
                        backgroundColor: '#E6F3FA',
                      }}
                    />
                  </div>
                  {isTableInvalid && (
                    <div className="text-danger small text-center mt-1">Invalid Table</div>
                  )}
                </div>
                <div style={{ maxWidth: '100px', position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control rounded-pill"
                    placeholder="Code"
                    value={searchCode}
                    onChange={handleCodeChange}
                    onKeyDown={handleCodeKeyDown}
                    onFocus={() => {
                      // Show dropdown immediately when focusing on the input if there's search text or results
                      if (searchCode || codeSearchResults.length > 0) {
                        setShowCodeDropdown(true);
                      }
                    }}
                    onBlur={(e) => {
                      const relatedTarget = e.relatedTarget as HTMLElement;
                      if (!relatedTarget?.closest('.code-dropdown-item')) {
                        setTimeout(() => {
                          setShowCodeDropdown(false);
                          setSelectedCodeIndex(-1);
                        }, 200);
                      }
                    }}
                    ref={codeInputRef}
                    disabled={reverseQtyMode && isBilled}
                    style={{ minHeight: '48px', width: '100%', paddingRight: '24px', borderRadius: '30px', border: '1px solid #ced4da', }}
                  />
                  {showCodeDropdown && codeSearchResults.length > 0 && (
                    <div
                      className="code-dropdown"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        zIndex: 1000,
                        backgroundColor: '#fff',
                        border: '1px solid #ced4da',
                        borderRadius: '0 0 8px 8px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        maxHeight: '150px',
                        overflowY: 'auto',
                        width: '100px',
                        marginTop: '0px',
                      }}
                    >
                      {codeSearchResults.slice(0, 4).map((result, index) => (
                        <div
                          key={`${result.userId}-${result.variantId || 'base'}`}
                          className="code-dropdown-item"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleCodeSelectWithVariant(result);
                          }}
                          style={{
                            cursor: 'pointer',
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            backgroundColor: index === selectedCodeIndex ? '#e9ecef' : 'transparent',
                            borderBottom: '1px solid #f0f0f0',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          onMouseEnter={() => setSelectedCodeIndex(index)}
                        >
                          <strong>{result.ItemName}</strong>
                          {result.type === 'variant' && (
                            <span style={{ color: '#0d6efd', fontSize: '0.65rem' }}>
                              ({result.variantName})
                            </span>
                          )}
                          <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                            ₹{result.type === 'base' ? getDisplayPrice(result.userId, result.price, selectedDeptId).toFixed(0) : result.price.toFixed(0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search Name"
                    value={searchName}
                    onChange={handleNameChange}
                    onKeyDown={handleNameKeyDown}
                    autoComplete="off"
                    onFocus={() => setShowNameDropdown(true)}
                    onBlur={(e) => {
                      const relatedTarget = e.relatedTarget as HTMLElement;
                      if (!relatedTarget?.closest('.dropdown-item')) {
                        setTimeout(() => {
                          setShowNameDropdown(false);
                          setSelectedNameIndex(-1);
                        }, 100);
                      }
                    }}
                    ref={nameInputRef}
                    disabled={reverseQtyMode && isBilled}
                    style={{
                      borderRadius: '20px',
                      height: '48px',
                      padding: '10px 16px',
                      fontSize: '16px',
                      border: '1px solid #ced4da',
                    }}
                  />
                  {showNameDropdown && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        zIndex: 1000,
                        backgroundColor: '#fff',
                        border: '1px solid #ced4da',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        width: '100%',
                      }}
                    >
                      {nameSearchResults
                        .filter((result) => result.ItemName !== searchName)
                        .slice(0, 7)
                        .map((result, index) => (
                          <div
                            key={`${result.userId}-${result.variantId || 'base'}`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleNameSelectWithVariant(result);
                            }}
                            className={`dropdown-item ${index === selectedNameIndex ? 'selected' : ''}`}
                            style={{
                              cursor: 'pointer',
                              fontSize: '1rem',
                              backgroundColor: index === selectedNameIndex ? '#e9ecef' : 'transparent',
                            }}
                            onMouseEnter={() => setSelectedNameIndex(index)}
                          >
                            <strong>{result.ItemName}</strong>
                            {result.type === 'variant' && (
                              <span style={{ color: '#0d6efd', fontSize: '0.875rem' }}>
                                ({result.variantName})
                              </span>
                            )}
                            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                              {' | '}{result.shortName}{' | '}{result.itemCode}{' | '}₹{result.price.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      {nameSearchResults.length === 0 && (
                        <div className="dropdown-item text-muted">No matches found</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="input-group rounded-search" style={{ maxWidth: '100px' }}>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Qty"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    onKeyPress={handleQuantityKeyPress}
                    min="1"
                    ref={quantityInputRef}
                    disabled={reverseQtyMode && isBilled}
                    style={{ maxWidth: '100px', minHeight: '48px' }}
                  />
                </div>
                <button
                  className="btn btn-sm btn-outline-danger rounded-button px-2"
                  onClick={handleDeleteAll}
                  style={{ minWidth: '80px', height: '48px' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          <div className="d-flex flex-column flex-lg-row flex-grow-1">
            <Offcanvas
              show={showSidebar}
              onHide={() => setShowSidebar(false)}
              responsive="lg"
              placement="start"
              className="bg-white shadow-sm border-end"
              style={{ width: '210px', minWidth: '210px', maxWidth: '210px', overflowY: 'auto' }}
            >
              <Offcanvas.Header closeButton className="border-bottom">
                <Offcanvas.Title as="h6" className="fw-bold mb-0">Item Groups</Offcanvas.Title>
              </Offcanvas.Header>
              <Offcanvas.Body className="p-3" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
                {loading ? (
                  <p className="text-muted">Loading item groups...</p>
                ) : error ? (
                  <p className="text-muted">Error: {error}</p>
                ) : menuItems.length === 0 ? (
                  <p className="text-muted">No item groups available.</p>
                ) : (
                  <Table striped bordered hover size="sm" style={{ marginBottom: 0, tableLayout: 'fixed', width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '100%', padding: '8px', backgroundColor: '#f8f9fa', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Item Group</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        style={{ backgroundColor: !cardItems.length ? '#e9ecef' : 'transparent', color: '#2d3748' }}
                        onClick={() => {
                          setSelectedItemGroup(null);
                          setShowSidebar(false);
                        }}
                      >
                        <td style={{ padding: '8px', verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>All</td>
                      </tr>
                      {Array.from(new Set(menuItems
                        .filter((item) => item.item_group_id !== null)
                        .map(item => item.item_group_id as number)))
                        .map(groupId => {
                          const groupItems = menuItems.filter(item => item.item_group_id === groupId);
                          const groupName = groupItems[0].groupname || `Group ${groupId}`;
                          return (
                            <tr
                              key={groupId}
                              style={{ backgroundColor: 'transparent', color: '#2d3748' }}
                              onClick={() => {
                                setSelectedItemGroup(groupId);
                                setShowSidebar(false);
                              }}
                            >
                              <td style={{ padding: '8px', verticalAlign: 'middle', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {groupName}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </Table>
                )}
              </Offcanvas.Body>
            </Offcanvas>

            <div className={`p-3 ${isMobile ? 'col-12' : 'col-12 col-lg-9'}`} style={{ backgroundColor: 'transparent' }}>
              <div className="flex-grow-1 p-3">
                <div style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto', paddingRight: '10px' }}>
                  <Row xs={1} sm={2} md={3} lg={4} className="g-3">
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item, index) => (
                        <Col key={index}>
                          <Card
                            className="shadow-sm border-0 h-100"
                            style={{
                              borderRadius: '12px',
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              minHeight: '120px',
                            }}
                            onClick={() => !reverseQtyMode && handleShowVariantModal(item)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-4px)';
                              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                            }}
                          >
                            <Card.Body className="d-flex flex-column p-2 p-md-3">
                              <Card.Title
                                className="mb-1"
                                style={{ fontSize: '14px', fontWeight: '600', color: '#1a202c' }}
                              >
                                {item.ItemName}
                              </Card.Title>
                              <Card.Text style={{ fontSize: '12px', color: '#6b7280' }}>
                                {item.itemCode} | {item.shortName}
                              </Card.Text>
                              <Card.Text style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>
                                ₹{getDisplayPrice(item.userId, item.price, selectedDeptId).toFixed(2)}
                              </Card.Text>
                              <Card.Text style={{ fontSize: '12px', color: '#6b7280' }}>
                                {item.cardStatus}
                              </Card.Text>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))
                    ) : (
                      <Col>
                        <p className="text-center">No items found</p>
                      </Col>
                    )}
                  </Row>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        show={showCustomerModal}
        onHide={handleCloseCustomerModal}
        size="xl"
        aria-labelledby="customer-modal-title"
        centered
        backdrop="static"
        keyboard={false}
        dialogClassName="compact-modal"
      >
        <Modal.Header closeButton style={{ padding: '0.5rem', margin: 0 }} />
        <Modal.Body style={{ padding: '0px', maxHeight: '780px', overflowY: 'auto' }}>
          <CustomerModal />
        </Modal.Body>
        <Modal.Footer style={{ padding: '0.5rem', margin: 0 }}>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={handleCloseCustomerModal}
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
          >
            Close
          </button>
        </Modal.Footer>
      </Modal>

      {/* Variant Selection Modal */}
      <VariantModal
        show={showVariantModal}
        onHide={handleCloseVariantModal}
        itemName={selectedItemForVariant?.ItemName || ''}
        variants={itemVariants}
        onSelectVariant={handleVariantSelect}
      />
    </div>
  );
};


export default OrderDetails;
import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Row, Col,  Button, Card, Modal } from 'react-bootstrap';
import { FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';
import Select from 'react-select';
import FormikTextInput from '@/components/Common/FormikTextInput';
import FormSelect from '@/components/Common/FormikSelect';
import FormModal from '@/components/Common/models/FormModal';
import { toast } from 'react-hot-toast';
import { useAuthContext } from '@/common/context/useAuthContext';

// API Services
import GuestService from '@/common/hotel/guest';
import RoomCategoryService from '@/common/hotel/roomCategoryService';
import taxApi from '@/common/hotel/taxes';
import GuestTypeService from '@/common/hotel/guestType';
import ReservationService from '@/common/hotel/reservation';
import BookedByContactService from '@/common/hotel/bookedByContacts';
import CountryService from '@/common/api/countries';
import StateService from '@/common/api/states';
import CityService, { City } from '@/common/api/cities';
import GuestForm from '../Guest/GuestForm';
import BookedByForm, { BookedBy } from './BookedByForm';

// Helper function to format date to YYYY-MM-DD without timezone shift
const formatDateToYMD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to parse date string without timezone shift
const parseDateSafe = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Helper function to format numbers to 2 decimal places
const formatToTwoDecimals = (value: any): string => {
  if (value === null || value === undefined) return '0.00';
  const num = Number(value);
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
};

const safeToFixed = (value: any, digits: number = 2): string => {
  if (value === null || value === undefined) return '0';
  const num = Number(value);
  if (isNaN(num)) return '0';
  return num.toFixed(digits);
};

const round2 = (num: number): number => Math.round((num + Number.EPSILON) * 100) / 100;

interface Option {
  label: string;
  value: string | number;
}

interface NumericOption {
  label: string;
  value: number;
}

interface RoomRow {
  id: string;
  guestId: number;
  guestName: string;
  roomCategoryId: number;
  roomCategoryName: string;
  convertedCategoryId: number | null;
  convertedCategoryName: string | null;
  adult: number;
  pax: number;
  exPax: number;
  childPaid: number;
  childUnpaid: number;
  driver: number;
  total_rooms: number;
  arrivalDate: string;
  arrivalTime: string;
  departureDate: string;
  departureTime: string;
  nights: number;
  rate: number;
  discountPercent: number;
  discountAmt: number;
  taxPercent: number;
  taxAmount: number;
  exPaxPrice: number;
  exPaxTaxPercent: number;
  exPaxTax: number;
  exPaxTotal: number;
  childPrice: number;
  childTaxPercent: number;
  childTax: number;
  childTotal: number;
  driverPrice: number;
  driverTaxPercent: number;
  driverTax: number;
  driverTotal: number;
  totalAmount: number;
}

type BookedByWithId = BookedBy & { booked_by_id: number };

const pickupDropOptions: Option[] = [
  { label: 'Airport', value: 'Airport' },
  { label: 'Railway Station', value: 'Railway Station' },
  { label: 'Bus Stand', value: 'Bus Stand' },
  { label: 'City Center', value: 'City Center' },
  { label: 'Hotel', value: 'Hotel' },
];

const getTariffForPax = (
  tariffs: Array<{ no_of_pax: number; room_tariff: number; tax_type?: string | number; is_tax_applicable?: number }>,
  adultCount: number,
): { pax: number; exPax: number; tariff: number; taxType?: string | number; isTaxApplicable: number } => {
  if (!tariffs || tariffs.length === 0) return { pax: 0, exPax: 0, tariff: 0, taxType: undefined, isTaxApplicable: 0 };

  const sorted = [...tariffs]
    .map((t) => ({
      no_of_pax: Number(t.no_of_pax),
      room_tariff: Number(t.room_tariff),
      tax_type: t.tax_type,
      is_tax_applicable: Number(t.is_tax_applicable ?? 0),
    }))
    .filter((t) => t.no_of_pax > 0)
    .sort((a, b) => a.no_of_pax - b.no_of_pax);

  if (sorted.length === 0) return { pax: 0, exPax: 0, tariff: 0, taxType: undefined, isTaxApplicable: 0 };

  // Exact match
  const exact = sorted.find((t) => t.no_of_pax === adultCount);
  if (exact) {
    return { pax: exact.no_of_pax, exPax: 0, tariff: exact.room_tariff, taxType: exact.tax_type, isTaxApplicable: exact.is_tax_applicable };
  }

  // If adults < minimum pax → use minimum tariff, pax = min, exPax = 0
  if (adultCount <= sorted[0].no_of_pax) {
    return { pax: sorted[0].no_of_pax, exPax: 0, tariff: sorted[0].room_tariff, taxType: sorted[0].tax_type, isTaxApplicable: sorted[0].is_tax_applicable };
  }

  // If adults > maximum pax → use max tariff, exPax = adults - maxPax
  const maxTariff = sorted[sorted.length - 1];
  if (adultCount > maxTariff.no_of_pax) {
    return {
      pax: maxTariff.no_of_pax,
      exPax: adultCount - maxTariff.no_of_pax,
      tariff: maxTariff.room_tariff,
      taxType: maxTariff.tax_type,
      isTaxApplicable: maxTariff.is_tax_applicable,
    };
  }

  // Adults falls between two tariff bands → use the largest pax <= adults
  let best = sorted[0];
  for (const t of sorted) {
    if (t.no_of_pax <= adultCount) best = t;
  }
  return {
    pax: best.no_of_pax,
    exPax: adultCount - best.no_of_pax,
    tariff: best.room_tariff,
    taxType: best.tax_type,
    isTaxApplicable: best.is_tax_applicable,
  };
};

const HotelReservation = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthContext();
  const hotelId = user?.hotelid;
  const isEditing = Boolean(id);

  // ---------- State Declarations ----------
  const [guests, setGuests] = useState<Array<{ guest_id: number; name: string; mobile: string }>>([]);
  const [guestTypes, setGuestTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [roomCategories, setRoomCategories] = useState<
    Array<{ room_category_id: number; category_name: string; pax?: number }>
  >([]);
  const [taxList, setTaxList] = useState<
    Array<{ hotel_taxid: number; hotel_tax_value?: number; hotel_cgst?: number; hotel_sgst?: number; hotel_igst?: number; hotel_cess?: number }>
  >([]);

  const [loadingGuestTypes, setLoadingGuestTypes] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [searchingGuests, setSearchingGuests] = useState(false);

  const [categoryDetailsMap, setCategoryDetailsMap] = useState<Map<number, any>>(new Map());
  const [categoryModeChargesMap, setCategoryModeChargesMap] = useState<Map<number, any[]>>(new Map());
  const [categoryStandardPaxMap, setCategoryStandardPaxMap] = useState<Map<number, number>>(new Map());

  const [roomRows, setRoomRows] = useState<RoomRow[]>([]);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const [showGuestModal, setShowGuestModal] = useState(false);
  const [savingGuest, setSavingGuest] = useState(false);

  const [showBookedByModal, setShowBookedByModal] = useState(false);
  const [bookedBy, setBookedBy] = useState<BookedByWithId | null>(null);
  const [bookedByList, setBookedByList] = useState<BookedByWithId[]>([]);

  // Country / State / City master lists for the "Booked By" popup dropdowns
  const [countries, setCountries] = useState<Array<{ countryid: number; country_name: string }>>([]);
  const [states, setStates] = useState<Array<{ stateid: number; state_name: string; countryid: number }>>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const bookedByFormRef = useRef<any>(null);

  // ==================== RESPONSIVE LAYOUT STAGE (zoom-aware) ====================
  // Mobile: 320-767 | Tablet: 768-1023 | Laptop: 1024-1439 | Desktop: 1440-1919 | XL: 1920+
  type LayoutStage = 'desktop' | 'laptop' | 'tablet' | 'mobile' | 'xl'
  const [layoutStage, setLayoutStage] = useState<LayoutStage>('desktop')

  // ==================== MOBILE/TABLET TAB NAVIGATION ====================
  // Mobile AND Tablet: same 2 tabs (Guest & Reservation, Room & Booking)
  type MobileTab = 'guest' | 'room'
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('guest')
  const mobileTabs: { key: MobileTab; label: string; icon: string }[] = [
    { key: 'guest', label: 'Guest Info', icon: 'fi fi-rr-user' },
    { key: 'room', label: 'Room & Booking', icon: 'fi fi-rr-bed-alt' },
  ]
  const mobileTabIndex = mobileTabs.findIndex((t) => t.key === activeMobileTab)
  const mobileTabProgress = Math.round(((mobileTabIndex + 1) / mobileTabs.length) * 100)

  useEffect(() => {
    const stageRank: Record<LayoutStage, number> = {
      xl: 0,
      desktop: 1,
      laptop: 2,
      tablet: 3,
      mobile: 4,
    }

    const computeStage = () => {
      const innerW = window.innerWidth

      let widthStage: LayoutStage = 'xl'
      if (innerW < 768) widthStage = 'mobile'
      else if (innerW < 1024) widthStage = 'tablet'
      else if (innerW < 1440) widthStage = 'laptop'
      else if (innerW < 1920) widthStage = 'desktop'
      else widthStage = 'xl'

      let zoomStage: LayoutStage = 'xl'
      if (window.outerWidth && innerW) {
        const zoomPct = Math.round(((window.outerWidth - 10) / innerW) * 100)
        if (zoomPct > 0 && zoomPct <= 55) zoomStage = 'mobile'
        else if (zoomPct > 0 && zoomPct <= 70) zoomStage = 'tablet'
        else if (zoomPct > 0 && zoomPct <= 85) zoomStage = 'laptop'
      }

      // Pick the "smaller" (more constrained) stage
      const nextStage = stageRank[widthStage] <= stageRank[zoomStage] ? zoomStage : widthStage
      setLayoutStage((prev) => (prev === nextStage ? prev : nextStage))
    }

    computeStage()
    window.addEventListener('resize', computeStage)
    return () => window.removeEventListener('resize', computeStage)
  }, [])

  // XL/Desktop/Laptop (≥1024px): 2 columns side by side (4 | 8)
  // Tablet  (768-1023):  2 columns side by side (6 | 6)
  // Mobile  (<768px):    1 column stacked        (12 | 12)
  const isDesktopLike =
    layoutStage === 'xl' || layoutStage === 'desktop' || layoutStage === 'laptop'
  const leftColSpan = isDesktopLike ? 4 : layoutStage === 'tablet' ? 6 : 12
  const rightColSpan = isDesktopLike ? 8 : layoutStage === 'tablet' ? 6 : 12

  // ---------- Keyboard Shortcuts: ESC = Cancel, F9 = Submit ----------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showGuestModal || showBookedByModal) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        navigate(-1);
      } else if (e.key === 'F9') {
        e.preventDefault();
        formik.handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGuestModal, showBookedByModal, navigate]);

  const todayDate = formatDateToYMD(new Date());
  const tomorrowDate = formatDateToYMD(new Date(Date.now() + 86400000));

  // ---------- Master Data Fetching ----------
  const loadAllGuests = async () => {
    if (!hotelId) return;
    setSearchingGuests(true);
    try {
      const response = await GuestService.list({ hotelid: Number(hotelId) });
      const guestsData = response?.data || [];
      setGuests(
        guestsData
          .map((g: any) => ({
            guest_id: Number(g.id || g.guest_id),
            name: String(g.name),
            mobile: String(g.mobile),
          }))
          .filter((g: any) => !isNaN(g.guest_id) && g.name)
      );
    } catch (error) {
      console.error('Guest search failed:', error);
      setGuests([]);
    } finally {
      setSearchingGuests(false);
    }
  };

  useEffect(() => {
    if (hotelId) loadAllGuests();
  }, [hotelId]);

  const mapContactToBookedByWithId = (contact: any): BookedByWithId => ({
    booked_by_id: contact.booked_by_id,
    name: contact.name,
    mobile1: contact.mobile1,
    mobile2: contact.mobile2,
    email: contact.email,
    website: contact.website,
    address: contact.address,
    countryId: contact.country_id ?? null,
    stateId: contact.state_id ?? null,
    cityId: contact.city_id ?? null,
  });

  const loadBookedByList = async () => {
    try {
      const res = await BookedByContactService.list();
      const contacts = res.data || [];
      setBookedByList(contacts.map(mapContactToBookedByWithId));
    } catch (error) {
      console.error('Failed to load booked‑by contacts:', error);
      toast.error('Could not load booked‑by contacts');
    }
  };

  useEffect(() => {
    loadBookedByList();
  }, []);

  // Load Country / State / City master lists once, used for the
  // "Booked By" popup dropdowns (previously these were hardcoded to []).
  useEffect(() => {
    const loadLocationLists = async () => {
      setLoadingCountries(true);
      setLoadingStates(true);
      setLoadingCities(true);
      try {
        const [countryRes, stateRes, cityRes] = await Promise.all([
          CountryService.list(),
          StateService.list(),
          CityService.list(),
        ]);
        setCountries(countryRes?.data || []);
        setStates(stateRes?.data || []);
        setCities(cityRes?.data || []);
      } catch (error) {
        console.error('Failed to load country/state/city lists:', error);
        toast.error('Could not load country/state/city data');
      } finally {
        setLoadingCountries(false);
        setLoadingStates(false);
        setLoadingCities(false);
      }
    };
    loadLocationLists();
  }, []);

  useEffect(() => {
    const fetchMasterData = async () => {
      setLoadingGuestTypes(true);
      setLoadingCategories(true);

      try {
        const [guestTypesRes, categoriesRes, taxRes] =
          await Promise.all([
            GuestTypeService.list(),
            RoomCategoryService.list({ hotelid: hotelId }),
            taxApi.list(),
          ]);

        let guestTypesData = Array.isArray(guestTypesRes) ? guestTypesRes : guestTypesRes?.data || [];
        setGuestTypes(
          guestTypesData
            .map((g: any) => ({ id: g.id || g.guest_type_id, name: String(g.name || g.guest_type_name) }))
            .filter((g: any) => g.id && g.name)
        );

        let categoriesData = Array.isArray(categoriesRes) ? categoriesRes : categoriesRes?.data || [];
        setRoomCategories(
          categoriesData.map((c: any) => ({
            room_category_id: c.room_category_id || c.id,
            category_name: String(c.category_name || c.name),
            pax: c.max_limit || c.pax || 0,
          }))
        );

        let taxData = Array.isArray(taxRes) ? taxRes : taxRes?.data || [];
        setTaxList(taxData);
      } catch (error) {
        console.error('Failed to load master data:', error);
        toast.error('Could not load required data');
      } finally {
        setLoadingGuestTypes(false);
        setLoadingCategories(false);
      }
    };

    if (hotelId) fetchMasterData();
  }, [hotelId]);

  // ---------- Derived Data ----------
  const taxDetailsMap = useMemo(() => {
    const map = new Map<number, any>();
    taxList.forEach((tax) => {
      map.set(tax.hotel_taxid, tax);
    });
    return map;
  }, [taxList]);

  const taxMap = useMemo(() => {
    const map = new Map<number, number>();
    taxList.forEach((tax) => {
      let percent = 0;
      if (tax.hotel_tax_value != null && Number(tax.hotel_tax_value) > 0) {
        percent = Number(tax.hotel_tax_value);
      } else {
        percent = (Number(tax.hotel_cgst) || 0) +
          (Number(tax.hotel_sgst) || 0) +
          (Number(tax.hotel_igst) || 0) +
          (Number(tax.hotel_cess) || 0);
      }
      map.set(tax.hotel_taxid, percent);
    });
    return map;
  }, [taxList]);

  const fetchCategoryDetails = async (categoryId: number) => {
    if (!categoryId) return null;

    if (categoryDetailsMap.has(categoryId)) {
      return categoryDetailsMap.get(categoryId);
    }

    try {
      const response = await RoomCategoryService.get(categoryId);
      const details = response.data;
      setCategoryDetailsMap((prev) => new Map(prev).set(categoryId, details));

      let standardPax = 0;
      if (details.tariffs && details.tariffs.length > 0) {
        const paxValues = details.tariffs
          .map((t: any) => Number(t.no_of_pax))
          .filter((v: number) => v > 0);
        if (paxValues.length) standardPax = Math.min(...paxValues);
      }
      setCategoryStandardPaxMap((prev) => new Map(prev).set(categoryId, standardPax));

      const modeCharges = details.mode_charges || [];
      setCategoryModeChargesMap((prev) => new Map(prev).set(categoryId, modeCharges));

      return details;
    } catch (error) {
      console.error('Failed to fetch category details', error);
      toast.error('Could not load category details');
      return null;
    }
  };

  const computeExtraCharges = (
    categoryId: number | null,
    counts: { exPax: number; childPaid: number; driver: number },
    nights: number,
  ) => {
    if (!categoryId || nights <= 0) {
      return {
        exPaxPrice: 0,
        exPaxTax: 0,
        exPaxTaxPercent: 0,
        exPaxTotal: 0,
        childPrice: 0,
        childTax: 0,
        childTaxPercent: 0,
        childTotal: 0,
        driverPrice: 0,
        driverTax: 0,
        driverTaxPercent: 0,
        driverTotal: 0,
      };
    }

    const modeCharges = categoryModeChargesMap.get(categoryId) || [];
    const taxMapLocal = taxMap;

    const extraPaxMode = modeCharges.find((m: any) => m.mode_name === 'EXTRA_PAX');
    const childMode = modeCharges.find((m: any) => m.mode_name === 'CHILD');
    const driverMode = modeCharges.find((m: any) => m.mode_name === 'DRIVER');

    const compute = (mode: any, count: number) => {
      if (!mode || count <= 0) return { price: 0, tax: 0, taxPercent: 0, total: 0 };
      const perNightPrice = mode.charges * count;
      let taxPercent = 0;
      if (mode.is_tax_applicable && mode.tax_type) {
        taxPercent = taxMapLocal.get(Number(mode.tax_type)) || 0;
      }
      const perNightTax = (perNightPrice * taxPercent) / 100;
      const perNightTotal = perNightPrice + perNightTax;

      return {
        price: round2(perNightPrice),
        tax: round2(perNightTax),
        taxPercent,
        total: round2(perNightTotal),
      };
    };

    const exPaxCalc = compute(extraPaxMode, counts.exPax);
    const childCalc = compute(childMode, counts.childPaid);
    const driverCalc = compute(driverMode, counts.driver);

    return {
      exPaxPrice: exPaxCalc.price,
      exPaxTax: exPaxCalc.tax,
      exPaxTaxPercent: exPaxCalc.taxPercent,
      exPaxTotal: exPaxCalc.total,
      childPrice: childCalc.price,
      childTax: childCalc.tax,
      childTaxPercent: childCalc.taxPercent,
      childTotal: childCalc.total,
      driverPrice: driverCalc.price,
      driverTax: driverCalc.tax,
      driverTaxPercent: driverCalc.taxPercent,
      driverTotal: driverCalc.total,
    };
  };

  const calculateTotals = (
    ratePerNight: number,
    nights: number,
    totalRooms: number,
    taxPercent: number,
    discountPercent: number,
    extraCharges: {
      exPaxTotal: number;
      childTotal: number;
      driverTotal: number;
    }
  ) => {
    const baseRoomCharge = ratePerNight * nights * totalRooms;
    const discountAmount = (baseRoomCharge * discountPercent) / 100;
    const discountedRoomCharge = baseRoomCharge - discountAmount;
    const taxAmount = (discountedRoomCharge * taxPercent) / 100;
    const totalExtraCharges = (extraCharges.exPaxTotal + extraCharges.childTotal + extraCharges.driverTotal) * nights * totalRooms;
    const grandTotal = discountedRoomCharge + taxAmount + totalExtraCharges;

    return {
      baseRoomCharge,
      discountAmount,
      discountedRoomCharge,
      taxAmount,
      totalExtraCharges,
      grandTotal
    };
  };

  // ---------- Core Function: Update pricing based on adult count and category ----------
  const updatePricingFromAdultAndCategory = async (
    adultCount: number,
    categoryId: number | null,
    convertedCategoryId: number | null = null
  ) => {
    const effectiveCategoryId = convertedCategoryId ?? categoryId;
    if (!effectiveCategoryId || adultCount <= 0) {
      setFieldValue('roomCharge', 0);
      setFieldValue('taxPercent', 0);
      setFieldValue('taxAmount', 0);
      setFieldValue('total', 0);
      setFieldValue('pax', 0);
      setFieldValue('exPax', 0);
      return;
    }

    const categoryDetails = await fetchCategoryDetails(effectiveCategoryId);
    if (!categoryDetails) return;

    const tariffs = categoryDetails.tariffs || [];

    if (tariffs.length > 0) {
      const { pax, exPax, tariff, taxType, isTaxApplicable } = getTariffForPax(tariffs, adultCount);

      let taxPercent = 0;
      if (isTaxApplicable && taxType != null && taxType !== '' && taxType !== 0) {
        const taxDetails = taxDetailsMap.get(Number(taxType));
        if (taxDetails) {
          if (taxDetails.hotel_tax_value != null && Number(taxDetails.hotel_tax_value) > 0) {
            taxPercent = Number(taxDetails.hotel_tax_value);
          } else {
            taxPercent = (Number(taxDetails.hotel_cgst) || 0) +
              (Number(taxDetails.hotel_sgst) || 0) +
              (Number(taxDetails.hotel_igst) || 0) +
              (Number(taxDetails.hotel_cess) || 0);
          }
        }
      }

      setFieldValue('pax', pax);
      setFieldValue('exPax', exPax);
      setFieldValue('roomCharge', tariff);
      setFieldValue('taxPercent', taxPercent);

      const discountPercent = formik.values.discount || 0;
      const nights = formik.values.nights || 1;
      const roomsNo = formik.values.roomsNo || 1;

      const extra = computeExtraCharges(effectiveCategoryId, { exPax, childPaid: formik.values.childPaid || 0, driver: formik.values.driver || 0 }, nights);

      const totals = calculateTotals(tariff, nights, roomsNo, taxPercent, discountPercent, {
        exPaxTotal: extra.exPaxTotal,
        childTotal: extra.childTotal,
        driverTotal: extra.driverTotal
      });

      setFieldValue('taxAmount', Number(formatToTwoDecimals(totals.taxAmount)));
      setFieldValue('discountAmt', Number(formatToTwoDecimals(totals.discountAmount)));
      setFieldValue('total', Number(formatToTwoDecimals(totals.grandTotal)));

      const standardPax = categoryStandardPaxMap.get(effectiveCategoryId) || pax;
      setCategoryStandardPaxMap((prev) => new Map(prev).set(effectiveCategoryId, standardPax));

      return;
    }

    const standardPax = categoryStandardPaxMap.get(effectiveCategoryId) ||
      (categoryDetails.pax || 1);

    const newPax = standardPax;
    const newExPax = Math.max(0, adultCount - standardPax);

    setFieldValue('pax', newPax);
    setFieldValue('exPax', newExPax);
  };

  // ---------- Formik ----------
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      guestId: undefined,
      title: 'MR',
      firstName: '',
      lastName: '',
      phone1: '',
      phone2: '',
      email: '',
      address: '',
      countryId: '',
      stateId: '',
      cityId: '',
      // The fields above hold the guest's country/state/city NAME text for
      // display (readOnly inputs). The actual numeric IDs needed by the
      // hotel_reservations.country_id/state_id/city_id columns are kept
      // separately here so the correct ID — not the name string — is sent
      // to the backend on submit.
      actualCountryId: null as number | null,
      actualStateId: null as number | null,
      actualCityId: null as number | null,
      idType: null,
      idNumber: '',
      otherInfo: '',
      companyId: null,
      gst: '',
      groupName: '',

      reservationNo: '',
      reservationDate: todayDate,
      arrivalDate: todayDate,
      arrivalTime: '12:00',
      departureDate: tomorrowDate,
      departureTime: '10:00',
      nights: 1,
      guestType: null,

      billingInstructions: '',
      specialInstructions: '',

      roomCategory: null,
      convertedCategory: null,
      adult: 1,
      pax: 0,
      exPax: 0,
      childPaid: 0,
      childUnpaid: 0,
      driver: 0,
      roomsNo: 1,
      roomCharge: 0,
      discount: 0,
      discountAmt: 0,
      taxPercent: 0,
      taxAmount: 0,
      total: 0,

      bookingTakenBy: '',
      reservationMode: null,
      confirmationMode: null,
      pickup: null,
      drop: null,
      status: null,

      hotelid: hotelId,
      created_by_id: user?.id,
    },
    validationSchema: Yup.object({
      firstName: Yup.string(),
      lastName: Yup.string(),
      phone1: Yup.string(),
      arrivalDate: Yup.date().required(),
      departureDate: Yup.date()
        .min(Yup.ref('arrivalDate'), 'Departure must be after arrival')
        .required(),
    }),
    onSubmit: async (values) => {
      if (roomRows.length === 0) {
        toast.error('Please add at least one room');
        return;
      }

      setSubmitting(true);

      try {
        const reservationPayload = {
          reservation_no: values.reservationNo || undefined,
          guest_id: values.guestId,
          title: values.title,
          reservation_name: `${values.firstName} ${values.lastName}`.trim(),
          phone1: values.phone1,
          phone2: values.phone2,
          email: values.email,
          address: values.address,
          // FIX: backend (hotel_reservations) expects country_id/state_id/
          // city_id — sending "country"/"state"/"city" meant these columns
          // were always saved as NULL. Also use the numeric "actual*Id"
          // fields, not countryId/stateId/cityId which hold display NAME
          // text for the read-only Country/State/City inputs.
          country_id: values.actualCountryId || null,
          state_id: values.actualStateId || null,
          city_id: values.actualCityId || null,
          id_type: values.idType,
          id_number: values.idNumber,
          company_id:
            !values.companyId || values.companyId === 'WALK-IN-GUEST'
              ? null
              : Number(values.companyId),
          gst: values.gst,
          group_name: values.groupName,
          reservation_date: values.reservationDate,
          arrival_date: values.arrivalDate,
          arrival_time: values.arrivalTime,
          departure_date: values.departureDate,
          departure_time: values.departureTime,
          nights: values.nights,
          guest_type: values.guestType,
          billing_instructions: values.billingInstructions,
          special_instructions: values.specialInstructions,
          booking_taken_by: values.bookingTakenBy,
          reservation_mode: values.reservationMode,
          confirmation_mode: values.confirmationMode,
          pickup: values.pickup,
          drop_location: values.drop ?? undefined,
          status: values.status || 'reserved',
          hotelid: hotelId,
          created_by_id: user?.id,
        };

        // Build the room rows and booked-by link as part of the SAME payload
        // sent to ReservationService — one API call inserts/replaces
        // hotel_reservations + reservation_rooms + reservation_booked_by,
        // matching how CheckInForm sends details/room_charges/folio_entries
        // together to CheckInService in a single request.
        const roomsPayload = roomRows.map((row) => ({
          room_category_id: row.roomCategoryId,
          converted_category_id: row.convertedCategoryId,
          total_rooms: row.total_rooms,
          pax_count: row.pax,
          pax_price: row.rate,
          pax_tax: row.taxAmount / (row.total_rooms * row.nights),
          ex_pax_count: row.exPax,
          ex_pax_price: row.exPaxPrice,
          ex_pax_tax: row.exPaxTax,
          ex_pax_tax_percent: row.exPaxTaxPercent,
          ex_pax_total: row.exPaxTotal * row.total_rooms * row.nights,
          child_count: row.childPaid,
          child_price: row.childPrice,
          child_tax: row.childTax,
          child_tax_percent: row.childTaxPercent,
          child_total: row.childTotal * row.total_rooms * row.nights,
          driver_count: row.driver,
          driver_price: row.driverPrice,
          driver_tax: row.driverTax,
          driver_tax_percent: row.driverTaxPercent,
          driver_total: row.driverTotal * row.total_rooms * row.nights,
          discount_percent: row.discountPercent,
          discount_amount: row.discountAmt,
          total_amount: row.totalAmount,
        }));

        const fullPayload = {
          ...reservationPayload,
          rooms: roomsPayload,
          booked_by_id: bookedBy ? bookedBy.booked_by_id : null,
        };

        let createdResNo: string;

        if (isEditing && id) {
          const reservationRes = await ReservationService.update(Number(id), fullPayload);
          createdResNo = reservationRes.data.reservation_no;
          toast.success(`Reservation ${createdResNo} updated`);
        } else {
          const reservationRes = await ReservationService.create(fullPayload);
          createdResNo = reservationRes.data.reservation_no;
          formik.setFieldValue('reservationNo', createdResNo);
          toast.success(`Reservation ${createdResNo} created`);
        }

        navigate(-1);
      } catch (error: any) {
        console.error('Reservation submission failed:', error);
        toast.error(error.response?.data?.message || 'Reservation failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const { setFieldValue, values, handleSubmit } = formik;

  // ---------- Handlers that depend on formik ----------

  const handleRoomCategoryChange = async (categoryId: number | null) => {
    if (!categoryId) {
      setFieldValue('roomCategory', null);
      setFieldValue('convertedCategory', null);
      setFieldValue('roomCharge', 0);
      setFieldValue('pax', 0);
      setFieldValue('exPax', 0);
      setFieldValue('taxPercent', 0);
      setFieldValue('taxAmount', 0);
      setFieldValue('discountAmt', 0);
      setFieldValue('total', 0);
      return;
    }

    setFieldValue('roomCategory', categoryId);
    setFieldValue('convertedCategory', categoryId);

    const adultCount = Number(values.adult) || 1;
    await updatePricingFromAdultAndCategory(adultCount, categoryId, categoryId);
  };

  const handleConvertedCategoryChange = async (categoryId: number | null) => {
    setFieldValue('convertedCategory', categoryId);

    if (!categoryId) {
      const originalCategoryId = values.roomCategory;
      if (originalCategoryId) {
        const adultCount = Number(values.adult) || 1;
        await updatePricingFromAdultAndCategory(adultCount, originalCategoryId, null);
      } else {
        setFieldValue('roomCharge', 0);
        setFieldValue('pax', 0);
        setFieldValue('exPax', 0);
        setFieldValue('taxPercent', 0);
        setFieldValue('taxAmount', 0);
        setFieldValue('total', 0);
      }
      return;
    }

    const adultCount = Number(values.adult) || 1;
    await updatePricingFromAdultAndCategory(adultCount, categoryId, categoryId);
  };

  const recalculateRoomTotal = async () => {
    const adultCount = values.adult || 0;
    const effectiveCategoryId = values.convertedCategory ?? values.roomCategory;

    if (effectiveCategoryId && adultCount > 0) {
      await updatePricingFromAdultAndCategory(adultCount, effectiveCategoryId, values.convertedCategory);
    } else {
      const roomCharge = values.roomCharge || 0;
      const taxPercent = values.taxPercent || 0;
      const discountPercent = values.discount || 0;
      const nights = values.nights || 1;
      const roomsNo = values.roomsNo || 1;
      const exPax = values.exPax || 0;
      const childPaid = values.childPaid || 0;
      const driver = values.driver || 0;
      const effectiveCatId = values.convertedCategory ?? values.roomCategory;

      const extra = computeExtraCharges(effectiveCatId, { exPax, childPaid, driver }, nights);

      const totals = calculateTotals(roomCharge, nights, roomsNo, taxPercent, discountPercent, {
        exPaxTotal: extra.exPaxTotal,
        childTotal: extra.childTotal,
        driverTotal: extra.driverTotal
      });

      setFieldValue('taxAmount', Number(formatToTwoDecimals(totals.taxAmount)));
      setFieldValue('discountAmt', Number(formatToTwoDecimals(totals.discountAmount)));
      setFieldValue('total', Number(formatToTwoDecimals(totals.grandTotal)));
    }
  };

  const updateExPaxFromAdultAndPax = (adult: number, pax: number) => {
    const newExPax = Math.max(0, adult - pax);
    if (values.exPax !== newExPax) {
      setFieldValue('exPax', newExPax);
      recalculateRoomTotal();
    }
  };

  useEffect(() => {
    recalculateRoomTotal();
  }, [values.roomCharge, values.taxPercent, values.discount, values.nights, values.roomsNo, values.exPax, values.childPaid, values.driver, values.roomCategory, values.convertedCategory]);

  useEffect(() => {
    const adult = values.adult || 0;
    const pax = values.pax || 0;
    updateExPaxFromAdultAndPax(adult, pax);

    const effectiveCategoryId = values.convertedCategory ?? values.roomCategory;
    if (effectiveCategoryId && adult > 0) {
      updatePricingFromAdultAndCategory(adult, effectiveCategoryId, values.convertedCategory);
    }
  }, [values.adult, values.pax]);

  // ---------- Options for selects ----------
  const guestOptions: Option[] = guests.map((g) => ({ label: g.name, value: g.guest_id }));
  const guestTypeOptions: Option[] = guestTypes.map((gt) => ({
    label: gt.name,
    value: gt.id,
  }));
  const categoryOptionsNumeric: NumericOption[] = roomCategories.map((c) => ({
    label: c.category_name,
    value: Number(c.room_category_id),
  }));
  const bookedByOptions: Option[] = bookedByList.map((b) => ({
    label: b.name,
    value: b.booked_by_id,
  }));

  const countryOptions: Option[] = countries.map((c) => ({
    label: c.country_name,
    value: c.countryid,
  }));
  const stateOptions: Option[] = states.map((s) => ({
    label: s.state_name,
    value: s.stateid,
  }));
  const cityOptions: Option[] = cities.map((c) => ({
    label: c.city_name,
    value: c.cityid,
  }));

  // ---------- Other handlers ----------
  const loadGuestDetails = async (guestId: number) => {
    if (!guestId || isNaN(guestId)) return;
    try {
      const response = await GuestService.get(guestId);
      const guest = response.data || response;
      if (guest) {
        const fullName = guest.name ? String(guest.name) : '';
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Set title from guest's fragment_id if available, otherwise default to MR
        const title = guest.fragment_id ? 'MR' : 'MR';
        
        setFieldValue('title', title);
        setFieldValue('guestId', guest.id || guest.guest_id);
        setFieldValue('firstName', firstName);
        setFieldValue('lastName', lastName);
        setFieldValue('phone1', guest.phone ? String(guest.phone) : '');
        setFieldValue('phone2', guest.mobile ? String(guest.mobile) : '');
        setFieldValue('email', guest.email ? String(guest.email) : '');
        setFieldValue('address', guest.address ? String(guest.address) : '');
        setFieldValue('countryId', guest.country_name ? String(guest.country_name) : '');
        setFieldValue('stateId', guest.state_name ? String(guest.state_name) : '');
        setFieldValue('cityId', guest.city_name ? String(guest.city_name) : '');
        setFieldValue('actualCountryId', guest.country_id ?? null);
        setFieldValue('actualStateId', guest.state_id ?? null);
        setFieldValue('actualCityId', guest.city_id ?? null);
        setFieldValue('discount', guest.discount_percent ?? 0);
        setFieldValue('idType', (guest as any).id_type || null);
        setFieldValue('idNumber', (guest as any).id_number || '');
        setFieldValue('otherInfo', guest.organisation ? String(guest.organisation) : '');

        if (guest.company_id) {
          setFieldValue('companyId', String(guest.company_id));
        } else {
          setFieldValue('companyId', null);
          setFieldValue('gst', '');
        }
      }
    } catch (error) {
      console.error('Failed to load guest details:', error);
      toast.error('Could not load guest details');
    }
  };

  const handleAddOrUpdateRow = () => {
    if (!values.guestId) {
      toast.error('Please select a guest first');
      return;
    }
    if (!values.roomCategory) {
      toast.error('Please select a room category');
      return;
    }

    const selectedCategory = roomCategories.find((c) => c.room_category_id === values.roomCategory);
    if (!selectedCategory) return;

    const convertedCategory = values.convertedCategory
      ? roomCategories.find((c) => c.room_category_id === values.convertedCategory)
      : null;

    const effectiveCategoryId = values.convertedCategory ?? values.roomCategory;

    const extra = computeExtraCharges(effectiveCategoryId, {
      exPax: values.exPax,
      childPaid: values.childPaid,
      driver: values.driver,
    }, values.nights);

    const ratePerRoomPerNight = values.roomCharge;
    const taxPercent = values.taxPercent;
    const discountPercent = values.discount || 0;
    const total_rooms = values.roomsNo || 1;
    const nights = values.nights;

    const totals = calculateTotals(ratePerRoomPerNight, nights, total_rooms, taxPercent, discountPercent, {
      exPaxTotal: extra.exPaxTotal,
      childTotal: extra.childTotal,
      driverTotal: extra.driverTotal
    });

    const guestName = `${values.firstName} ${values.lastName}`.trim();

    const existingRow = editingRowId ? roomRows.find((r) => r.id === editingRowId) : null;

    const newRow: RoomRow = {
      id: existingRow ? existingRow.id : `${selectedCategory.room_category_id}-${Date.now()}`,
      guestId: values.guestId!,
      guestName,
      roomCategoryId: selectedCategory.room_category_id,
      roomCategoryName: selectedCategory.category_name,
      convertedCategoryId: convertedCategory?.room_category_id || null,
      convertedCategoryName: convertedCategory?.category_name || null,
      adult: values.adult,
      pax: values.pax,
      exPax: values.exPax,
      childPaid: values.childPaid,
      childUnpaid: values.childUnpaid,
      driver: values.driver,
      total_rooms,
      arrivalDate: values.arrivalDate,
      arrivalTime: values.arrivalTime,
      departureDate: values.departureDate,
      departureTime: values.departureTime,
      nights,
      rate: ratePerRoomPerNight,
      discountPercent,
      discountAmt: totals.discountAmount,
      taxPercent,
      taxAmount: totals.taxAmount,
      exPaxPrice: extra.exPaxPrice,
      exPaxTaxPercent: extra.exPaxTaxPercent,
      exPaxTax: extra.exPaxTax,
      exPaxTotal: extra.exPaxTotal,
      childPrice: extra.childPrice,
      childTaxPercent: extra.childTaxPercent,
      childTax: extra.childTax,
      childTotal: extra.childTotal,
      driverPrice: extra.driverPrice,
      driverTaxPercent: extra.driverTaxPercent,
      driverTax: extra.driverTax,
      driverTotal: extra.driverTotal,
      totalAmount: totals.grandTotal,
    };

    if (editingRowId) {
      setRoomRows(roomRows.map((row) => (row.id === editingRowId ? newRow : row)));
      setEditingRowId(null);
    } else {
      setRoomRows([...roomRows, newRow]);
    }

    setFieldValue('roomCategory', null);
    setFieldValue('convertedCategory', null);
    setFieldValue('pax', 0);
    setFieldValue('exPax', 0);
    setFieldValue('childPaid', 0);
    setFieldValue('childUnpaid', 0);
    setFieldValue('driver', 0);
    setFieldValue('roomsNo', 1);
    setFieldValue('roomCharge', 0);
    setFieldValue('discount', 0);
    setFieldValue('discountAmt', 0);
    setFieldValue('taxPercent', 0);
    setFieldValue('taxAmount', 0);
    setFieldValue('total', 0);
    setSelectedRowId(null);

    toast.success(editingRowId ? 'Room updated successfully' : 'Room added successfully');
  };

  const handleEditRow = (row: RoomRow) => {
    setEditingRowId(row.id);
    setFieldValue('roomCategory', row.roomCategoryId);
    setFieldValue('convertedCategory', row.convertedCategoryId);
    setFieldValue('pax', row.pax);
    setFieldValue('exPax', row.exPax);
    setFieldValue('childPaid', row.childPaid);
    setFieldValue('childUnpaid', row.childUnpaid);
    setFieldValue('driver', row.driver);
    setFieldValue('roomsNo', row.total_rooms);
    setFieldValue('roomCharge', row.rate);
    setFieldValue('discount', row.discountPercent);
    setFieldValue('taxPercent', row.taxPercent);
    setFieldValue('taxAmount', row.taxAmount / (row.total_rooms * row.nights));
    setFieldValue('arrivalDate', row.arrivalDate);
    setFieldValue('arrivalTime', row.arrivalTime);
    setFieldValue('departureDate', row.departureDate);
    setFieldValue('departureTime', row.departureTime);
    setFieldValue('nights', row.nights);

    recalculateRoomTotal();
  };

  const handleDeleteRow = (rowId: string) => {
    setRoomRows(roomRows.filter((row) => row.id !== rowId));
    if (editingRowId === rowId) setEditingRowId(null);
    if (selectedRowId === rowId) setSelectedRowId(null);
    toast.success('Room removed');
  };

  const handleGuestSearch = async (inputValue: string) => {
    if (!inputValue || !hotelId) {
      loadAllGuests();
      return;
    }
    if (inputValue.length < 2) return;
    setSearchingGuests(true);
    try {
      const response = await GuestService.list({ q: inputValue, hotelid: Number(hotelId) });
      const guestsData = response?.data || [];
      setGuests(
        guestsData
          .map((g: any) => ({
            guest_id: Number(g.id || g.guest_id),
            name: String(g.name),
            mobile: String(g.mobile),
          }))
          .filter((g: any) => !isNaN(g.guest_id) && g.name)
      );
    } catch (error) {
      console.error('Guest search failed:', error);
      setGuests([]);
    } finally {
      setSearchingGuests(false);
    }
  };

  const handleBookedBySelect = (option: Option | null) => {
    if (!option) {
      setBookedBy(null);
      setFieldValue('bookingTakenBy', '');
      return;
    }
    const selected = bookedByList.find((b) => b.booked_by_id === option.value);
    setBookedBy(selected || null);
    if (selected) {
      setFieldValue('bookingTakenBy', selected.name);
    }
  };

  const handleBookedBySave = async (values: BookedBy) => {
    const payload = {
      ...values,
      country_id: values.countryId ? Number(values.countryId) : null,
      state_id: values.stateId ? Number(values.stateId) : null,
      city_id: values.cityId ? Number(values.cityId) : null,
    };

    try {
      const res = await BookedByContactService.create(payload);
      const newContact = res.data;
      toast.success('Contact saved');
      await loadBookedByList();
      const mapped = mapContactToBookedByWithId(newContact);
      setBookedBy(mapped);
      setFieldValue('bookingTakenBy', mapped.name);
      setShowBookedByModal(false);
    } catch (error) {
      toast.error('Failed to save contact');
    }
  };

  // Auto‑calculate nights from arrival/departure
  useEffect(() => {
    const { arrivalDate, departureDate } = values;
    if (arrivalDate && departureDate) {
      const arr = parseDateSafe(arrivalDate);
      const dep = parseDateSafe(departureDate);
      const diffTime = dep.getTime() - arr.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0 && diffDays !== values.nights) {
        setFieldValue('nights', Number(diffDays));
        recalculateRoomTotal();
      }
    }
  }, [values.arrivalDate, values.departureDate, setFieldValue]);

  // Auto‑calculate departure date when nights or arrival date change
  useEffect(() => {
    const { arrivalDate, nights } = values;
    if (arrivalDate && nights) {
      const arr = parseDateSafe(arrivalDate);
      arr.setDate(arr.getDate() + nights);
      const newDeparture = formatDateToYMD(arr);
      if (newDeparture !== values.departureDate) {
        setFieldValue('departureDate', newDeparture);
      }
    }
  }, [values.arrivalDate, values.nights, setFieldValue]);

  // Fetch next reservation number for new reservation
  useEffect(() => {
    if (!isEditing && hotelId) {
      const fetchNextNumber = async () => {
        try {
          const res = await ReservationService.getNextNumber({ hotelid: hotelId });
          if (res.success && res.data) {
            setFieldValue('reservationNo', res.data.reservation_no);
          }
        } catch (error) {
          console.error('Failed to fetch next reservation number:', error);
          toast.error('Could not generate reservation number');
        }
      };
      fetchNextNumber();
    }
  }, [isEditing, hotelId, setFieldValue]);

  // Load existing reservation if editing
  useEffect(() => {
    if (!isEditing || !id || !hotelId) return;

    const loadReservation = async () => {
      try {
        const res = await ReservationService.get(Number(id));
        const reservation = res.data;

        setFieldValue('reservationNo', reservation.reservation_no);
        setFieldValue('reservationDate', reservation.reservation_date);
        setFieldValue('arrivalDate', reservation.arrival_date);
        setFieldValue('arrivalTime', reservation.arrival_time);
        setFieldValue('departureDate', reservation.departure_date);
        setFieldValue('departureTime', reservation.departure_time);
        setFieldValue('nights', reservation.nights);
        setFieldValue('guestType', reservation.guest_type);
        setFieldValue('billingInstructions', reservation.billing_instructions);
        setFieldValue('specialInstructions', reservation.special_instructions);
        setFieldValue('bookingTakenBy', reservation.booking_taken_by);
        setFieldValue('reservationMode', reservation.reservation_mode);
        setFieldValue('confirmationMode', reservation.confirmation_mode);
        setFieldValue('pickup', reservation.pickup);
        setFieldValue('drop', reservation.drop_location);
        setFieldValue('status', reservation.status);

        if (reservation.guest_id) {
          setFieldValue('guestId', reservation.guest_id);
          await loadGuestDetails(reservation.guest_id);
        }

        // Single API response already carries rooms + booked_by — no more
        // separate ReservationRoomService / ReservationBookedByService calls.
        const rooms = reservation.rooms || [];

        const rows: RoomRow[] = rooms.map((room: any) => {
          const category = roomCategories.find(c => c.room_category_id === room.room_category_id);
          const convertedCategory = room.converted_category_id
            ? roomCategories.find(c => c.room_category_id === room.converted_category_id)
            : null;

          const nights = reservation.nights;
          const total_rooms = room.total_rooms || 1;

          return {
            id: `room-${room.room_row_id}`,
            guestId: reservation.guest_id,
            guestName: reservation.reservation_name,
            roomCategoryId: room.room_category_id,
            roomCategoryName: category?.category_name || 'Unknown',
            convertedCategoryId: room.converted_category_id || null,
            convertedCategoryName: convertedCategory?.category_name || null,
            adult: room.pax_count || 0,
            pax: room.pax_count || 0,
            exPax: room.ex_pax_count || 0,
            childPaid: room.child_count || 0,
            childUnpaid: 0,
            driver: room.driver_count || 0,
            total_rooms,
            arrivalDate: reservation.arrival_date,
            arrivalTime: reservation.arrival_time,
            departureDate: reservation.departure_date,
            departureTime: reservation.departure_time,
            nights,
            rate: room.pax_price || 0,
            discountPercent: room.discount_percent || 0,
            discountAmt: room.discount_amount || 0,
            taxPercent: 0,
            taxAmount: room.pax_tax * total_rooms * nights || 0,
            exPaxPrice: room.ex_pax_price || 0,
            exPaxTaxPercent: room.ex_pax_tax_percent || 0,
            exPaxTax: room.ex_pax_tax || 0,
            exPaxTotal: room.ex_pax_total / (total_rooms * nights) || 0,
            childPrice: room.child_price || 0,
            childTaxPercent: room.child_tax_percent || 0,
            childTax: room.child_tax || 0,
            childTotal: room.child_total / (total_rooms * nights) || 0,
            driverPrice: room.driver_price || 0,
            driverTaxPercent: room.driver_tax_percent || 0,
            driverTax: room.driver_tax || 0,
            driverTotal: room.driver_total / (total_rooms * nights) || 0,
            totalAmount: room.total_amount || 0,
          };
        });
        setRoomRows(rows);

        if (reservation.booked_by) {
          const contactRes = await BookedByContactService.get(reservation.booked_by.booked_by_id);
          setBookedBy(mapContactToBookedByWithId(contactRes.data));
          setFieldValue('bookingTakenBy', contactRes.data.name);
        }
      } catch (error) {
        console.error('Failed to load reservation for editing:', error);
        toast.error('Could not load reservation data');
      }
    };

    loadReservation();
  }, [id, isEditing, hotelId, roomCategories]);

  // ========== UPDATED SELECT STYLES WITH Z-INDEX FIX ==========
  const selectStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: '28px',
      fontSize: '0.7rem',
      padding: '0',
      position: 'relative',
      zIndex: 1,
    }),
    valueContainer: (base: any) => ({ ...base, padding: '0 4px' }),
    input: (base: any) => ({ ...base, margin: '0', padding: '0' }),
    indicatorsContainer: (base: any) => ({ ...base, height: '28px' }),
    dropdownIndicator: (base: any) => ({ ...base, padding: '0 4px' }),
    clearIndicator: (base: any) => ({ ...base, padding: '0 4px' }),
    menu: (base: any) => ({
      ...base,
      fontSize: '0.7rem',
      zIndex: 10000,
      position: 'absolute',
      maxHeight: '200px',
      overflowY: 'auto',
    }),
    option: (base: any) => ({ ...base, padding: '2px 8px' }),
    menuPortal: (base: any) => ({ ...base, zIndex: 10001 }),
  } as const;

  // Dedicated styles for the "Booked By" select — taller control + breathing
  // room so it sits centered and fully visible inside its table cell.
  const bookedBySelectStyles = {
    ...selectStyles,
    control: (base: any, state: any) => ({
      ...base,
      minHeight: '30px',
      height: '30px',
      fontSize: '0.75rem',
      padding: '0',
      borderColor: state.isFocused ? '#86b7fe' : '#ced4da',
      borderRadius: '4px',
      boxShadow: state.isFocused ? '0 0 0 1px rgba(13,110,253,.25)' : 'none',
      position: 'relative',
      zIndex: 1,
    }),
    valueContainer: (base: any) => ({ ...base, padding: '0 8px', height: '30px' }),
    input: (base: any) => ({ ...base, margin: '0', padding: '0' }),
    indicatorsContainer: (base: any) => ({ ...base, height: '30px' }),
    placeholder: (base: any) => ({ ...base, color: '#6c757d' }),
    singleValue: (base: any) => ({ ...base, textAlign: 'left' }),
  } as const;

  const effectiveCategoryId = values.convertedCategory ?? values.roomCategory;
  const effectiveStandardPax = effectiveCategoryId ? categoryStandardPaxMap.get(effectiveCategoryId) || 0 : 0;
  console.log('Effective standard pax for category', effectiveCategoryId, ':', effectiveStandardPax);

  const displayRoomCharge = formatToTwoDecimals(values.roomCharge);
  const displayTaxPercent = formatToTwoDecimals(values.taxPercent);
  const displayTaxAmount = formatToTwoDecimals(values.taxAmount);
  const displayTotal = formatToTwoDecimals(values.total);

  useEffect(() => {
    if (roomCategories.length > 0 && values.roomCategory) {
      fetchCategoryDetails(values.roomCategory);
    }
  }, [roomCategories, values.roomCategory]);

  return (
    <FormikProvider value={formik}>
      <style>{`
        /* ===== ROOT VARIABLES & SCALING ===== */
        :root {
          --page-scale: clamp(0.75, 1.2vw + 0.5, 1);
          --font-scale: clamp(10px, 0.9vw + 8px, 12px);
          --input-scale: clamp(24px, 2.5vh + 12px, 28px);
          --button-scale: clamp(26px, 2vh + 16px, 28px);
          --table-row-scale: clamp(28px, 3vh, 30px);
          --header-bg: #a6b8e6;
        }

        /* ===== MAIN CONTAINER ===== */
        .reservation-responsive-container {
          max-width: 1600px;
          margin: 0 auto;
          width: 100%;
          height: 100vh;
          max-height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #f8f9fa;
        }

        .reservation-responsive-container .card {
          min-height: 0;
          overflow: hidden;
          border-radius: 0;
          box-shadow: none;
        }

        .reservation-responsive-container form {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        /* ===== SCALED TEXT & INPUTS ===== */
        body, input, select, textarea, button, .fs-small, .form-label, .badge, .btn {
          font-size: var(--font-scale) !important;
        }

        input.form-control-sm, select.form-select-sm, .form-control-sm {
          height: var(--input-scale) !important;
          min-height: var(--input-scale) !important;
          padding: 0 6px !important;
        }

        .btn-sm {
          height: var(--button-scale) !important;
          padding: 0 10px !important;
          font-size: var(--font-scale) !important;
        }

        /* ===== TABLE ===== */
        .table-sm-compact tbody tr {
          height: var(--table-row-scale) !important;
        }
        .table-sm-compact th, .table-sm-compact td {
          padding: 0px 7px !important;
          font-size: 11px;
        }

        /* ===== BOOKED BY TABLE ===== */
        .booked-by-table {
          margin-bottom: 0;
        }
        .booked-by-table th {
          padding: 6px 7px !important;
          font-size: 11px;
          white-space: nowrap;
        }
        .booked-by-table td {
          padding: 5px 7px !important;
          font-size: 11px;
          vertical-align: middle !important;
        }
        .booked-by-table tbody tr {
          height: 40px;
        }
        .booked-by-name-cell {
          min-width: 180px;
        }

        /* ===== REACT SELECT OVERLAP FIX ===== */
        .react-select__menu {
          z-index: 9999 !important;
          position: absolute !important;
        }
        .has-select {
          position: relative !important;
        }
        .bordered-section .react-select__menu {
          max-height: 200px !important;
          overflow-y: auto !important;
        }
        .light-gray-border .react-select__menu {
          max-height: 150px !important;
          overflow-y: auto !important;
        }
        .bordered-section [class*="react-select__control"] {
          position: relative !important;
        }
        .bordered-section .row .react-select__menu {
          z-index: 10000 !important;
        }
        .react-select__menu-portal {
          z-index: 10001 !important;
        }
        .react-select__menu-list {
          max-height: 180px !important;
          overflow-y: auto !important;
        }

        /* ===== REACT SELECT ===== */
        .react-select__control {
          min-height: var(--input-scale) !important;
          font-size: var(--font-scale) !important;
        }
        .react-select__valueContainer {
          padding: 0 4px !important;
        }
        .react-select__indicators {
          height: var(--input-scale) !important;
        }

        /* ===== SCROLLABLE TABLE ===== */
        .scrollable-table {
          max-height: 222px;
          overflow-x: auto;
          overflow-y: auto;
          border: 1px solid #dee2e6;
          position: relative;
        }
        /* Mobile: show only 2-3 rows by default, then scroll */
        @media (max-width: 767.98px) {
          .scrollable-table {
            max-height: 120px;
          }
        }

        .scrollable-table table {
          border-collapse: separate;
          border-spacing: 0;
          font-size: 11px !important;
        }

        .scrollable-table thead th {
          position: sticky;
          top: 0;
          z-index: 2;
          background-color: #d9d9d9 !important;
        }

        .scrollable-table th {
          font-size: 10px !important;
          font-weight: 600;
          border: 1px solid #b5b5b5 !important;
          padding: 4px 6px !important;
          white-space: nowrap;
        }

        .scrollable-table td {
          font-size: 10px !important;
          border: 1px solid #d0d0d0 !important;
          padding: 0px 6px !important;
          vertical-align: middle;
        }

        .scrollable-table table {
          border-collapse: collapse !important;
          border: 1px solid #b5b5b5 !important;
        }

        .scrollable-table tbody tr {
          height: 32px;
        }

        .scrollable-table::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .scrollable-table::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .scrollable-table::-webkit-scrollbar-thumb {
          background: #c8c8c8;
          border-radius: 3px;
        }
        .scrollable-table::-webkit-scrollbar-thumb:hover {
          background: #aaa;
        }

        /* ===== SECTION HEADERS ===== */
        .section-header {
          background-color: var(--header-bg);
          color: #333;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2px 10px;
          margin-bottom: 4px;
          font-weight: 600;
          font-size: var(--font-scale);
          min-height: 24px;
        }

        .section-header .fw-bold {
          font-size: var(--font-scale);
        }

        /* ===== BORDERED CONTAINERS ===== */
        .bordered-section {
          border: 1px solid #adb5bd;
          padding: 4px 8px;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        /* ===== COUNTER INPUTS ===== */
        .counter-group {
          display: flex;
          align-items: center;
          border: 1px solid #0d6efd;
          border-radius: 4px;
          overflow: hidden;
          height: 28px;
          width: 100%;
        }
        .counter-btn {
          border: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 28px;
          background: #e7f3ff;
          color: #0d6efd;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
        }
        .counter-btn:hover {
          background: #d0e4ff;
        }
        .counter-input {
          border: 0;
          text-align: center;
          font-weight: bold;
          font-size: var(--font-scale);
          width: 45px;
          height: 28px;
          background: #f8f9fa;
          outline: none;
          -moz-appearance: textfield;
        }
        .counter-input::-webkit-outer-spin-button,
        .counter-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .counter-input:focus {
          background: #fff;
        }

        .pax-display {
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #28a745;
          border-radius: 4px;
          height: 28px;
          background: #f0fff4;
        }
        .pax-display span {
          font-weight: bold;
          font-size: var(--font-scale);
          color: #28a745;
        }

        .ex-pax-display {
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #fd7e14;
          border-radius: 4px;
          height: 28px;
          background: #fff3e0;
        }
        .ex-pax-display span {
          font-weight: bold;
          font-size: var(--font-scale);
          color: #dc6500;
        }

        /* ===== RATE INFO SECTION ===== */
        .rate-info-section {
          border: 1px solid #adb5bd;
          border-radius: 4px;
          padding: 4px 8px;
          margin-top: 4px;
        }

        /* ===== FIXED BOTTOM BAR ===== */
        .fixed-bottom-bar {
          padding: 4px 10px;
          background: #fff;
          border-top: 1px solid #dee2e6;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        /* ===== RESPONSIVE GRID ===== */
        .row.g-2 {
          --bs-gutter-x: 0.4rem;
          --bs-gutter-y: 0.2rem;
        }

        .reservation-stage-tablet .row.g-2 {
          --bs-gutter-y: 0.6rem;
        }

        .reservation-stage-mobile .row.g-2 {
          --bs-gutter-y: 0.85rem;
        }

        .mb-1 {
          margin-bottom: 0.15rem !important;
        }
        .mt-1 {
          margin-top: 0.15rem !important;
        }
        .my-2 {
          margin-top: 0.2rem !important;
          margin-bottom: 0.2rem !important;
        }

        /* ===== LABELS ===== */
        .form-label-sm {
          font-size: var(--font-scale);
          margin-bottom: 1px;
          display: block;
          font-weight: 500;
        }

        /* ===== TEXTAREA ===== */
        .instruction-textarea {
          resize: vertical;
          border-radius: 0;
          min-height: 60px;
          font-size: var(--font-scale);
          border: none;
          flex: 1;
        }
        .instruction-textarea:focus {
          box-shadow: none;
          border-color: #86b7fe;
        }

        /* ===== CLICKABLE ROW ===== */
        .clickable-row {
          cursor: pointer;
        }
        .clickable-row:hover {
          background-color: #f0f8ff;
        }

        /* ===== BADGE STYLES ===== */
        .badge-info-custom {
          background-color: #17a2b8;
          color: #fff;
          font-size: calc(var(--font-scale) - 1px);
          padding: 2px 6px;
        }

        /* ===== DARK MODE SUPPORT ===== */
        body.dark-mode .reservation-responsive-container {
          background: #1a1a2e;
        }
        body.dark-mode .reservation-responsive-container .card {
          background: #2d2d44;
        }
        body.dark-mode .bordered-section {
          border-color: #444;
        }
        body.dark-mode .section-header {
          background: #3a3a5a;
          color: #eee;
        }
        body.dark-mode .rate-info-section {
          border-color: #444;
        }
        body.dark-mode .scrollable-table thead th {
          background-color: #3a3a5a !important;
          color: #eee;
        }
        body.dark-mode .scrollable-table td {
          border-color: #444 !important;
        }
        body.dark-mode .scrollable-table table {
          border-color: #444 !important;
        }
        body.dark-mode .fixed-bottom-bar {
          background: #2d2d44;
          border-top-color: #444;
        }
        body.dark-mode .counter-input {
          background: #3a3a5a;
          color: #eee;
        }
        body.dark-mode .counter-btn {
          background: #4a4a6a;
          color: #7ab7ff;
        }
        body.dark-mode .counter-btn:hover {
          background: #5a5a7a;
        }
        body.dark-mode .pax-display {
          background: #1a3a2a;
          border-color: #2a8a5a;
        }
        body.dark-mode .ex-pax-display {
          background: #3a2a1a;
          border-color: #8a6a2a;
        }
        body.dark-mode .room-charge-checkbox {
          background: #2d2d44;
          border-left-color: #444;
        }
        .fs-small { font-size: var(--font-scale); }
        .bg-danger-custom { background-color: #009de0 !important; }
        input.form-control-sm, select.form-select-sm{
          height: var(--input-scale) !important;
          min-height: var(--input-scale) !important;
          padding: 0 6px !important;
          font-size: var(--font-scale) !important;
        }
        .input-24 {
          height: var(--input-scale) !important;
          min-height: var(--input-scale) !important;
          padding: 2px 4px !important;
          font-size: var(--font-scale) !important;
        }
        .row-compact { margin-bottom: 4px !important; }
        .label-top { font-size: var(--font-scale); margin-bottom: 2px; display: block; }
        .light-gray-border {
          border: 1px solid #d3d3d3 !important;
          border-radius: 0.25rem;
        }
        .section-legend {
          font-size: var(--font-scale);
          font-weight: bold;
          margin-bottom: 4px;
          width: auto;
          border-bottom: none;
          padding: 0 5px;
        }
        .adult-control {
          display: flex;
          align-items: center;
          border: 1px solid #0d6efd;
          border-radius: 4px;
          overflow: hidden;
          height: var(--input-scale);
        }
        .adult-control button {
          width: 26px;
          height: var(--input-scale);
          border: none;
          background: #e7f3ff;
          color: #0d6efd;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          line-height: 1;
          flex-shrink: 0;
        }
        .adult-control input {
          width: 45px;
          height: var(--input-scale);
          border: none;
          text-align: center;
          font-weight: bold;
          font-size: 13px;
          background: #f8f9fa;
          outline: none;
          -moz-appearance: textfield;
        }
        .adult-control input::-webkit-inner-spin-button,
        .adult-control input::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .pax-banner {
          background: linear-gradient(90deg,#e8f7ff,#f0fff8);
          border: 1px solid #b8e4f9;
          border-radius: 6px;
          font-size: 0.68rem;
          padding: 4px 8px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .pax-badge {
          background: #009de0;
          color: #fff;
          border-radius: 10px;
          padding: 0 7px;
          font-size: 0.7rem;
          font-weight: bold;
        }
        .pax-badge-green {
          background: #198754;
        }
        .pax-badge-orange {
          background: #fd7e14;
        }
        .amount-display {
          font-weight: bold;
          color: #198754;
        }
        .pax-display-custom {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          padding: 2px 8px;
          font-weight: bold;
          font-size: 13px;
        }
        .pax-green {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        .pax-orange {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeeba;
        }

        /* ===== REG NO HEADER BAR - always shown, always at top ===== */
        .regno-header-bar {
          border-bottom: 1px solid #dee2e6;
          flex-shrink: 0;
        }

        /* ===== CANCEL BUTTON in reservation-no header bar (all screen sizes) ===== */
        .header-cancel-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: auto;
          background: #dc3545;
          color: #fff;
          border: none;
          height: 28px;
          padding: 0 10px;
          font-size: 14px;
          font-weight: 600;
          line-height: 1;
          cursor: pointer;
          border-radius: 4px;
          flex-shrink: 0;
          white-space: nowrap;
        }
        .header-cancel-btn:hover { background: #b02a37; }
        @media (max-width: 767.98px) {
          .header-cancel-btn {
            width: 30px;
            height: 30px;
            padding: 0;
            border-radius: 3px;
            font-size: 18px;
          }
          .header-cancel-label { display: none; }
        }

        /* ===== MOBILE/TABLET TAB NAV WRAPPER ===== */
        .mobile-tab-nav-wrapper {
          display: none;
          flex-shrink: 0;
        }
        .reservation-stage-mobile .mobile-tab-nav-wrapper,
        .reservation-stage-tablet .mobile-tab-nav-wrapper {
          display: block;
        }
        .reservation-stage-desktop .mobile-tab-nav-wrapper,
        .reservation-stage-laptop .mobile-tab-nav-wrapper,
        .reservation-stage-xl .mobile-tab-nav-wrapper {
          display: none !important;
        }

        /* ===== MOBILE/TABLET TAB NAV ===== */
        .mobile-tab-nav {
          display: none;
        }
        .reservation-stage-mobile .mobile-tab-nav,
        .reservation-stage-tablet .mobile-tab-nav {
          display: flex;
          background: #fff;
          border-bottom: 2px solid #dee2e6;
          overflow-x: auto;
          flex-shrink: 0;
        }
        .mobile-tab-nav .mtab-btn {
          flex: 1;
          min-width: 60px;
          padding: 6px 4px;
          border: none;
          background: transparent;
          border-bottom: 3px solid transparent;
          font-size: 10px !important;
          color: #666;
          text-align: center;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .mobile-tab-nav .mtab-btn.active {
          color: #0d6efd;
          border-bottom-color: #0d6efd;
          font-weight: 600;
          background: #f0f6ff;
        }
        .mobile-tab-nav .mtab-btn i {
          display: block;
          font-size: 14px !important;
          margin-bottom: 2px;
        }

        /* Progress bar for mobile/tablet */
        .mobile-tab-progress {
          display: none;
        }
        .reservation-stage-mobile .mobile-tab-progress,
        .reservation-stage-tablet .mobile-tab-progress {
          display: block;
          height: 4px;
          background: #e9ecef;
          flex-shrink: 0;
        }
        .mobile-tab-progress .progress-fill {
          height: 100%;
          background: #0d6efd;
          transition: width 0.3s ease;
        }

        /* Hide/show sections based on active tab (mobile/tablet only) */
        .reservation-stage-mobile .tab-section,
        .reservation-stage-tablet .tab-section {
          display: none !important;
        }
        .reservation-stage-mobile .tab-section.tab-active,
        .reservation-stage-tablet .tab-section.tab-active {
          display: flex !important;
        }
        /* Desktop/Laptop/XL: always show all sections normally */
        .reservation-stage-desktop .tab-section,
        .reservation-stage-laptop .tab-section,
        .reservation-stage-xl .tab-section {
          display: flex !important;
        }
        /* Desktop/Laptop/XL: hide tab nav */
        .reservation-stage-desktop .mobile-tab-nav,
        .reservation-stage-desktop .mobile-tab-progress,
        .reservation-stage-laptop .mobile-tab-nav,
        .reservation-stage-laptop .mobile-tab-progress,
        .reservation-stage-xl .mobile-tab-nav,
        .reservation-stage-xl .mobile-tab-progress {
          display: none !important;
        }

        /* Mobile: sticky top (reservation no + tabs), scroll middle, sticky bottom */
        @media (max-width: 767.98px) {
          .reservation-responsive-container {
            height: 100dvh;
            overflow: hidden;
          }
          .regno-header-bar { position: sticky; top: 0; z-index: 100; flex-shrink: 0; }
          .mobile-tab-nav-wrapper { position: sticky; top: 0; z-index: 99; flex-shrink: 0; }
          .reservation-scroll-body {
            flex: 1 1 0;
            overflow-y: auto;
            overflow-x: hidden;
            -webkit-overflow-scrolling: touch;
          }
          .fixed-bottom-bar { position: sticky; bottom: 0; z-index: 100; flex-shrink: 0; }
          .reservation-responsive-container .card { overflow: visible; flex-shrink: 0; }
          .reservation-responsive-container .card-body { overflow: visible !important; }
          .reservation-responsive-container form { overflow: visible; }
          .btn-label-text { display: none; }
          .btn-icon-only { padding: 0 8px !important; }
        }

        /* ===== LIGHT GRAY SCROLLBAR — Card.Body & reservation-scroll-body ===== */
        .card-body::-webkit-scrollbar,
        .reservation-scroll-body::-webkit-scrollbar { width: 5px; height: 5px; }
        .card-body::-webkit-scrollbar-track,
        .reservation-scroll-body::-webkit-scrollbar-track { background: #f5f5f5; }
        .card-body::-webkit-scrollbar-thumb,
        .reservation-scroll-body::-webkit-scrollbar-thumb { background: #d0d0d0; border-radius: 4px; }
        .card-body::-webkit-scrollbar-thumb:hover,
        .reservation-scroll-body::-webkit-scrollbar-thumb:hover { background: #b8b8b8; }

        /* ===== XL ENHANCEMENTS ===== */
        @media (min-width: 1920px) {
          .reservation-responsive-container { max-width: 2400px; }
          .scrollable-table { max-height: 160px; }
        }

        /* ===== MOBILE/Desktop LAYOUT STYLES ===== */
        /* Desktop: reduce gap between label and input */
        .reservation-stage-desktop .compact-label,
        .reservation-stage-laptop .compact-label,
        .reservation-stage-xl .compact-label {
          padding-right: 2px !important;
        }
        .reservation-stage-desktop .compact-input,
        .reservation-stage-laptop .compact-input,
        .reservation-stage-xl .compact-input {
          padding-left: 2px !important;
        }

        /* Mobile: label on left, input on right - inline row layout */
        @media (max-width: 767.98px) {
          .mobile-inline-row {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 4px;
          }
          .mobile-inline-row .mobile-label {
            flex: 0 0 85px;
            width: 85px;
            min-width: 85px;
            font-size: var(--font-scale);
            text-align: left;
            padding-right: 4px;
            color: #444;
            white-space: nowrap;
          }
          .mobile-inline-row .mobile-input {
            flex: 1;
            min-width: 0;
          }
          .mobile-inline-row .mobile-input select,
          .mobile-inline-row .mobile-input input {
            width: 100%;
          }
        }

        /* Mobile Room Details: 4-row grid layout */
        @media (max-width: 767.98px) {
          /* Row 1: Room Category, Convert Category, Rooms */
          .mobile-room-row1 {
            display: grid;
            grid-template-columns: 1.2fr 1.2fr 0.4fr;
            gap: 4px 6px;
            margin-bottom: 6px;
          }
          /* Row 2: Room Charges, Discount %, Discount Amt, Tax %, Tax Amt */
          .mobile-room-row2 {
            display: grid;
            grid-template-columns: 1fr 0.7fr 0.8fr 0.6fr 0.8fr;
            gap: 4px 6px;
            margin-bottom: 6px;
          }
          /* Row 3: Adult, Pax, Ex_Pax, Child Paid, Child Unpaid, Driver */
          .mobile-room-row3 {
            display: grid;
            grid-template-columns: 0.9fr 0.6fr 0.6fr 0.6fr 0.6fr 0.6fr;
            gap: 4px 6px;
            margin-bottom: 6px;
          }
          /* Row 4: Total + Add Button */
          .mobile-room-row4 {
            display: flex;
            align-items: flex-end;
            gap: 6px;
            margin-bottom: 4px;
          }
          .mobile-room-row4 .room-item:first-child {
            flex: 1 1 auto;
            min-width: 0;
          }
          .mobile-room-row4 .room-item:last-child {
            flex: 0 0 auto;
            width: 64px;
          }

          .mobile-room-row1 .room-item,
          .mobile-room-row2 .room-item,
          .mobile-room-row3 .room-item,
          .mobile-room-row4 .room-item {
            display: flex;
            flex-direction: column;
          }
          .mobile-room-row1 .room-item label,
          .mobile-room-row2 .room-item label,
          .mobile-room-row3 .room-item label,
          .mobile-room-row4 .room-item label {
            font-size: 9px;
            font-weight: 500;
            margin-bottom: 1px;
            color: #555;
          }
          .mobile-room-row1 .room-item input,
          .mobile-room-row1 .room-item .react-select__control,
          .mobile-room-row2 .room-item input,
          .mobile-room-row2 .room-item .react-select__control,
          .mobile-room-row3 .room-item input,
          .mobile-room-row3 .room-item .react-select__control,
          .mobile-room-row4 .room-item input,
          .mobile-room-row4 .room-item .react-select__control {
            height: 26px !important;
            min-height: 26px !important;
            font-size: 10px !important;
          }
          .mobile-room-row3 .room-item .counter-group {
            height: 26px;
          }
          .mobile-room-row3 .room-item .counter-btn {
            height: 26px;
            width: 22px;
            font-size: 12px;
          }
          .mobile-room-row3 .room-item .counter-input {
            height: 26px;
            width: 30px;
            font-size: 10px;
          }
          .mobile-room-row3 .room-item .pax-display,
          .mobile-room-row3 .room-item .ex-pax-display {
            height: 26px;
          }
          .mobile-room-row3 .room-item .pax-display span,
          .mobile-room-row3 .room-item .ex-pax-display span {
            font-size: 10px;
          }
          .mobile-room-row1 .room-item .form-control,
          .mobile-room-row2 .room-item .form-control,
          .mobile-room-row3 .room-item .form-control,
          .mobile-room-row4 .room-item .form-control {
            height: 26px !important;
            min-height: 26px !important;
            font-size: 10px !important;
            padding: 0 4px !important;
          }
          .mobile-room-row1 .room-item .form-control-sm,
          .mobile-room-row2 .room-item .form-control-sm,
          .mobile-room-row3 .room-item .form-control-sm,
          .mobile-room-row4 .room-item .form-control-sm {
            height: 26px !important;
            min-height: 26px !important;
          }
          .mobile-room-row4 .room-item .add-btn {
            height: 26px;
            font-size: 11px;
            padding: 0 6px;
            width: 100%;
          }
        }

        /* Mobile Booking Info: label on left, input on right */
        @media (max-width: 767.98px) {
          .mobile-booking-row {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 4px;
          }
          .mobile-booking-row .booking-label {
            flex: 0 0 90px;
            width: 90px;
            min-width: 90px;
            font-size: var(--font-scale);
            text-align: left;
            padding-right: 4px;
            color: #444;
            white-space: nowrap;
          }
          .mobile-booking-row .booking-input {
            flex: 1;
            min-width: 0;
          }
          .mobile-booking-row .booking-input select,
          .mobile-booking-row .booking-input input {
            width: 100%;
          }

          /* ===== BOOKED BY TABLE: horizontal scroll on mobile ===== */
          .booked-by-scroll-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            width: 100%;
          }
          .booked-by-scroll-wrapper::-webkit-scrollbar {
            height: 4px;
          }
          .booked-by-scroll-wrapper::-webkit-scrollbar-thumb {
            background: #c8c8c8;
            border-radius: 3px;
          }
          .booked-by-table {
            min-width: 520px;
          }
        }
      `}</style>

      <div className={`reservation-responsive-container reservation-stage-${layoutStage}`}>
        {/* ===== RESERVATION NO HEADER - Always at top (above tabs on mobile/tablet) ===== */}
        <div
          className="regno-header-bar d-flex align-items-center flex-wrap gap-2 px-2 py-1 bg-white"
          style={{ borderBottom: '1px solid #dee2e6' }}>
          <span className="d-flex align-items-center">
            <span className="fw-semibold me-1" style={{ fontSize: 'var(--font-scale)' }}>
              Reservation No:
            </span>
            <span className="badge bg-warning" style={{ fontSize: 'var(--font-scale)' }}>
              {values.reservationNo || 'New'}
            </span>
          </span>
          {/* Cancel button — top-right corner, all screen sizes */}
          <button
            type="button"
            className="header-cancel-btn ms-auto"
            onClick={() => navigate(-1)}
            title="Cancel">
            <i className="fi fi-rr-cross fs-6"></i>
            <span className="header-cancel-label"></span>
          </button>
        </div>

        {/* ===== MOBILE/TABLET TAB NAVIGATION (wrapped for sticky positioning) ===== */}
        <div className="mobile-tab-nav-wrapper">
          <div className="mobile-tab-nav">
            {mobileTabs.map((tab) => (
              <button
                key={tab.key}
                className={`mtab-btn${activeMobileTab === tab.key ? ' active' : ''}`}
                onClick={() => setActiveMobileTab(tab.key)}
                type="button">
                <i className={tab.icon}></i>
                {tab.label}
              </button>
            ))}
          </div>
          {/* Progress bar */}
          <div className="mobile-tab-progress">
            <div className="progress-fill" style={{ width: `${mobileTabProgress}%` }} />
          </div>
        </div>

        {/* ===== SCROLLABLE CENTER BODY (mobile only; desktop uses card overflow) ===== */}
        <div
          className="reservation-scroll-body flex-grow-1 d-flex flex-column"
          style={{ minHeight: 0 }}>
          {/* ===== MAIN CARD ===== */}
          <Card className="flex-grow-1 border-0">
            <Card.Body className="p-2 overflow-y-auto overflow-x-hidden">
              <form
                id="reservation-form"
                onSubmit={handleSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLElement;
                    if (target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') return;
                    e.preventDefault();
                    const form = e.currentTarget;
                    const focusable = Array.from(
                      form.querySelectorAll<HTMLElement>(
                        'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
                      )
                  ).filter((el) => !el.closest('.react-select__input') || el === document.activeElement);
                  const idx = focusable.indexOf(document.activeElement as HTMLElement);
                  if (idx >= 0 && idx < focusable.length - 1) {
                    focusable[idx + 1].focus();
                  }
                }
              }}>
              <Row className="g-2 align-items-stretch flex-shrink-0">
                {/* ===== COLUMN 1: Guest & Reservation Details ===== */}
                <Col
                  xs={leftColSpan}
                  className={`d-flex flex-column tab-section${activeMobileTab === 'guest' ? ' tab-active' : ''}`}>
                  <div className="bordered-section">
                    {/* Reservation Details */}
                    <div className="section-header">
                      <span className="fw-bold">Reservation Details</span>
                    </div>

                    {/* Desktop/Laptop/Tablet layout - compact gaps */}
                    <div className="d-none d-sm-block">
                    
                      <Row className="align-items-center g-1 mb-2">
                        <Col xs={12} md={3} className="fs-small compact-label">Date</Col>
                        <Col xs={12} md={9} className="compact-input">
                          <FormikTextInput
                            name="reservationDate"
                            type="date"
                            size="sm"
                            className="w-100 fs-small"
                          />
                        </Col>
                      </Row>

                      <Row className="align-items-center g-1 mb-2">
                        <Col xs={12} md={3} className="fs-small compact-label">Guest Type</Col>
                        <Col xs={12} md={9} className="compact-input">
                          <FormSelect
                            name="guestType"
                            options={guestTypeOptions}
                            size="sm"
                            className="w-100 fs-small"
                            isLoading={loadingGuestTypes}
                            placeholder="Select"
                          />
                        </Col>
                      </Row>

                      <Row className="align-items-center g-1 mb-2">
                        <Col xs={12} md={3} className="fs-small compact-label">Arrival Date</Col>
                        <Col xs={12} md={9} className="compact-input">
                          <Row className="g-1">
                            <Col xs={12} sm={7}>
                              <FormikTextInput
                                name="arrivalDate"
                                type="date"
                                size="sm"
                                className="w-100 fs-small"
                              />
                            </Col>
                            <Col xs={12} sm={5}>
                              <FormikTextInput
                                name="arrivalTime"
                                type="time"
                                size="sm"
                                className="w-100 fs-small"
                              />
                            </Col>
                          </Row>
                        </Col>
                      </Row>

                      <Row className="align-items-center g-1 mb-2">
                        <Col xs={12} md={3} className="fs-small compact-label">No of Days</Col>
                        <Col xs={12} md={9} className="compact-input">
                          <FormikTextInput
                            name="nights"
                            type="number"
                            size="sm"
                            className="w-100 fs-small"
                          />
                        </Col>
                      </Row>

                      <Row className="align-items-center g-1 mb-2">
                        <Col xs={12} md={3} className="fs-small compact-label">Departure Date</Col>
                        <Col xs={12} md={9} className="compact-input">
                          <Row className="g-1">
                            <Col xs={12} sm={7}>
                              <FormikTextInput
                                name="departureDate"
                                type="date"
                                size="sm"
                                className="w-100 fs-small"
                              />
                            </Col>
                            <Col xs={12} sm={5}>
                              <FormikTextInput
                                name="departureTime"
                                type="time"
                                size="sm"
                                className="w-100 fs-small"
                              />
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                    </div>

                    {/* Mobile layout - label on left, input on right */}
                    <div className="d-sm-none">
                     
                      <div className="mobile-inline-row">
                        <span className="mobile-label">Date</span>
                        <div className="mobile-input">
                          <FormikTextInput
                            name="reservationDate"
                            type="date"
                            size="sm"
                            className="w-100 fs-small"
                          />
                        </div>
                      </div>

                      <div className="mobile-inline-row">
                        <span className="mobile-label">Guest Type</span>
                        <div className="mobile-input">
                          <FormSelect
                            name="guestType"
                            options={guestTypeOptions}
                            size="sm"
                            className="w-100 fs-small"
                            isLoading={loadingGuestTypes}
                            placeholder="Select"
                          />
                        </div>
                      </div>

                      <div className="mobile-inline-row">
                        <span className="mobile-label">Arrival Date</span>
                        <div className="mobile-input">
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <FormikTextInput
                              name="arrivalDate"
                              type="date"
                              size="sm"
                              className="w-100 fs-small"
                              style={{ flex: 1 }}
                            />
                            <FormikTextInput
                              name="arrivalTime"
                              type="time"
                              size="sm"
                              className="w-100 fs-small"
                              style={{ flex: '0 0 60px' }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mobile-inline-row">
                        <span className="mobile-label">No of Days</span>
                        <div className="mobile-input">
                          <FormikTextInput
                            name="nights"
                            type="number"
                            size="sm"
                            className="w-100 fs-small"
                          />
                        </div>
                      </div>

                      <div className="mobile-inline-row">
                        <span className="mobile-label">Departure Date</span>
                        <div className="mobile-input">
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <FormikTextInput
                              name="departureDate"
                              type="date"
                              size="sm"
                              className="w-100 fs-small"
                              style={{ flex: 1 }}
                            />
                            <FormikTextInput
                              name="departureTime"
                              type="time"
                              size="sm"
                              className="w-100 fs-small"
                              style={{ flex: '0 0 60px' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Guest Information */}
                    <div className="section-header mt-1">
                      <span className="fw-bold">Guest Information</span>
                    </div>

                    {/* Desktop/Laptop/Tablet layout - compact gaps */}
                    <div className="d-none d-sm-block">
                      <Row className="align-items-center g-1 mb-2">
                        <Col xs={12} md={3} className="fs-small compact-label">Name</Col>
                        <Col xs={12} md={9} className="compact-input">
                          <Row className="g-1 align-items-center">
                            {/* Title input - fixed narrow width, e.g. "MR" */}
                            <Col xs="auto" style={{ width: '42px' }}>
                              <FormikTextInput
                                name="title"
                                placeholder="MR"
                                size="sm"
                                className="w-100 fs-small text-center"
                                style={{ height: '29px' }}
                              />
                            </Col>
                            {/* Guest Search - takes remaining space */}
                            <Col style={{ flex: '1', minWidth: '110px' }}>
                              <Select<Option, false>
                                options={guestOptions}
                                isLoading={searchingGuests}
                                className="w-100 fs-small"
                                styles={selectStyles}
                                value={guestOptions.find((o) => Number(o.value) === values.guestId) || null}
                                onChange={(opt) => {
                                  if (opt?.value) {
                                    const guestId = Number(opt.value);
                                    setFieldValue('guestId', guestId);
                                    loadGuestDetails(guestId);
                                  } else {
                                    setFieldValue('guestId', null);
                                    setFieldValue('title', 'MR');
                                    setFieldValue('firstName', '');
                                    setFieldValue('lastName', '');
                                    setFieldValue('phone1', '');
                                    setFieldValue('phone2', '');
                                    setFieldValue('email', '');
                                    setFieldValue('address', '');
                                    setFieldValue('countryId', '');
                                    setFieldValue('stateId', '');
                                    setFieldValue('cityId', '');
                                    setFieldValue('actualCountryId', null);
                                    setFieldValue('actualStateId', null);
                                    setFieldValue('actualCityId', null);
                                    setFieldValue('idType', null);
                                    setFieldValue('idNumber', '');
                                    setFieldValue('otherInfo', '');
                                    setFieldValue('companyId', null);
                                    setFieldValue('gst', '');
                                  }
                                }}
                                onInputChange={(inputValue, { action }) => {
                                  if (action === 'input-change') handleGuestSearch(inputValue);
                                }}
                                onMenuOpen={() => {
                                  if (!guestOptions.length && hotelId) loadAllGuests();
                                }}
                                placeholder="Search Guest Name"
                                isClearable
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                              />
                            </Col>
                            {/* Add Button - fixed compact square */}
                            <Col xs="auto" style={{ width: '36px', paddingLeft: '3px' }}>
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                style={{
                                  height: '29px',
                                  width: '32px',
                                  padding: '0',
                                  fontSize: '15px',
                                  lineHeight: '1',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: '4px',
                                }}
                                onClick={() => setShowGuestModal(true)}>
                                +
                              </button>
                            </Col>
                          </Row>
                        </Col>
                      </Row>

                      <input type="hidden" {...formik.getFieldProps('firstName')} />
                      <input type="hidden" {...formik.getFieldProps('lastName')} />

                      <Row className="align-items-center g-1 mb-2">
                        <Col xs={12} md={3} className="fs-small compact-label">Mobile</Col>
                        <Col xs={12} md={9}>
                          <Row className="g-1">
                            <Col xs={12} sm={6}>
                              <FormikTextInput
                                name="phone1"
                                size="sm"
                                className="w-100 fs-small"
                                placeholder="Mobile 1"
                                readOnly
                              />
                            </Col>
                            <Col xs={12} sm={6}>
                              <FormikTextInput
                                name="phone2"
                                size="sm"
                                className="w-100 fs-small"
                                placeholder="Mobile 2"
                                readOnly
                              />
                            </Col>
                          </Row>
                        </Col>
                      </Row>

                      <Row className="align-items-center g-1 mb-2">
                        <Col xs={12} md={3} className="fs-small compact-label">Email</Col>
                        <Col xs={12} md={9} className="compact-input">
                          <FormikTextInput
                            name="email"
                            size="sm"
                            className="w-100 fs-small"
                            placeholder="Email"
                            readOnly
                          />
                        </Col>
                      </Row>

                      <Row className="align-items-center g-1 mb-2">
                        <Col xs={12} md={3} className="fs-small compact-label">Address</Col>
                        <Col xs={12} md={9} className="compact-input">
                          <FormikTextInput
                            name="address"
                            as="textarea"
                            rows={2}
                            className="w-100 fs-small"
                            readOnly
                          />
                        </Col>
                      </Row>

                      <Row className="align-items-center g-1 mb-2">
                        <Col xs={12} md={3} className="fs-small compact-label">Country</Col>
                        <Col xs={12} md={9} className="compact-input">
                          <FormikTextInput
                            name="countryId"
                            placeholder="Country"
                            size="sm"
                            className="w-100 fs-small"
                            readOnly
                          />
                        </Col>
                      </Row>

                      <Row className="align-items-center g-1 mb-2">
                        <Col xs={12} md={3} className="fs-small compact-label">State</Col>
                        <Col xs={12} md={9} className="compact-input">
                          <FormikTextInput
                            name="stateId"
                            placeholder="State"
                            size="sm"
                            className="w-100 fs-small"
                            readOnly
                          />
                        </Col>
                      </Row>

                      <Row className="align-items-center g-1 mb-2">
                        <Col xs={12} md={3} className="fs-small compact-label">City</Col>
                        <Col xs={12} md={9} className="compact-input">
                          <FormikTextInput
                            name="cityId"
                            placeholder="City"
                            size="sm"
                            className="w-100 fs-small"
                            readOnly
                          />
                        </Col>
                      </Row>
                    </div>

                    {/* Mobile layout - label on left, input on right */}
                    <div className="d-sm-none">
                      <div className="mobile-inline-row">
                        <span className="mobile-label">Name</span>
                        <div className="mobile-input">
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <div style={{ flex: '0 0 40px' }}>
                              <FormikTextInput
                                name="title"
                                placeholder="MR"
                                size="sm"
                                className="w-100 fs-small"
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <Select<Option, false>
                                options={guestOptions}
                                isLoading={searchingGuests}
                                className="w-100 fs-small"
                                styles={selectStyles}
                                value={guestOptions.find((o) => Number(o.value) === values.guestId) || null}
                                onChange={(opt) => {
                                  if (opt?.value) {
                                    const guestId = Number(opt.value);
                                    setFieldValue('guestId', guestId);
                                    loadGuestDetails(guestId);
                                  } else {
                                    setFieldValue('guestId', null);
                                    setFieldValue('title', 'MR');
                                    setFieldValue('firstName', '');
                                    setFieldValue('lastName', '');
                                    setFieldValue('phone1', '');
                                    setFieldValue('phone2', '');
                                    setFieldValue('email', '');
                                    setFieldValue('address', '');
                                    setFieldValue('countryId', '');
                                    setFieldValue('stateId', '');
                                    setFieldValue('cityId', '');
                                    setFieldValue('actualCountryId', null);
                                    setFieldValue('actualStateId', null);
                                    setFieldValue('actualCityId', null);
                                    setFieldValue('idType', null);
                                    setFieldValue('idNumber', '');
                                    setFieldValue('otherInfo', '');
                                    setFieldValue('companyId', null);
                                    setFieldValue('gst', '');
                                  }
                                }}
                                onInputChange={(inputValue, { action }) => {
                                  if (action === 'input-change') handleGuestSearch(inputValue);
                                }}
                                onMenuOpen={() => {
                                  if (!guestOptions.length && hotelId) loadAllGuests();
                                }}
                                placeholder="Search Guest"
                                isClearable
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                              />
                            </div>
                            <button
                              type="button"
                              className="btn btn-success btn-sm p-0"
                              style={{ height: '29px', width: '29px', flexShrink: 0 }}
                              onClick={() => setShowGuestModal(true)}>
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <input type="hidden" {...formik.getFieldProps('firstName')} />
                      <input type="hidden" {...formik.getFieldProps('lastName')} />

                      <div className="mobile-inline-row">
                        <span className="mobile-label">Mobile</span>
                        <div className="mobile-input">
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <FormikTextInput
                              name="phone1"
                              size="sm"
                              className="w-100 fs-small"
                              placeholder="Mobile 1"
                              readOnly
                              style={{ flex: 1 }}
                            />
                            <FormikTextInput
                              name="phone2"
                              size="sm"
                              className="w-100 fs-small"
                              placeholder="Mobile 2"
                              readOnly
                              style={{ flex: 1 }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mobile-inline-row">
                        <span className="mobile-label">Email</span>
                        <div className="mobile-input">
                          <FormikTextInput
                            name="email"
                            size="sm"
                            className="w-100 fs-small"
                            placeholder="Email"
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="mobile-inline-row">
                        <span className="mobile-label">Address</span>
                        <div className="mobile-input">
                          <FormikTextInput
                            name="address"
                            as="textarea"
                            rows={2}
                            className="w-100 fs-small"
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="mobile-inline-row">
                        <span className="mobile-label">Country</span>
                        <div className="mobile-input">
                          <FormikTextInput
                            name="countryId"
                            placeholder="Country"
                            size="sm"
                            className="w-100 fs-small"
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="mobile-inline-row">
                        <span className="mobile-label">State</span>
                        <div className="mobile-input">
                          <FormikTextInput
                            name="stateId"
                            placeholder="State"
                            size="sm"
                            className="w-100 fs-small"
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="mobile-inline-row">
                        <span className="mobile-label">City</span>
                        <div className="mobile-input">
                          <FormikTextInput
                            name="cityId"
                            placeholder="City"
                            size="sm"
                            className="w-100 fs-small"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="section-header mt-1">
                      <span className="fw-bold">Instructions</span>
                    </div>

                    <Row className="g-1 ">
                      <Col xs={12} md={6}>
                        <label className="fs-small">Billing Instructions</label>
                        <textarea
                          {...formik.getFieldProps('billingInstructions')}
                          rows={2}
                          className="w-100 fs-small instruction-textarea"
                          placeholder="Billing instructions"
                        />
                      </Col>
                      <Col xs={12} md={6}>
                        <label className="fs-small">Special Instructions</label>
                        <textarea
                          {...formik.getFieldProps('specialInstructions')}
                          rows={2}
                          className="w-100 fs-small instruction-textarea"
                          placeholder="Special instructions"
                        />
                      </Col>
                    </Row>
                  </div>
                </Col>

                {/* ===== COLUMN 2: Room Details ===== */}
                <Col
                  xs={rightColSpan}
                  className={`d-flex flex-column tab-section${activeMobileTab === 'room' ? ' tab-active' : ''}`}>
                  <div className="bordered-section">
                    <div className="section-header">
                      <span className="fw-bold">Room Details</span>
                    </div>

                    {/* Room input fields - Desktop/Laptop/Tablet */}
                    <div className="d-none d-sm-block">
                      <Row className="g-1 mb-2 align-items-end">
                        <Col xs="auto" style={{ flex: '1', minWidth: '130px' }}>
                          <label className="form-label-sm">Room Category</label>
                          <Select<NumericOption, false>
                            name="roomCategory"
                            options={categoryOptionsNumeric}
                            isLoading={loadingCategories}
                            className="fs-small"
                            styles={selectStyles}
                            value={categoryOptionsNumeric.find((o) => o.value === Number(values.roomCategory)) || null}
                            onChange={(opt) => {
                              const catId = opt?.value ?? null;
                              setFieldValue('roomCategory', catId);
                              handleRoomCategoryChange(catId);
                            }}
                            placeholder="Select"
                            isClearable
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                          />
                        </Col>
                        <Col xs="auto" style={{ flex: '1', minWidth: '130px' }}>
                          <label className="form-label-sm">Converted Category</label>
                          <Select<NumericOption, false>
                            name="convertedCategory"
                            options={categoryOptionsNumeric}
                            isLoading={loadingCategories}
                            className="fs-small"
                            styles={selectStyles}
                            value={categoryOptionsNumeric.find((o) => o.value === Number(values.convertedCategory)) || null}
                            onChange={(opt) => {
                              const catId = opt?.value ?? null;
                              setFieldValue('convertedCategory', catId);
                              handleConvertedCategoryChange(catId);
                            }}
                            placeholder="Select"
                            isClearable
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                          />
                        </Col>
                        <Col xs="auto" style={{ width: '70px' }}>
                          <label className="form-label-sm">Rooms</label>
                          <FormikTextInput
                            name="roomsNo"
                            type="number"
                            size="sm"
                            className="w-100 fs-small"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setFieldValue('roomsNo', e.target.value);
                              recalculateRoomTotal();
                            }}
                          />
                        </Col>
                        <Col xs="auto" style={{ width: '90px' }}>
                          <label className="form-label-sm">Room Charge</label>
                          <FormikTextInput
                            name="roomCharge"
                            type="number"
                            size="sm"
                            className="w-100 fs-small"
                            value={displayRoomCharge}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setFieldValue('roomCharge', e.target.value);
                              recalculateRoomTotal();
                            }}
                          />
                        </Col>
                        <Col xs="auto" style={{ width: '75px' }}>
                          <label className="form-label-sm">Discount %</label>
                          <FormikTextInput
                            name="discount"
                            type="number"
                            size="sm"
                            className="w-100 fs-small"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setFieldValue('discount', e.target.value);
                              recalculateRoomTotal();
                            }}
                          />
                        </Col>
                        <Col xs="auto" style={{ width: '90px' }}>
                          <label className="form-label-sm">Discount Amt</label>
                          <FormikTextInput
                            name="discountAmt"
                            type="number"
                            size="sm"
                            className="w-100 fs-small"
                            readOnly
                            value={formatToTwoDecimals(values.discountAmt)}
                          />
                        </Col>
                        <Col xs="auto" style={{ width: '75px' }}>
                          <label className="form-label-sm">Tax %</label>
                          <FormikTextInput
                            name="taxPercent"
                            type="number"
                            size="sm"
                            className="w-100 fs-small"
                            value={displayTaxPercent}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setFieldValue('taxPercent', e.target.value);
                              recalculateRoomTotal();
                            }}
                          />
                        </Col>
                        <Col xs="auto" style={{ width: '90px' }}>
                          <label className="form-label-sm">Tax Amount</label>
                          <FormikTextInput
                            name="taxAmount"
                            type="number"
                            size="sm"
                            className="w-100 fs-small"
                            readOnly
                            value={displayTaxAmount}
                          />
                        </Col>
                      </Row>
                    </div>

                    {/* Mobile Room Details - 4-row grid layout */}
                    <div className="d-sm-none">
                      {/* Row 1: Room Category, Convert Category, Rooms */}
                      <div className="mobile-room-row1">
                        <div className="room-item">
                          <label>Room Category</label>
                          <Select<NumericOption, false>
                            name="roomCategory"
                            options={categoryOptionsNumeric}
                            isLoading={loadingCategories}
                            className="fs-small"
                            styles={selectStyles}
                            value={categoryOptionsNumeric.find((o) => o.value === Number(values.roomCategory)) || null}
                            onChange={(opt) => {
                              const catId = opt?.value ?? null;
                              setFieldValue('roomCategory', catId);
                              handleRoomCategoryChange(catId);
                            }}
                            placeholder="Select"
                            isClearable
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                          />
                        </div>
                        <div className="room-item">
                          <label>Convert Category</label>
                          <Select<NumericOption, false>
                            name="convertedCategory"
                            options={categoryOptionsNumeric}
                            isLoading={loadingCategories}
                            className="fs-small"
                            styles={selectStyles}
                            value={categoryOptionsNumeric.find((o) => o.value === Number(values.convertedCategory)) || null}
                            onChange={(opt) => {
                              const catId = opt?.value ?? null;
                              setFieldValue('convertedCategory', catId);
                              handleConvertedCategoryChange(catId);
                            }}
                            placeholder="Select"
                            isClearable
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                          />
                        </div>
                        <div className="room-item">
                          <label>Rooms</label>
                          <FormikTextInput
                            name="roomsNo"
                            type="number"
                            size="sm"
                            className="w-100 fs-small"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setFieldValue('roomsNo', e.target.value);
                              recalculateRoomTotal();
                            }}
                          />
                        </div>
                      </div>

                      {/* Row 2: Room Charges, Discount %, Discount Amt, Tax %, Tax Amt */}
                      <div className="mobile-room-row2">
                        <div className="room-item">
                          <label>Room Charge</label>
                          <FormikTextInput
                            name="roomCharge"
                            type="number"
                            size="sm"
                            className="w-100 fs-small"
                            value={displayRoomCharge}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setFieldValue('roomCharge', e.target.value);
                              recalculateRoomTotal();
                            }}
                          />
                        </div>
                        <div className="room-item">
                          <label>Discount %</label>
                          <FormikTextInput
                            name="discount"
                            type="number"
                            size="sm"
                            className="w-100 fs-small"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setFieldValue('discount', e.target.value);
                              recalculateRoomTotal();
                            }}
                          />
                        </div>
                        <div className="room-item">
                          <label>Discount Amt</label>
                          <FormikTextInput
                            name="discountAmt"
                            type="number"
                            size="sm"
                            className="w-100 fs-small"
                            readOnly
                            value={formatToTwoDecimals(values.discountAmt)}
                          />
                        </div>
                        <div className="room-item">
                          <label>Tax %</label>
                          <FormikTextInput
                            name="taxPercent"
                            type="number"
                            size="sm"
                            className="w-100 fs-small"
                            value={displayTaxPercent}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setFieldValue('taxPercent', e.target.value);
                              recalculateRoomTotal();
                            }}
                          />
                        </div>
                        <div className="room-item">
                          <label>Tax Amount</label>
                          <FormikTextInput
                            name="taxAmount"
                            type="number"
                            size="sm"
                            className="w-100 fs-small"
                            readOnly
                            value={displayTaxAmount}
                          />
                        </div>
                      </div>

                      {/* Row 3: Adult, Pax, Ex_Pax, Child Paid, Child Unpaid, Driver */}
                      <div className="mobile-room-row3">
                        <div className="room-item">
                          <label className="fw-bold text-primary">👤 Adults</label>
                          <div className="counter-group">
                            <button
                              type="button"
                              className="counter-btn"
                              onClick={() => {
                                setFieldValue('adult', Math.max(0, (values.adult || 0) - 1));
                                recalculateRoomTotal();
                              }}>
                              −
                            </button>
                            <input
                              type="number"
                              className="counter-input"
                              value={values.adult || 0}
                              min={0}
                              onChange={(e) => {
                                setFieldValue('adult', Math.max(0, Number(e.target.value)));
                                recalculateRoomTotal();
                              }}
                            />
                            <button
                              type="button"
                              className="counter-btn"
                              onClick={() => {
                                setFieldValue('adult', (values.adult || 0) + 1);
                                recalculateRoomTotal();
                              }}>
                              +
                            </button>
                          </div>
                        </div>
                        <div className="room-item">
                          <label className="text-success">Pax</label>
                          <div className="pax-display">
                            <span>{values.pax || 0}</span>
                          </div>
                        </div>
                        <div className="room-item">
                          <label style={{ color: '#dc6500' }}>Ex_Pax</label>
                          <div className="ex-pax-display">
                            <span>{values.exPax || 0}</span>
                          </div>
                        </div>
                        <div className="room-item">
                          <label>Child Paid</label>
                          <FormikTextInput
                            name="childPaid"
                            type="number"
                            size="sm"
                            className="w-100 fs-small"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setFieldValue('childPaid', e.target.value);
                              recalculateRoomTotal();
                            }}
                          />
                        </div>
                        <div className="room-item">
                          <label>C.Unpaid</label>
                          <FormikTextInput
                            name="childUnpaid"
                            type="number"
                            size="sm"
                            className="w-100 fs-small"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setFieldValue('childUnpaid', e.target.value);
                              recalculateRoomTotal();
                            }}
                          />
                        </div>
                        <div className="room-item">
                          <label>Driver</label>
                          <FormikTextInput
                            name="driver"
                            type="number"
                            size="sm"
                            className="w-100 fs-small"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setFieldValue('driver', e.target.value);
                              recalculateRoomTotal();
                            }}
                          />
                        </div>
                      </div>

                      {/* Row 4: Total + Add Button */}
                      <div className="mobile-room-row4">
                        <div className="room-item">
                          <label className="fw-bold text-success">Total</label>
                          <FormikTextInput
                            name="total"
                            type="text"
                            size="sm"
                            className="w-100 fs-small fw-bold amount-display"
                            readOnly
                            value={displayTotal}
                          />
                        </div>
                        <div className="room-item">
                          <label style={{ opacity: 0 }}>Add</label>
                          <Button
                            size="sm"
                            variant="success"
                            className="add-btn"
                            onClick={handleAddOrUpdateRow}>
                            {editingRowId ? 'Update' : 'Add'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Pax Controls - Desktop/Laptop/Tablet */}
                    <div className="d-none d-sm-block">
                      <Row className="g-2 mb-2 align-items-end">
                        <Col xs="auto" style={{ width: '100px' }}>
                          <label className="form-label-sm fw-bold text-primary">👤 Adults</label>
                          <div className="counter-group">
                            <button
                              type="button"
                              className="counter-btn"
                              onClick={() => {
                                setFieldValue('adult', Math.max(0, (values.adult || 0) - 1));
                                recalculateRoomTotal();
                              }}>
                              −
                            </button>
                            <input
                              type="number"
                              className="counter-input"
                              value={values.adult || 0}
                              min={0}
                              onChange={(e) => {
                                setFieldValue('adult', Math.max(0, Number(e.target.value)));
                                recalculateRoomTotal();
                              }}
                            />
                            <button
                              type="button"
                              className="counter-btn"
                              onClick={() => {
                                setFieldValue('adult', (values.adult || 0) + 1);
                                recalculateRoomTotal();
                              }}>
                              +
                            </button>
                          </div>
                        </Col>

                        <Col xs="auto" style={{ width: '70px' }}>
                          <label className="form-label-sm d-block text-success">Pax</label>
                          <div className="pax-display">
                            <span>{values.pax || 0}</span>
                          </div>
                        </Col>

                        <Col xs="auto" style={{ width: '75px' }}>
                          <label className="form-label-sm d-block" style={{ color: '#dc6500' }}>Ex_Pax</label>
                          <div className="ex-pax-display">
                            <span>{values.exPax || 0}</span>
                          </div>
                        </Col>

                        <Col xs="auto" style={{ width: '80px' }}>
                          <label className="form-label-sm">Child Paid</label>
                          <FormikTextInput
                            name="childPaid"
                            type="number"
                            size="sm"
                            className="w-100 fs-small"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setFieldValue('childPaid', e.target.value);
                              recalculateRoomTotal();
                            }}
                          />
                        </Col>
                        <Col xs="auto" style={{ width: '80px' }}>
                          <label className="form-label-sm">C.Unpaid</label>
                          <FormikTextInput
                            name="childUnpaid"
                            type="number"
                            size="sm"
                            className="w-100 fs-small"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setFieldValue('childUnpaid', e.target.value);
                              recalculateRoomTotal();
                            }}
                          />
                        </Col>
                        <Col xs="auto" style={{ width: '75px' }}>
                          <label className="form-label-sm">Driver</label>
                          <FormikTextInput
                            name="driver"
                            type="number"
                            size="sm"
                            className="w-100 fs-small"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setFieldValue('driver', e.target.value);
                              recalculateRoomTotal();
                            }}
                          />
                        </Col>
                        <Col xs="auto" style={{ width: '100px' }}>
                          <label className="form-label-sm fw-bold text-success">Total</label>
                          <FormikTextInput
                            name="total"
                            type="text"
                            size="sm"
                            className="w-100 fs-small fw-bold amount-display"
                            readOnly
                            value={displayTotal}
                          />
                        </Col>
                        <Col xs="auto" style={{ width: '70px' }}>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={handleAddOrUpdateRow}
                            style={{ height: 'var(--input-scale)', fontSize: 'var(--font-scale)', padding: '1px 6px' }}>
                            {editingRowId ? 'Update' : 'Add'}
                          </Button>
                        </Col>
                      </Row>
                    </div>

                    {/* Scrollable table */}
                    <div className="scrollable-table mt-2 mb-2">
                      <table
                        className="table table-bordered table-sm-compact mb-0"
                        style={{
                          borderColor: '#d1d1d1',
                          minWidth: '1200px',
                          whiteSpace: 'nowrap',
                        }}>
                        <thead>
                          <tr className="text-center" style={{ backgroundColor: '#d9d9d9' }}>
                            <th style={{ width: '40px' }}>#</th>
                            <th style={{ minWidth: '100px' }}>Guest</th>
                            <th style={{ width: '70px' }}>GuestID</th>
                            <th style={{ width: '60px' }}>Rooms</th>
                            <th style={{ minWidth: '100px' }}>Category</th>
                            <th style={{ minWidth: '100px' }}>Conv. Cat</th>
                            <th style={{ width: '100px' }}>A_Date</th>
                            <th style={{ width: '80px' }}>A_Time</th>
                            <th style={{ width: '100px' }}>D_Date</th>
                            <th style={{ width: '80px' }}>D_Time</th>
                            <th style={{ width: '60px' }}>Adults</th>
                            <th style={{ width: '50px' }}>Pax</th>
                            <th style={{ width: '55px' }}>Ex_Pax</th>
                            <th style={{ width: '80px' }}>Ex_Pax Price</th>
                            <th style={{ width: '75px' }}>Ex_Pax Tax%</th>
                            <th style={{ width: '75px' }}>Ex_Pax Tax</th>
                            <th style={{ width: '85px' }}>Ex_Pax Total</th>
                            <th style={{ width: '75px' }}>Child Paid</th>
                            <th style={{ width: '80px' }}>Child Unpaid</th>
                            <th style={{ width: '80px' }}>Child Price</th>
                            <th style={{ width: '75px' }}>Child Tax%</th>
                            <th style={{ width: '75px' }}>Child Tax</th>
                            <th style={{ width: '85px' }}>Child Total</th>
                            <th style={{ width: '60px' }}>Driver</th>
                            <th style={{ width: '80px' }}>Driver Price</th>
                            <th style={{ width: '75px' }}>Driver Tax%</th>
                            <th style={{ width: '75px' }}>Driver Tax</th>
                            <th style={{ width: '85px' }}>Driver Total</th>
                            <th style={{ width: '50px' }}>Days</th>
                            <th style={{ width: '70px' }}>Rate</th>
                            <th style={{ width: '60px' }}>Dis%</th>
                            <th style={{ width: '75px' }}>Dis Amt</th>
                            <th style={{ width: '60px' }}>Tax%</th>
                            <th style={{ width: '75px' }}>Tax Amt</th>
                            <th style={{ width: '85px' }}>Total</th>
                            <th style={{ width: '70px' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roomRows.map((row, index) => (
                            <tr
                              key={row.id}
                              className="text-center clickable-row"
                              style={{ backgroundColor: selectedRowId === row.id ? '#a6ffd5' : '' }}
                              onClick={() => {
                                setSelectedRowId(row.id);
                                handleEditRow(row);
                              }}>
                              <td>{index + 1}</td>
                              <td>{row.guestName}</td>
                              <td>{row.guestId}</td>
                              <td>{row.total_rooms}</td>
                              <td>{row.roomCategoryName}</td>
                              <td>{row.convertedCategoryName || '-'}</td>
                              <td>{row.arrivalDate}</td>
                              <td>{row.arrivalTime}</td>
                              <td>{row.departureDate}</td>
                              <td>{row.departureTime}</td>
                              <td>{row.adult}</td>
                              <td>{row.pax}</td>
                              <td>{row.exPax}</td>
                              <td>{safeToFixed(row.exPaxPrice)}</td>
                              <td>{safeToFixed(row.exPaxTaxPercent)}%</td>
                              <td>{safeToFixed(row.exPaxTax)}</td>
                              <td>{safeToFixed(row.exPaxTotal * row.total_rooms * row.nights)}</td>
                              <td>{row.childPaid}</td>
                              <td>{row.childUnpaid}</td>
                              <td>{safeToFixed(row.childPrice)}</td>
                              <td>{safeToFixed(row.childTaxPercent)}%</td>
                              <td>{safeToFixed(row.childTax)}</td>
                              <td>{safeToFixed(row.childTotal * row.total_rooms * row.nights)}</td>
                              <td>{row.driver}</td>
                              <td>{safeToFixed(row.driverPrice)}</td>
                              <td>{safeToFixed(row.driverTaxPercent)}%</td>
                              <td>{safeToFixed(row.driverTax)}</td>
                              <td>{safeToFixed(row.driverTotal * row.total_rooms * row.nights)}</td>
                              <td>{row.nights}</td>
                              <td>{safeToFixed(row.rate)}</td>
                              <td>{safeToFixed(row.discountPercent)}%</td>
                              <td>{safeToFixed(row.discountAmt)}</td>
                              <td>{safeToFixed(row.taxPercent)}%</td>
                              <td>{safeToFixed(row.taxAmount)}</td>
                              <td>{safeToFixed(row.totalAmount)}</td>
                              <td onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  className="p-0"
                                  onClick={() => handleDeleteRow(row.id)}
                                  style={{
                                    height: '20px',
                                    minHeight: '20px',
                                    padding: '0 4px',
                                    lineHeight: 1,
                                  }}>
                                  <i className="fi fi-rr-trash" style={{ fontSize: '12px' }} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                          {/* Empty rows to fill the table height - shows 3 rows on mobile, 7 rows on desktop */}
                          {Array.from({ length: Math.max(0, 6 - roomRows.length) }).map((_, index) => (
                            <tr key={`empty-${index}`} style={{ height: '28px' }}>
                              <td colSpan={36}></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Booked By Details */}
                    <div className="light-gray-border p-1 mt-1 mb-2">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fs-small fw-bold">Booked By Details</span>
                        <Button
                          size="sm"
                          variant="success"
                          style={{ fontSize: 'var(--font-scale)', lineHeight: '1.2', height: 'var(--button-scale)', padding: '2px 10px' }}
                          onClick={() => setShowBookedByModal(true)}>
                          {bookedBy ? 'Edit' : 'Add'}
                        </Button>
                      </div>
                      <div className="booked-by-scroll-wrapper">
                      <table className="table table-bordered booked-by-table mb-1" style={{ borderColor: '#d1d1d1' }}>
                        <thead>
                          <tr className="text-center" style={{ backgroundColor: '#d9d9d9' }}>
                            <th style={{ width: '180px' }}>Name</th>
                            <th>Mobile 1</th>
                            <th>Mobile 2</th>
                            <th>Email</th>
                            <th>Website</th>
                            <th>Address</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="booked-by-name-cell" style={{ width: '180px' }}>
                              <div className="has-select" style={{ width: '100%' }}>
                                <Select<Option, false>
                                  options={bookedByOptions}
                                  styles={bookedBySelectStyles}
                                  value={
                                    bookedBy
                                      ? { label: bookedBy.name, value: bookedBy.booked_by_id }
                                      : null
                                  }
                                  onChange={handleBookedBySelect}
                                  placeholder="Select..."
                                  isClearable
                                  menuPortalTarget={document.body}
                                  menuPosition="fixed"
                                />
                              </div>
                            </td>
                            <td className="text-center">{bookedBy?.mobile1 || '-'}</td>
                            <td className="text-center">{bookedBy?.mobile2 || '-'}</td>
                            <td className="text-center">{bookedBy?.email || '-'}</td>
                            <td className="text-center">{bookedBy?.website || '-'}</td>
                            <td className="text-center">{bookedBy?.address || '-'}</td>
                          </tr>
                        </tbody>
                      </table>
                      </div>{/* end booked-by-scroll-wrapper */}
                    </div>

                    {/* Booking Info */}
                    <div className="light-gray-border p-1 mt-1">
                      <span className="fs-small fw-bold">Booking Info</span>

                      {/* Desktop/Laptop/Tablet layout */}
                      <div className="d-none d-sm-block">
                        <Row className="g-2 mt-1">
                          {/* Left Section */}
                          <Col lg={6} xs={12}>
                            <Row className="align-items-center g-2 mb-2">
                              <Col md={3} xs={12} className="fs-small compact-label">
                                Taken By
                              </Col>
                              <Col md={9} xs={12} className="compact-input">
                                <FormikTextInput
                                  name="bookingTakenBy"
                                  size="sm"
                                  className="w-100 fs-small"
                                  placeholder="Enter name"
                                />
                              </Col>
                            </Row>

                            <Row className="align-items-center g-2 mb-2">
                              <Col md={3} xs={12} className="fs-small compact-label">
                                Res. Mode
                              </Col>
                              <Col md={9} xs={12} className="compact-input">
                                <FormSelect
                                  name="reservationMode"
                                  options={[
                                    { label: "Online", value: "Online" },
                                    { label: "Phone", value: "Phone" },
                                    { label: "In Person", value: "In Person" },
                                  ]}
                                  size="sm"
                                  className="w-100 fs-small"
                                  placeholder="Select"
                                />
                              </Col>
                            </Row>

                            <Row className="align-items-center g-2 mb-2">
                              <Col md={3} xs={12} className="fs-small compact-label">
                                Conf. Mode
                              </Col>
                              <Col md={9} xs={12} className="compact-input">
                                <FormSelect
                                  name="confirmationMode"
                                  options={[
                                    { label: "Email", value: "Email" },
                                    { label: "Phone", value: "Phone" },
                                    { label: "SMS", value: "SMS" },
                                  ]}
                                  size="sm"
                                  className="w-100 fs-small"
                                  placeholder="Select"
                                />
                              </Col>
                            </Row>
                          </Col>

                          {/* Right Section */}
                          <Col lg={6} xs={12}>
                            <Row className="align-items-center g-2 mb-2">
                              <Col md={3} xs={12} className="fs-small compact-label">
                                Pickup
                              </Col>
                              <Col md={9} xs={12} className="compact-input">
                                <FormSelect
                                  name="pickup"
                                  options={pickupDropOptions}
                                  size="sm"
                                  className="w-100 fs-small"
                                  placeholder="Select"
                                />
                              </Col>
                            </Row>

                            <Row className="align-items-center g-2 mb-2">
                              <Col md={3} xs={12} className="fs-small compact-label">
                                Drop
                              </Col>
                              <Col md={9} xs={12} className="compact-input">
                                <FormSelect
                                  name="drop"
                                  options={pickupDropOptions}
                                  size="sm"
                                  className="w-100 fs-small"
                                  placeholder="Select"
                                />
                              </Col>
                            </Row>

                            <Row className="align-items-center g-2 mb-2">
                              <Col md={3} xs={12} className="fs-small compact-label">
                                Status
                              </Col>
                              <Col md={9} xs={12} className="compact-input">
                                <FormSelect
                                  name="status"
                                  options={[
                                    { label: "Confirm", value: "Confirm" },
                                    { label: "Wait Listed", value: "Wait Listed" },
                                    { label: "Temporary", value: "Temporary" },
                                  ]}
                                  size="sm"
                                  className="w-100 fs-small"
                                  placeholder="Select"
                                />
                              </Col>
                            </Row>
                          </Col>
                        </Row>
                      </div>

                      {/* Mobile layout - label on left, input on right */}
                      <div className="d-sm-none">
                        <div className="mobile-booking-row">
                          <span className="booking-label">Taken By</span>
                          <div className="booking-input">
                            <FormikTextInput
                              name="bookingTakenBy"
                              size="sm"
                              className="w-100 fs-small"
                              placeholder="Enter name"
                            />
                          </div>
                        </div>

                        <div className="mobile-booking-row">
                          <span className="booking-label">Res. Mode</span>
                          <div className="booking-input">
                            <FormSelect
                              name="reservationMode"
                              options={[
                                { label: "Online", value: "Online" },
                                { label: "Phone", value: "Phone" },
                                { label: "In Person", value: "In Person" },
                              ]}
                              size="sm"
                              className="w-100 fs-small"
                              placeholder="Select"
                            />
                          </div>
                        </div>

                        <div className="mobile-booking-row">
                          <span className="booking-label">Conf. Mode</span>
                          <div className="booking-input">
                            <FormSelect
                              name="confirmationMode"
                              options={[
                                { label: "Email", value: "Email" },
                                { label: "Phone", value: "Phone" },
                                { label: "SMS", value: "SMS" },
                              ]}
                              size="sm"
                              className="w-100 fs-small"
                              placeholder="Select"
                            />
                          </div>
                        </div>

                        <div className="mobile-booking-row">
                          <span className="booking-label">Pickup</span>
                          <div className="booking-input">
                            <FormSelect
                              name="pickup"
                              options={pickupDropOptions}
                              size="sm"
                              className="w-100 fs-small"
                              placeholder="Select"
                            />
                          </div>
                        </div>

                        <div className="mobile-booking-row">
                          <span className="booking-label">Drop</span>
                          <div className="booking-input">
                            <FormSelect
                              name="drop"
                              options={pickupDropOptions}
                              size="sm"
                              className="w-100 fs-small"
                              placeholder="Select"
                            />
                          </div>
                        </div>

                        <div className="mobile-booking-row">
                          <span className="booking-label">Status</span>
                          <div className="booking-input">
                            <FormSelect
                              name="status"
                              options={[
                                { label: "Confirm", value: "Confirm" },
                                { label: "Wait Listed", value: "Wait Listed" },
                                { label: "Temporary", value: "Temporary" },
                              ]}
                              size="sm"
                              className="w-100 fs-small"
                              placeholder="Select"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </form>
          </Card.Body>
        </Card>
        </div>
        {/* end reservation-scroll-body */}

        {/* ===== FIXED BOTTOM BAR ===== */}
        <div className="fixed-bottom-bar">
          <div className="d-flex gap-2">
            <Button
              variant="success"
              size="sm"
              type="submit"
              form="reservation-form"
              disabled={submitting}>
              {submitting ? 'Processing...' : isEditing ? 'Update Reservation' : 'Reservation'}{' '}
              <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>[F9]</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Guest Modal */}
      <FormModal
        size="lg"
        show={showGuestModal}
        onHide={() => setShowGuestModal(false)}
        title="Add New Guest"
        onSave={async (guestData) => {
          setSavingGuest(true);
          try {
            const payload = { ...guestData, hotelid: hotelId, created_by_id: user?.id };
            const response = await GuestService.create(payload);
            toast.success('Guest saved');
            setShowGuestModal(false);
            await loadAllGuests();
            const newGuest = response.data || response;
            if (newGuest && newGuest.id) {
              setFieldValue('guestId', newGuest.id);
              loadGuestDetails(newGuest.id);
            }
          } catch (error) {
            toast.error('Failed to save guest');
          } finally {
            setSavingGuest(false);
          }
        }}
        saving={savingGuest}
        submitLabel="Save Guest"
        Component={GuestForm}
        selectedItem={{
          fragment_id: null,
          name: '',
          organisation: '',
          address: '',
          city_id: null,
          state_id: null,
          country_id: null,
          occupation: '',
          post_held: '',
          phone: '',
          mobile: '',
          email: '',
          website: '',
          purpose: '',
          arrived_from: '',
          departure_to: '',
          credit_card: '',
          credit_card_expiry: '',
          birthday: '',
          anniversary: '',
          gender: 'Male',
          nationality_id: null,
          guest_type: 'REGULAR',
          credit_allowed: 0,
          company_id: null,
          hotelid: hotelId,
          created_by_id: user?.id,
        }}
      />

      {/* Booked By Modal */}
      <Modal show={showBookedByModal} onHide={() => setShowBookedByModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Booked By Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <BookedByForm
            ref={bookedByFormRef}
            selectedItem={{
              name: bookedBy?.name || '',
              mobile1: bookedBy?.mobile1 || '',
              mobile2: bookedBy?.mobile2 || '',
              address: bookedBy?.address || '',
              countryId: bookedBy?.countryId ?? null,
              stateId: bookedBy?.stateId ?? null,
              cityId: bookedBy?.cityId ?? null,
              email: bookedBy?.email || '',
              website: bookedBy?.website || '',
            }}
            onSave={handleBookedBySave}
            countryOptions={countryOptions}
            stateOptions={stateOptions}
            cityOptions={cityOptions}
            loadingCountries={loadingCountries}
            loadingStates={loadingStates}
            loadingCities={loadingCities}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBookedByModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => bookedByFormRef.current?.saveData()}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </FormikProvider>
  );
};

export default HotelReservation;
// pages/HotelReservation.tsx
import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Row, Col, Form as BootstrapForm, Button, Card, Modal } from 'react-bootstrap';
import { FormikProvider, useFormik } from 'formik';
import * as Yup from 'yup';
import Select from 'react-select';
import FormikTextInput from '@/components/Common/FormikTextInput';
import FormSelect from '@/components/Common/FormikSelect';
import FormModal from '@/components/Common/models/FormModal';
import { toast } from 'react-hot-toast';
import { useAuthContext } from '@/common/context/useAuthContext';

// API Services
import CountryService from '@/common/hotel/countries';
import StateService from '@/common/hotel/states';
import CityService from '@/common/hotel/cities';
import GuestService from '@/common/hotel/guest';
import RoomCategoryService from '@/common/hotel/roomCategoryService';
import taxApi from '@/common/hotel/taxes';
import GuestTypeService from '@/common/hotel/guestType';
import ReservationService from '@/common/hotel/reservation';
import ReservationRoomService from '@/common/hotel/reservationRooms';
import BookedByContactService from '@/common/hotel/bookedByContacts';
import ReservationBookedByService from '@/common/hotel/reservationBookedBy';
import FragmentService from '@/common/hotel/fragments';

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

/**
 * Given a category's tariff list and an adult count, find the best-matching tariff.
 * Rules:
 *   - Sort tariffs by no_of_pax ascending.
 *   - If adults <= some tariff's no_of_pax, use the tariff whose no_of_pax == adults (exact match first).
 *   - If no exact match, use the tariff with the largest no_of_pax that is <= adults.
 *   - If adults exceeds all tariff pax values, use the tariff with the highest no_of_pax
 *     (the excess becomes ex_pax).
 */
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
  const hotelId = user?.hotel_id;
  const isEditing = Boolean(id);

  // ---------- State Declarations ----------
  const [countries, setCountries] = useState<Array<{ id: number; name: string }>>([]);
  const [states, setStates] = useState<Array<{ id: number; name: string }>>([]);
  const [cities, setCities] = useState<Array<{ id: number; name: string }>>([]);
  const [guests, setGuests] = useState<Array<{ guest_id: number; name: string; mobile: string; fragment_id?: number | null }>>([]);
  const [guestTypes, setGuestTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [roomCategories, setRoomCategories] = useState<
    Array<{ room_category_id: number; category_name: string; pax?: number }>
  >([]);
  const [taxList, setTaxList] = useState<
    Array<{ hotel_taxid: number; hotel_tax_value?: number; hotel_cgst?: number; hotel_sgst?: number; hotel_igst?: number; hotel_cess?: number }>
  >([]);
  const [fragments, setFragments] = useState<Array<{ fragment_id: number; name: string }>>([]);

  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
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

  const [submitting, setSubmitting] = useState(false);

  const bookedByFormRef = useRef<any>();

  // ---------- Keyboard Shortcuts: ESC = Cancel, F9 = Submit ----------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when a modal is open
      if (showGuestModal || showBookedByModal) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        navigate(-1);
      } else if (e.key === 'F9') {
        e.preventDefault();
        // Always call via the current handler
        formik.handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGuestModal, showBookedByModal, navigate]);


  // Get today's date in YYYY-MM-DD format
  const todayDate = formatDateToYMD(new Date());
  const tomorrowDate = formatDateToYMD(new Date(Date.now() + 86400000));

  // Helper function to get fragment name by ID
  const getFragmentName = (fragmentId: number | null | undefined): string => {
    if (!fragmentId) return 'MR';
    const fragment = fragments.find((f) => f.fragment_id === fragmentId);
    return fragment ? fragment.name : 'MR';
  };

  // ---------- Master Data Fetching (independent of formik) ----------
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
            fragment_id: g.fragment_id || null,
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

  useEffect(() => {
    const fetchMasterData = async () => {
      setLoadingCountries(true);
      setLoadingStates(true);
      setLoadingCities(true);
      setLoadingGuestTypes(true);
      setLoadingCategories(true);

      try {
        const [countriesRes, statesRes, citiesRes, guestTypesRes, categoriesRes, taxRes, fragmentsRes] =
          await Promise.all([
            CountryService.list(),
            StateService.list(),
            CityService.list(),
            GuestTypeService.list(),
            RoomCategoryService.list({ hotelid: Number(hotelId) }),
            taxApi.list(),
            FragmentService.list(),
          ]);

        const countriesData = Array.isArray(countriesRes) ? countriesRes : countriesRes?.data || [];
        setCountries(
          countriesData
            .map((c: any) => ({ id: c.id || c.countryid, name: String(c.name || c.country_name) }))
            .filter((c: any) => c.id && c.name)
        );

        const statesData = Array.isArray(statesRes) ? statesRes : statesRes?.data || [];
        setStates(
          statesData
            .map((s: any) => ({ id: s.id || s.stateid, name: String(s.name || s.state_name) }))
            .filter((s: any) => s.id && s.name)
        );

        const citiesData = Array.isArray(citiesRes) ? citiesRes : citiesRes?.data || [];
        setCities(
          citiesData
            .map((c: any) => ({ id: c.id || c.cityid, name: String(c.name || c.city_name) }))
            .filter((c: any) => c.id && c.name)
        );

        const guestTypesData = Array.isArray(guestTypesRes) ? guestTypesRes : guestTypesRes?.data || [];
        setGuestTypes(
          guestTypesData
            .map((g: any) => ({ id: g.id || g.guest_type_id, name: String(g.name || g.guest_type_name) }))
            .filter((g: any) => g.id && g.name)
        );

        const categoriesData = Array.isArray(categoriesRes) ? categoriesRes : categoriesRes?.data || [];
        setRoomCategories(
          categoriesData.map((c: any) => ({
            room_category_id: c.room_category_id || c.id,
            category_name: String(c.category_name || c.name),
            pax: c.max_limit || c.pax || 0,
          }))
        );

        const taxData = Array.isArray(taxRes) ? taxRes : taxRes?.data || [];
        setTaxList(taxData);

        const fragmentsData = Array.isArray(fragmentsRes) ? fragmentsRes : fragmentsRes?.data || [];
        setFragments(
          fragmentsData
            .map((f: any) => ({
              fragment_id: f.fragment_id || f.id,
              name: String(f.name),
            }))
            .filter((f: any) => f.fragment_id && f.name)
        );
      } catch (error) {
        console.error('Failed to load master data:', error);
        toast.error('Could not load required data');
      } finally {
        setLoadingCountries(false);
        setLoadingStates(false);
        setLoadingCities(false);
        setLoadingGuestTypes(false);
        setLoadingCategories(false);
      }
    };

    if (hotelId) fetchMasterData();
  }, [hotelId]);

  // ---------- Derived Data (independent of formik) ----------
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

  // Calculate totals based on days, rooms, and quantities
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
      // Reset pricing if no valid category or adults
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
      // Use tariff-based pricing
      const { pax, exPax, tariff, taxType, isTaxApplicable } = getTariffForPax(tariffs, adultCount);
      
      // Get tax percent from taxType — use hotel_tax_value first, then sum components
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
      
      // Calculate tax amount and total
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
      
      // Store standard pax for display
      const standardPax = categoryStandardPaxMap.get(effectiveCategoryId) || pax;
      setCategoryStandardPaxMap((prev) => new Map(prev).set(effectiveCategoryId, standardPax));
      
      return;
    }
    
    // Fallback: Use standard pax from category
    const standardPax = categoryStandardPaxMap.get(effectiveCategoryId) || 
      (categoryDetails.pax || 1);
    
    const newPax = standardPax;
    const newExPax = Math.max(0, adultCount - standardPax);
    
    setFieldValue('pax', newPax);
    setFieldValue('exPax', newExPax);
  };

  // ---------- Formik (MUST be declared before handlers that use setFieldValue) ----------
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
      countryId: null,
      stateId: null,
      cityId: null,
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
          country_id: values.countryId,
          state_id: values.stateId,
          city_id: values.cityId,
          id_type: values.idType,
          id_number: values.idNumber,
          company_id: values.companyId === 'WALK-IN-GUEST' ? null : Number(values.companyId),
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

        let reservationId: number;
        let createdResNo: string;

        if (isEditing && id) {
          const reservationRes = await ReservationService.update(Number(id), reservationPayload);
          reservationId = Number(id);
          createdResNo = reservationRes.data.reservation_no;
          toast.success(`Reservation ${createdResNo} updated`);
        } else {
          const reservationRes = await ReservationService.create(reservationPayload);
          reservationId = reservationRes.data.reservation_id;
          createdResNo = reservationRes.data.reservation_no;
          formik.setFieldValue('reservationNo', createdResNo);
          toast.success(`Reservation ${createdResNo} created`);
        }

        // Delete existing rooms and booked‑by links manually
        if (isEditing && id) {
          const existingRooms = await ReservationRoomService.list({ reservation_id: Number(id) });
          await Promise.all(existingRooms.data.map(room => ReservationRoomService.remove(room.room_row_id)));

          const existingLinks = await ReservationBookedByService.list({ reservation_id: Number(id) });
          await Promise.all(existingLinks.data.map(link => ReservationBookedByService.remove(link.id)));
        }

        // Insert new rooms (with rooms_no)
        const roomPromises = roomRows.map((row) => {
          const roomPayload = {
            reservation_id: isEditing && id ? Number(id) : reservationId,
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
            hotelid: hotelId,
            created_by_id: user?.id,
          };
          return ReservationRoomService.create(roomPayload);
        });

        await Promise.all(roomPromises);

        // Insert new booked‑by link (only if bookedBy is set)
        if (bookedBy) {
          await ReservationBookedByService.create({
            reservation_id: isEditing && id ? Number(id) : reservationId,
            booked_by_id: bookedBy.booked_by_id,
          });
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

  // ---------- Handlers that depend on formik (must be after formik declaration) ----------
  
  // Handle Room Category Change with tariff-based pricing
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
    
    // Auto-select converted category to same as room category
    setFieldValue('convertedCategory', categoryId);
    
    // Fetch category details and update pricing based on current adult count
    const adultCount = Number(values.adult) || 1;
    await updatePricingFromAdultAndCategory(adultCount, categoryId, categoryId);
  };

  // Handle Converted Category Change
  const handleConvertedCategoryChange = async (categoryId: number | null) => {
    setFieldValue('convertedCategory', categoryId);
    
    if (!categoryId) {
      // Reset to original room category pricing
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

  // Recalculate room total whenever relevant fields change
  const recalculateRoomTotal = async () => {
    const adultCount = values.adult || 0;
    const effectiveCategoryId = values.convertedCategory ?? values.roomCategory;
    
    if (effectiveCategoryId && adultCount > 0) {
      await updatePricingFromAdultAndCategory(adultCount, effectiveCategoryId, values.convertedCategory);
    } else {
      // Calculate without tariff (fallback)
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

  // Update exPax when adult or pax changes
  const updateExPaxFromAdultAndPax = (adult: number, pax: number) => {
    const newExPax = Math.max(0, adult - pax);
    if (values.exPax !== newExPax) {
      setFieldValue('exPax', newExPax);
      recalculateRoomTotal();
    }
  };

  // Watch for changes that affect total calculation
  useEffect(() => {
    recalculateRoomTotal();
  }, [values.roomCharge, values.taxPercent, values.discount, values.nights, values.roomsNo, values.exPax, values.childPaid, values.driver, values.roomCategory, values.convertedCategory]);

  // Watch adult and pax changes - Update exPax and pricing
  useEffect(() => {
    const adult = values.adult || 0;
    const pax = values.pax || 0;
    updateExPaxFromAdultAndPax(adult, pax);
    
    // Also update pricing when adult changes (if category is selected)
    const effectiveCategoryId = values.convertedCategory ?? values.roomCategory;
    if (effectiveCategoryId && adult > 0) {
      updatePricingFromAdultAndCategory(adult, effectiveCategoryId, values.convertedCategory);
    }
  }, [values.adult, values.pax]);

  // ---------- Options for selects ----------
  const countryOptions: Option[] = countries.map((c) => ({ label: c.name, value: c.id }));
  const stateOptions: Option[] = states.map((s) => ({ label: s.name, value: s.id }));
  const cityOptions: Option[] = cities.map((c) => ({ label: c.name, value: c.id }));
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

  // ---------- Other handlers (add/edit/delete rows) ----------
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

        const fragmentName = getFragmentName(guest.fragment_id);
        
        setFieldValue('title', fragmentName);
        setFieldValue('guestId', guest.id || guest.guest_id);
        setFieldValue('firstName', firstName);
        setFieldValue('lastName', lastName);
        setFieldValue('phone1', guest.mobile ? String(guest.mobile) : '');
        setFieldValue('phone2', guest.phone ? String(guest.phone) : '');
        setFieldValue('email', guest.email ? String(guest.email) : '');
        setFieldValue('address', guest.address ? String(guest.address) : '');
        setFieldValue('countryId', guest.country_id != null ? Number(guest.country_id) : null);
        setFieldValue('stateId', guest.state_id != null ? Number(guest.state_id) : null);
        setFieldValue('cityId', guest.city_id != null ? Number(guest.city_id) : null);
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
            fragment_id: g.fragment_id || null,
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

  // Load existing reservation if editing (with rooms_no)
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

        const roomsRes = await ReservationRoomService.list({ reservation_id: Number(id) });
        const rooms = roomsRes.data || [];

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

        const bookedByRes = await ReservationBookedByService.list({ reservation_id: Number(id) });
        const bookedByLink = bookedByRes.data?.[0];
        if (bookedByLink) {
          const contactRes = await BookedByContactService.get(bookedByLink.booked_by_id);
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

  const selectStyles = {
    control: (base: any) => ({ ...base, minHeight: '28px', fontSize: '0.7rem', padding: '0' }),
    valueContainer: (base: any) => ({ ...base, padding: '0 4px' }),
    input: (base: any) => ({ ...base, margin: '0', padding: '0' }),
    indicatorsContainer: (base: any) => ({ ...base, height: '28px' }),
    dropdownIndicator: (base: any) => ({ ...base, padding: '0 4px' }),
    clearIndicator: (base: any) => ({ ...base, padding: '0 4px' }),
    menu: (base: any) => ({ ...base, fontSize: '0.7rem' }),
    option: (base: any) => ({ ...base, padding: '2px 8px' }),
  } as const;

  // ---------- Determine effective category for Pax banner ----------
  const effectiveCategoryId = values.convertedCategory ?? values.roomCategory;
  const effectiveStandardPax = effectiveCategoryId ? categoryStandardPaxMap.get(effectiveCategoryId) || 0 : 0;

  // Calculate display totals
  const displayRoomCharge = formatToTwoDecimals(values.roomCharge);
  const displayTaxPercent = formatToTwoDecimals(values.taxPercent);
  const displayTaxAmount = formatToTwoDecimals(values.taxAmount);
  const displayTotal = formatToTwoDecimals(values.total);

  // Pre-fetch category details when categories load
  useEffect(() => {
    if (roomCategories.length > 0 && values.roomCategory) {
      fetchCategoryDetails(values.roomCategory);
    }
  }, [roomCategories, values.roomCategory]);

  return (
    <FormikProvider value={formik}>
      <style>{`
        .fs-small { font-size: 0.7rem; }
        .table-sm-compact th, .table-sm-compact td {
          padding: 0.1rem 0.5rem;
          font-size: 0.65rem;
          white-space: nowrap;
        }
        .bg-danger-custom { background-color: #009de0 !important; }
        input.form-control-sm, select.form-select-sm{
          height: 28px !important;
          min-height: 28px !important;
          padding: 0 6px !important;
          font-size: 0.7rem !important;
        }
        .react-select__control {
          min-height: 24px !important;
          font-size: 0.7rem !important;
        }
        .react-select__valueContainer { padding: 0 4px !important; }
        .react-select__indicators { height: 24px !important; }
        input, select, textarea, .form-control, .form-select {
          font-size: 0.7rem !important;
        }
        .scrollable-table {
          height: 140px;
          overflow-x: auto;
          overflow-y: auto;
          border: 1px solid #dee2e6;
        }
        .scrollable-table table {
          margin-bottom: 0;
          min-width: 2000px;
        }
        .scrollable-table::-webkit-scrollbar {
          height: 4px;
          width: 5px;
        }
        .scrollable-table::-webkit-scrollbar-track { background: #f1f1f1; }
        .scrollable-table::-webkit-scrollbar-thumb { background: #888; border-radius: 3px; }
        .scrollable-table::-webkit-scrollbar-thumb:hover { background: #555; }
        .input-24 {
          height: 24px !important;
          min-height: 24px !important;
          padding: 2px 4px !important;
          font-size: 12px !important;
        }
        .row-compact { margin-bottom: 4px !important; }
        .clickable-row { cursor: pointer; }
        .clickable-row:hover { background-color: #f5f5f5; }
        .label-top { font-size: 0.65rem; margin-bottom: 2px; display: block; }
        .light-gray-border {
          border: 1px solid #d3d3d3 !important;
          border-radius: 0.25rem;
        }
        .section-legend {
          font-size: 0.7rem;
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
          height: 28px;
        }
        .adult-control button {
          width: 26px;
          height: 28px;
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
          height: 28px;
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
        .pax-display {
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
      `}</style>

      <div className="vh-100 d-flex flex-column overflow-hidden">
        <div className="p-1 d-flex justify-content-between align-items-center border-bottom">
          <div className="d-flex align-items-center"></div>
        </div>

        <Card className="flex-grow-1 border-0">
          <Card.Body className="p-2 overflow-y-auto overflow-x-hidden">
            <form
              onSubmit={handleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLElement;
                  // Don't intercept Enter on textareas or buttons
                  if (target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') return;
                  e.preventDefault();
                  // Find all focusable inputs/selects in the form and focus the next one
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
              <Row className="g-3">
                <Col md={4} className="bg-light px-1">
                  {/* Reservation Details */}
                  <fieldset className="p-1 mb-1">
                    <legend
                      style={{
                        backgroundColor: '#dc3545',
                        color: '#fff',
                        padding: '2px 12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        borderRadius: '3px',
                      }}>
                      Reservation Details
                    </legend>

                    <Row className="align-items-center g-2 mb-1">
                      <Col md={5}>
                        <div className="fs-small mb-1">Reservation No</div>
                        <FormikTextInput
                          name="reservationNo"
                          size="sm"
                          className="w-100 fs-small"
                          placeholder="Enter reservation number"
                        />
                      </Col>
                      <Col md={7}>
                        <div className="fs-small mb-1">Date</div>
                        <Row className="g-1">
                          <Col md={7}>
                            <FormikTextInput
                              name="reservationDate"
                              type="date"
                              size="sm"
                              className="w-100 fs-small"
                            />
                          </Col>
                          <Col md={5}></Col>
                        </Row>
                      </Col>
                    </Row>

                    <Row className="align-items-center g-2 mb-1">
                      <Col md={5}>
                        <div className="fs-small mb-1">Guest Type</div>
                        <FormSelect
                          name="guestType"
                          options={guestTypeOptions}
                          size="sm"
                          className="w-100 fs-small"
                          isLoading={loadingGuestTypes}
                          placeholder="Select"
                        />
                      </Col>
                      <Col md={7}>
                        <div className="fs-small mb-1">Arrival Date & Time</div>
                        <Row className="g-1">
                          <Col md={7}>
                            <FormikTextInput
                              name="arrivalDate"
                              type="date"
                              size="sm"
                              className="w-100 fs-small"
                            />
                          </Col>
                          <Col md={5}>
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

                    <Row className="align-items-center g-2">
                      <Col md={5}>
                        <div className="fs-small mb-1">No of Days</div>
                        <FormikTextInput
                          name="nights"
                          type="number"
                          size="sm"
                          className="w-100 fs-small"
                        />
                      </Col>
                      <Col md={7}>
                        <div className="fs-small mb-1">Departure Date & Time </div>
                        <Row className="g-1">
                          <Col md={7}>
                            <FormikTextInput
                              name="departureDate"
                              type="date"
                              size="sm"
                              className="w-100 fs-small"
                            />
                          </Col>
                          <Col md={5}>
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
                  </fieldset>

                  {/* Guest Information */}
                  <fieldset className="p-1 mb-1">
                    <div className="d-flex align-items-center mb-1">
                      <div style={{ flex: 1, height: '1px', backgroundColor: 'lightgrey' }} />
                      <span className="fs-small fw-bold me-2">Guest Information</span>
                      <div style={{ flex: 1, height: '1px', backgroundColor: 'lightgrey' }} />
                    </div>

                    <Row className="justify-content-left align-items-end g-1 mb-1">
                      <Col xs={12}>
                        <label className="label-top">Name</label>
                      </Col>
                      <Col xs="auto" style={{ width: '75px' }}>
                        <FormikTextInput
                          name="title"
                          placeholder="Title"
                          size="sm"
                          className="w-100 fs-small"
                        />
                      </Col>
                      <Col xs="auto" style={{ width: '304px' }}>
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
                              setFieldValue('countryId', null);
                              setFieldValue('stateId', null);
                              setFieldValue('cityId', null);
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
                        />
                      </Col>
                      <Col xs="auto" style={{ width: '35px' }}>
                        <button
                          type="button"
                          className="btn btn-success btn-sm w-100 p-0"
                          style={{ height: '29px' }}
                          onClick={() => setShowGuestModal(true)}>
                          +
                        </button>
                      </Col>
                    </Row>

                    <input type="hidden" {...formik.getFieldProps('firstName')} />
                    <input type="hidden" {...formik.getFieldProps('lastName')} />

                    <Row className="mb-1">
                      <Col xs={12}>
                        <label className="label-top">Address</label>
                      </Col>
                      <Col xs={12}>
                        <textarea
                          {...formik.getFieldProps('address')}
                          placeholder="Address"
                          rows={2}
                          className="w-100 fs-small"
                          readOnly
                        />
                      </Col>
                    </Row>

                    <Row className="justify-content-left align-items-end g-2 mb-2">
                      <Col md={6}>
                        <label className="label-top">Mobile No 1</label>
                        <FormikTextInput
                          name="phone1"
                          size="sm"
                          className="w-100 fs-small"
                          placeholder="Enter Mobile No 1"
                          readOnly
                        />
                      </Col>
                      <Col md={6}>
                        <label className="label-top">Mobile No 2</label>
                        <FormikTextInput
                          name="phone2"
                          size="sm"
                          className="w-100 fs-small"
                          placeholder="Enter Mobile No 2"
                          readOnly
                        />
                      </Col>
                    </Row>

                    <Row className="align-items-end g-2 mb-1">
                      <Col md={4}>
                        <label className="label-top">Country</label>
                        <FormSelect
                          name="countryId"
                          options={countryOptions}
                          size="sm"
                          className="w-100 fs-small"
                          isLoading={loadingCountries}
                          disabled
                        />
                      </Col>
                      <Col md={4}>
                        <label className="label-top">State</label>
                        <FormSelect
                          name="stateId"
                          options={stateOptions}
                          size="sm"
                          className="w-100 fs-small"
                          isLoading={loadingStates}
                          disabled
                        />
                      </Col>
                      <Col md={4}>
                        <label className="label-top">City</label>
                        <FormSelect
                          name="cityId"
                          options={cityOptions}
                          size="sm"
                          className="w-100 fs-small"
                          isLoading={loadingCities}
                          disabled
                        />
                      </Col>
                    </Row>
                  </fieldset>

                  {/* Instructions */}
                  <fieldset className="p-1 mb-1">
                    <div className="d-flex align-items-center mb-2">
                      <div style={{ flex: 1, height: '1px', backgroundColor: 'lightgray' }} />
                      <span className="fs-small fw-bold me-2">Instructions</span>
                      <div style={{ flex: 1, height: '1px', backgroundColor: 'lightgray' }} />
                    </div>

                    <Row className="g-2 mb-1">
                      <Col md={6}>
                        <BootstrapForm.Label className="fs-small">
                          Billing Instructions
                        </BootstrapForm.Label>
                        <textarea
                          {...formik.getFieldProps('billingInstructions')}
                          rows={3}
                          className="w-100 fs-small"
                          placeholder="Billing instructions"
                        />
                      </Col>
                      <Col md={6}>
                        <BootstrapForm.Label className="fs-small">
                          Special Instructions
                        </BootstrapForm.Label>
                        <textarea
                          {...formik.getFieldProps('specialInstructions')}
                          rows={3}
                          className="w-100 fs-small"
                          placeholder="Special instructions"
                        />
                      </Col>
                    </Row>
                  </fieldset>
                </Col>

                {/* RIGHT COLUMN */}
                <Col md={8}>
                  <fieldset className="p-1 bg-light">
                    <legend
                      style={{
                        backgroundColor: '#dc3545',
                        color: '#fff',
                        padding: '2px 12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        borderRadius: '3px',
                      }}>
                      Room Details
                    </legend>

                    {/* Room input fields */}
                    <Row className="g-2 mb-1">
                      <Col xs="auto" style={{ width: '150px' }}>
                        <label className="fs-small mb-1">Room Category</label>
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
                        />
                      </Col>
                      <Col xs="auto" style={{ width: '150px' }}>
                        <label className="fs-small mb-1">Converted Category</label>
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
                        />
                      </Col>
                      <Col xs="auto" style={{ width: '80px' }}>
                        <label className="fs-small mb-1">Rooms No</label>
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
                      <Col xs="auto" style={{ width: '100px' }}>
                        <label className="fs-small mb-1">Room Charge</label>
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
                      <Col xs="auto" style={{ width: '80px' }}>
                        <label className="fs-small mb-1">Discount %</label>
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
                      <Col xs="auto" style={{ width: '100px' }}>
                        <label className="fs-small mb-1">Discount Amt</label>
                        <FormikTextInput
                          name="discountAmt"
                          type="number"
                          size="sm"
                          className="w-100 fs-small"
                          readOnly
                          value={formatToTwoDecimals(values.discountAmt)}
                        />
                      </Col>
                      <Col xs="auto" style={{ width: '80px' }}>
                        <label className="fs-small mb-1">Tax %</label>
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
                        <label className="fs-small mb-1">Tax Amount</label>
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

                    <Row className="g-2 mb-2 align-items-end">
                      <Col xs="auto" style={{ width: '110px' }}>
                        <label className="fs-small mb-1 fw-bold text-primary">👤 Adults</label>
                        <div className="adult-control">
                          <button
                            type="button"
                            onClick={() => {
                              setFieldValue('adult', Math.max(0, (values.adult || 0) - 1));
                              recalculateRoomTotal();
                            }}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={values.adult || 0}
                            min={0}
                            onChange={(e) => {
                              setFieldValue('adult', Math.max(0, Number(e.target.value)));
                              recalculateRoomTotal();
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFieldValue('adult', (values.adult || 0) + 1);
                              recalculateRoomTotal();
                            }}
                          >
                            +
                          </button>
                        </div>
                      </Col>

                      <Col xs="auto" style={{ width: '70px' }}>
                        <label className="fs-small mb-1 d-block" style={{ color: '#198754' }}>
                          Pax
                          {effectiveStandardPax > 0 && (
                            <span className="ms-1" style={{ fontSize: '0.55rem', color: '#888' }}>
                              (fixed)
                            </span>
                          )}
                        </label>
                        <div
                          className="d-flex align-items-center justify-content-center border rounded"
                          style={{
                            height: '28px',
                            background: '#f0fff4',
                            borderColor: '#198754',
                            border: '1px solid #198754',
                            borderRadius: '4px',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 'bold',
                              fontSize: '14px',
                              color: '#198754',
                              minWidth: '25px',
                              textAlign: 'center',
                            }}
                          >
                            {values.pax || 0}
                          </span>
                        </div>
                      </Col>

                      <Col xs="auto" style={{ width: '70px' }}>
                        <label className="fs-small mb-1 d-block" style={{ color: '#dc6500' }}>
                          Ex_Pax
                        </label>
                        <div
                          className="d-flex align-items-center justify-content-center border rounded"
                          style={{
                            height: '28px',
                            background: (values.exPax || 0) > 0 ? '#fff3e0' : '#f8f9fa',
                            border: `1px solid ${(values.exPax || 0) > 0 ? '#fd7e14' : '#ced4da'}`,
                            borderRadius: '4px',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 'bold',
                              fontSize: '14px',
                              color: (values.exPax || 0) > 0 ? '#dc6500' : '#aaa',
                              minWidth: '25px',
                              textAlign: 'center',
                            }}
                          >
                            {values.exPax || 0}
                          </span>
                        </div>
                      </Col>

                      <Col xs="auto" style={{ width: '75px' }}>
                        <label className="fs-small mb-1">Child Paid</label>
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
                      <Col xs="auto" style={{ width: '75px' }}>
                        <label className="fs-small mb-1">Child Unpaid</label>
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
                        <label className="fs-small mb-1">Driver</label>
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
                        <label className="fs-small mb-1">Total (per night)</label>
                        <FormikTextInput
                          name="total"
                          type="text"
                          size="sm"
                          className="w-100 fs-small fw-bold amount-display"
                          readOnly
                          value={displayTotal}
                        />
                      </Col>
                      <Col xs={2}>
                        <Button
                          size="sm"
                          variant="success"
                          onClick={handleAddOrUpdateRow}
                          style={{
                            height: '28px',
                            fontSize: '10px',
                            padding: '1px 6px',
                            marginTop: '20px',
                          }}>
                          {editingRowId ? 'Update' : 'Add'}
                        </Button>
                      </Col>
                    </Row>

                    {/* Scrollable table */}
                    <div className="scrollable-table mt-2">
                      <table
                        className="table table-bordered table-sm-compact mb-0"
                        style={{
                          borderColor: '#d1d1d1',
                          minWidth: '2000px',
                          whiteSpace: 'nowrap',
                        }}>
                        <thead className="bg-light">
                          <tr className="text-center" style={{ backgroundColor: '#d9d9d9' }}>
                            <th>Sr.No</th>
                            <th>Guest</th>
                            <th>GuestID</th>
                            <th>Room Count</th>
                            <th>Room Category</th>
                            <th>Converted Category</th>
                            <th>A_Date</th>
                            <th>A_Time</th>
                            <th>D_Date</th>
                            <th>D_Time</th>
                            <th>Adults</th>
                            <th>Pax</th>
                            <th>Ex_Pax</th>
                            <th>Ex_Pax Price</th>
                            <th>Ex_Pax Tax%</th>
                            <th>Ex_Pax Tax Amt</th>
                            <th>Ex_Pax Total</th>
                            <th>Child paid</th>
                            <th>Child unpaid</th>
                            <th>Child Price</th>
                            <th>Child Tax%</th>
                            <th>Child Tax Amt</th>
                            <th>Child Total</th>
                            <th>Driver</th>
                            <th>Driver Price</th>
                            <th>Driver Tax%</th>
                            <th>Driver Tax Amt</th>
                            <th>Driver Total</th>
                            <th>Days</th>
                            <th>Rate/Night</th>
                            <th>Discount%</th>
                            <th>Discount Amt.</th>
                            <th>Tax %</th>
                            <th>Tax Amt</th>
                            <th>Total Amount</th>
                            <th>Actions</th>
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
                                  className="p-1 px-1"
                                  onClick={() => handleDeleteRow(row.id)}
                                  style={{ lineHeight: 1 }}>
                                  <i className="fi fi-rr-trash"></i>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Booked By Details */}
                    <fieldset className="light-gray-border p-1 mt-2">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <legend className="section-legend mb-0" style={{ fontSize: '14px', fontWeight: '600' }}>
                          Booked By Details
                        </legend>
                        <Button
                          size="sm"
                          variant="success"
                          style={{ fontSize: '12px', lineHeight: '1.2', height: '28px', padding: '2px 10px' }}
                          onClick={() => setShowBookedByModal(true)}>
                          {bookedBy ? 'Edit' : 'Add'}
                        </Button>
                      </div>

                      <table className="table table-bordered table-sm-compact mb-0" style={{ borderColor: '#d1d1d1' }}>
                        <thead className="bg-light">
                          <tr className="text-center" style={{ backgroundColor: '#d9d9d9' }}>
                            <th style={{ width: '160px' }}>Name</th>
                            <th>Mobile 1</th>
                            <th>Mobile 2</th>
                            <th>Email</th>
                            <th>Website</th>
                            <th>Address</th>
                           </tr>
                        </thead>
                        <tbody>
                          <tr className="text-center" style={{ verticalAlign: 'middle' }}>
                            <td style={{ width: '160px' }}>
                              <Select<Option, false>
                                options={bookedByOptions}
                                styles={selectStyles}
                                value={
                                  bookedBy
                                    ? { label: bookedBy.name, value: bookedBy.booked_by_id }
                                    : null
                                }
                                onChange={handleBookedBySelect}
                                placeholder="Select..."
                                isClearable
                              />
                            </td>
                            <td>{bookedBy?.mobile1 || '-'}</td>
                            <td>{bookedBy?.mobile2 || '-'}</td>
                            <td>{bookedBy?.email || '-'}</td>
                            <td>{bookedBy?.website || '-'}</td>
                            <td>{bookedBy?.address || '-'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </fieldset>

                    {/* Booking Info */}
                    <fieldset className="light-gray-border p-2 mt-1">
                      <legend className="section-legend">Booking Info</legend>
                      <Row>
                        <Col md={7}>
                          <Row className="align-items-center mb-1">
                            <Col md={4}>
                              <label className="fs-small mb-0">Booking Taken By</label>
                            </Col>
                            <Col md={8}>
                              <FormikTextInput
                                name="bookingTakenBy"
                                size="sm"
                                className="w-100 fs-small"
                                placeholder="Enter name"
                              />
                            </Col>
                          </Row>
                          <Row className="align-items-center mb-1">
                            <Col md={4}>
                              <label className="fs-small mb-0">Reservation Mode</label>
                            </Col>
                            <Col md={8}>
                              <FormSelect
                                name="reservationMode"
                                options={[
                                  { label: 'Online', value: 'Online' },
                                  { label: 'Phone', value: 'Phone' },
                                  { label: 'In Person', value: 'In Person' },
                                ]}
                                size="sm"
                                className="w-100 fs-small"
                                placeholder="Select"
                              />
                            </Col>
                          </Row>
                          <Row className="align-items-center mb-1">
                            <Col md={4}>
                              <label className="fs-small mb-0">Confirmation Mode</label>
                            </Col>
                            <Col md={8}>
                              <FormSelect
                                name="confirmationMode"
                                options={[
                                  { label: 'Email', value: 'Email' },
                                  { label: 'Phone', value: 'Phone' },
                                  { label: 'SMS', value: 'SMS' },
                                ]}
                                size="sm"
                                className="w-100 fs-small"
                                placeholder="Select"
                              />
                            </Col>
                          </Row>
                        </Col>
                        <Col md={5}>
                          <Row className="align-items-center mb-1">
                            <Col md={3}>
                              <label className="fs-small mb-0">Pickup</label>
                            </Col>
                            <Col md={9}>
                              <FormSelect
                                name="pickup"
                                options={pickupDropOptions}
                                size="sm"
                                className="w-100 fs-small"
                                placeholder="Select pickup"
                              />
                            </Col>
                          </Row>
                          <Row className="align-items-center mb-1">
                            <Col md={3}>
                              <label className="fs-small mb-0">Drop</label>
                            </Col>
                            <Col md={9}>
                              <FormSelect
                                name="drop"
                                options={pickupDropOptions}
                                size="sm"
                                className="w-100 fs-small"
                                placeholder="Select drop"
                              />
                            </Col>
                          </Row>
                          <Row className="align-items-center mb-1">
                            <Col md={3}>
                              <label className="fs-small mb-0">Status</label>
                            </Col>
                            <Col md={9}>
                              <FormSelect
                                name="status"
                                options={[
                                  { label: 'Confirm', value: 'Confirm' },
                                  { label: 'Wait Listed', value: 'Wait Listed' },
                                  { label: 'Temporary', value: 'Temporary' },
                                ]}
                                size="sm"
                                className="w-100 fs-small"
                                placeholder="Select status"
                              />
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                    </fieldset>
                  </fieldset>
                </Col>
              </Row>
            </form>
          </Card.Body>
        </Card>

        {/* Footer buttons */}
        <div className="fixed-bottom" style={{ padding: '5px 10px', zIndex: 1000 }}>
          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
              Cancel <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>[ESC]</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              onClick={() => formik.handleSubmit()}
              disabled={submitting}>
              {submitting ? 'Processing...' : isEditing ? 'Update Reservation' : 'Create Reservation'}{' '}
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

      {/* Booked By Modal – custom modal with ref */}
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
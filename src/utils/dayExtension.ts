import { OccupiedRoomItem } from '@/types/room';

/**
 * Calculates the detailed price breakdown for extending a guest's stay.
 * Uses room tariff, extra pax, child, driver charges, taxes, and discounts.
 *
 * @param item - The occupied room item with all charge details.
 * @param exPaxCount - New extra pax count for the extension.
 * @param childCount - New child count for the extension.
 * @param driverCount - New driver count for the extension.
 * @param extensionDays - Number of days to extend (default 1).
 * @param originalPax - Original pax count (falls back to item.adults).
 * @returns Detailed price breakdown for the extension period.
 */
export const calculateDayExtensionPrice = (
  item: OccupiedRoomItem,
  exPaxCount: number,
  childCount: number,
  driverCount: number,
  extensionDays: number = 1,
  originalPax: number = item.original_pax ?? item.adults,
) => {
  const perDayBasePrice = Number(item.detail?.room_tariff) || Number(item.original_charge) || 0;
  const discountPercent = Number(item.discount_percent) || 0;
  const cgstPercent = Number(item.cgst_percent) || 0;
  const sgstPercent = Number(item.sgst_percent) || 0;
  const igstPercent = Number(item.igst_percent) || 0;
  const cessPercent = Number(item.cess_percent) || 0;
  const serviceChargePercent = Number(item.service_charge) || 0;
  const totalTaxPercent = igstPercent > 0 ? igstPercent : cgstPercent + sgstPercent;

  const discountAmount = (perDayBasePrice * discountPercent) / 100;
  const roomPriceAfterDiscount = perDayBasePrice - discountAmount;

  let roomCgstAmount = 0,
    roomSgstAmount = 0,
    roomIgstAmount = 0;
  if (igstPercent > 0) {
    roomIgstAmount = (roomPriceAfterDiscount * igstPercent) / 100;
  } else {
    roomCgstAmount = (roomPriceAfterDiscount * cgstPercent) / 100;
    roomSgstAmount = (roomPriceAfterDiscount * sgstPercent) / 100;
  }
  const roomGstAmount = roomIgstAmount + roomCgstAmount + roomSgstAmount;
  const roomCessAmount = (roomPriceAfterDiscount * cessPercent) / 100;
  const roomServiceChargeAmount = (roomPriceAfterDiscount * serviceChargePercent) / 100;
  const roomTaxAmount = roomGstAmount + roomCessAmount + roomServiceChargeAmount;
  const roomTotal = roomPriceAfterDiscount + roomTaxAmount;

  // Per-person rates from original charges
  let exPaxRatePerPerson = 0,
    childRatePerPerson = 0,
    driverRatePerPerson = 0;
  if (item.ex_pax > 0) exPaxRatePerPerson = (Number(item.ex_pax_charge) || 0) / item.ex_pax;
  if (item.child_count > 0)
    childRatePerPerson = (Number(item.child_paid_amount) || 0) / item.child_count;
  if (item.driver_count > 0)
    driverRatePerPerson = (Number(item.driver_charge) || 0) / item.driver_count;

  const exPaxBaseAmount = exPaxCount * exPaxRatePerPerson;
  const childBaseAmount = childCount * childRatePerPerson;
  const driverBaseAmount = driverCount * driverRatePerPerson;

  const exPaxTaxAmount = (exPaxBaseAmount * totalTaxPercent) / 100;
  const childTaxAmount = (childBaseAmount * totalTaxPercent) / 100;
  const driverTaxAmount = (driverBaseAmount * totalTaxPercent) / 100;

  const exPaxTotal = exPaxBaseAmount + exPaxTaxAmount;
  const childTotal = childBaseAmount + childTaxAmount;
  const driverTotal = driverBaseAmount + driverTaxAmount;

  const subTotal = roomPriceAfterDiscount + exPaxBaseAmount + childBaseAmount + driverBaseAmount;
  const totalTax = roomTaxAmount + exPaxTaxAmount + childTaxAmount + driverTaxAmount;
  const totalPrice = roomTotal + exPaxTotal + childTotal + driverTotal;

  return {
    roomCharge: Number((roomTotal * extensionDays).toFixed(2)),
    exPaxCharge: Number((exPaxTotal * extensionDays).toFixed(2)),
    childCharge: Number((childTotal * extensionDays).toFixed(2)),
    driverCharge: Number((driverTotal * extensionDays).toFixed(2)),
    subTotal: Number((subTotal * extensionDays).toFixed(2)),
    taxAmount: Number((totalTax * extensionDays).toFixed(2)),
    totalPrice: Number((totalPrice * extensionDays).toFixed(2)),
    discountAmount: Number((discountAmount * extensionDays).toFixed(2)),
    totalTaxPercent,
    exPaxBaseAmount: Number((exPaxBaseAmount * extensionDays).toFixed(2)),
    childBaseAmount: Number((childBaseAmount * extensionDays).toFixed(2)),
    driverBaseAmount: Number((driverBaseAmount * extensionDays).toFixed(2)),
    exPaxTaxAmount: Number((exPaxTaxAmount * extensionDays).toFixed(2)),
    childTaxAmount: Number((childTaxAmount * extensionDays).toFixed(2)),
    driverTaxAmount: Number((driverTaxAmount * extensionDays).toFixed(2)),
    perDayBasePrice: Number(perDayBasePrice.toFixed(2)),
    roomPriceAfterDiscount: Number(roomPriceAfterDiscount.toFixed(2)),
    roomTaxAmount: Number((roomTaxAmount * extensionDays).toFixed(2)),
    exPaxRatePerPerson: Number(exPaxRatePerPerson.toFixed(2)),
    childRatePerPerson: Number(childRatePerPerson.toFixed(2)),
    driverRatePerPerson: Number(driverRatePerPerson.toFixed(2)),
    cgstPercent,
    sgstPercent,
    igstPercent,
    cessPercent,
    serviceChargePercent,
    roomCgstAmount: Number((roomCgstAmount * extensionDays).toFixed(2)),
    roomSgstAmount: Number((roomSgstAmount * extensionDays).toFixed(2)),
    roomIgstAmount: Number((roomIgstAmount * extensionDays).toFixed(2)),
    paxCount: originalPax,
  };
};

export type DayExtensionPrice = ReturnType<typeof calculateDayExtensionPrice>;
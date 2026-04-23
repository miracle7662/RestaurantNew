const generateKOTHTML = (data, settings = {}) => {
  const {
    printItems = [],
    items = [],
    restaurantName = 'Restaurant Name',
    outletName = 'Outlet Name',
    activeTab = 'Dine-in',
    currentKOTNo = null,
    selectedTable = null,
    customerName = '',
    mobileNumber = '',
    user = {},
    date = new Date().toISOString(),
    kotNote = '',
    orderNo = null,
    tableStatus = null,
    pax = 0,
    selectedWaiter = ''
  } = data;

  const kotItems = printItems.length > 0 ? printItems : items.filter(i => i.isNew || i.qty > 0);

  // Default settings fallback
  const defaultSettings = {
    show_store_name: 1,
    show_waiter: 1,
    show_username: 0,
    show_terminal_username: 0,
    show_captain_username: 0,
    customer_on_kot_dine_in: 0,
    customer_kot_display_option: 'NAME_ONLY',
    show_item_price: 1,
    hide_item_Amt_column: 0,
    show_new_order_tag: 1,
    new_order_tag_label: 'New',
    show_running_order_tag: 1,
    running_order_tag_label: 'Running',
    show_order_type_symbol: 1,
    show_kot_note: 1,
    show_alternative_item: 0,
    modifier_default_option: 0,
    dine_in_kot_no: 'DIN-',
    // ... add more as needed
  };

  const localSettings = { ...defaultSettings, ...settings };

  // Tab mapping
  const tabKeyMap = { 'Dine-in': 'dine_in', 'Pickup': 'pickup', 'Delivery': 'delivery', 'Quick Bill': 'quick_bill' };
  const tabKey = tabKeyMap[activeTab] || 'dine_in';

  // KOT No
  const kotNoPrefix = localSettings[`${tabKey}_kot_no`] || '';
  const displayKOTNo = currentKOTNo ? `${kotNoPrefix}${currentKOTNo}` : '—';

  // Order tag
  let orderTag = '';
  if (activeTab === 'Dine-in' && selectedTable && tableStatus !== null) {
    if (tableStatus === 0 && localSettings.show_new_order_tag) {
      orderTag = localSettings.new_order_tag_label || 'New';
    } else if ((tableStatus === 1 || tableStatus === 2) && localSettings.show_running_order_tag) {
      orderTag = localSettings.running_order_tag_label || 'Running';
    }
  }

  // Conditional flags
  const showStoreName = localSettings.show_store_name;
  const showWaiter = localSettings.show_waiter && (selectedWaiter || user?.name);
  const showCustomerOnKOT = activeTab === 'Dine-in' ? localSettings.customer_on_kot_dine_in : true;
  const showCustomerName = showCustomerOnKOT && customerName;
  const showCustomerMobile = showCustomerOnKOT && mobileNumber && localSettings.customer_kot_display_option === 'NAME_AND_MOBILE';
  const showTable = selectedTable && (activeTab === 'Dine-in' || localSettings[`table_name_${tabKey}`]);
  const showRateColumn = localSettings.show_item_price;
  const showAmountColumn = !localSettings.hide_item_Amt_column;
  const showAlternativeItem = localSettings.show_alternative_item;
  const modifierDefaultOption = localSettings.modifier_default_option;
  const showKotNote = localSettings.show_kot_note;

  // Grid columns
  const columns = ['35px', '1fr'];
  if (showRateColumn) columns.push('55px');
  if (showAmountColumn) columns.push('55px');
  const gridTemplateColumns = columns.join(' ');

  // DateTime
  const dateTime = new Date(date).toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  // Items HTML
  const itemsHtml = kotItems.map(item => {
    const qty = item.originalQty ? item.qty - item.originalQty : item.qty;
    const modifierHtml = modifierDefaultOption && item.modifier?.length ? 
      `<div style="font-size: 8pt; color: #666;">Modifiers: ${item.modifier.join(', ')}</div>` : '';
    const alternativeHtml = showAlternativeItem && item.alternativeItem ? 
      `<div style="font-size: 8pt; color: #666;">Alt: ${item.alternativeItem}</div>` : '';
    
    return `
      <div style="display: grid; grid-template-columns: ${gridTemplateColumns}; column-gap: 15px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 5px;">
        <div style="text-align: center; font-size: 12pt; font-weight: bold;">${qty}</div>
        <div style="text-align: left; font-size: 12pt;">
          ${item.name}
          <span style="font-size:11pt; color:#0066cc; font-weight:bold;">(${item.variantName || 'Standard'})</span>
          ${modifierHtml}${alternativeHtml}
        </div>
        ${showRateColumn ? `<div style="text-align: right">${Number(item.price || 0).toFixed(2)}</div>` : ''}
        ${showAmountColumn ? `<div style="text-align: right">${(item.price * qty).toFixed(2)}</div>` : ''}
      </div>
    `;
  }).join('');

  // Totals
  const totalQty = kotItems.reduce((sum, item) => sum + (item.originalQty ? item.qty - item.originalQty : item.qty), 0);
  const totalAmt = kotItems.reduce((sum, item) => sum + (item.price * (item.originalQty ? item.qty - item.originalQty : item.qty)), 0);

  const kotContent = `
    ${showStoreName ? `
    <div style="text-align: center; margin-bottom: 10px;">
      <div style="font-weight: bold; font-size: 12pt;">${restaurantName}</div>
      <div style="font-size: 8pt;">${outletName}</div>
    </div>
    <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />
    ` : ''}

    <div style="text-align: center; margin-bottom: 8px;">
      <div><strong>${localSettings.show_order_type_symbol ? '🔸 ' : ''}Order Type:</strong> ${activeTab} ${orderTag ? `- ${orderTag}` : ''}</div>
      ${showCustomerName ? `<div style="font-size: 9pt; margin-bottom: 6px;"><strong>Customer:</strong> ${customerName}</div>` : ''}
      ${showCustomerMobile ? `<div style="font-size: 9pt; margin-bottom: 6px;"><strong>Mobile:</strong> ${mobileNumber}</div>` : ''}
    </div>

    <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />

    <div style="display: grid; grid-template-columns: auto 1fr; gap: 12px; margin-bottom: 10px; font-size: 9pt;">
      <div style="border: 1px solid #696868; min-width: 70px; min-height: 55px; display: flex; align-items: center; justify-content: center; font-size: 16pt; font-weight: bold;">
        ${showTable ? selectedTable : activeTab}
      </div>
      <div style="display: flex; justify-content: flex-end;">
        <div style="display: grid; grid-template-columns: 60px auto; text-align: left;">
          <div><strong>KOT No:</strong></div><div>${displayKOTNo}</div>
          <div><strong>Date:</strong></div><div>${dateTime}</div>
          ${showWaiter ? `<div><strong>Waiter:</strong></div><div>${selectedWaiter || user?.name || 'N/A'}</div>` : ''}
        </div>
      </div>
    </div>

    ${localSettings.show_username ? `<div style="font-size: 9pt; margin-bottom: 6px;"><strong>Username:</strong> ${user.username}</div>` : ''}
    ${localSettings.show_terminal_username ? `<div style="font-size: 9pt; margin-bottom: 6px;"><strong>Terminal Username:</strong> ${user.terminal_username}</div>` : ''}
    ${localSettings.show_captain_username ? `<div style="font-size: 9pt; margin-bottom: 6px;"><strong>Captain Username:</strong> ${user.captain_username}</div>` : ''}

    <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />

    <div style="display: grid; grid-template-columns: ${gridTemplateColumns}; column-gap: 15px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 5px;">
      <div style="text-align: center">Qty</div>
      <div style="text-align: left">Item</div>
      ${showRateColumn ? `<div style="text-align: right">Rate</div>` : ''}
      ${showAmountColumn ? `<div style="text-align: right">Amt</div>` : ''}
    </div>

    ${itemsHtml}

    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 10pt;">
      <div style="padding: 2px 11px;">${totalQty}</div>
      ${showAmountColumn ? `<div> ₹${totalAmt.toFixed(2)}</div>` : ''}
    </div>

    ${showKotNote && kotNote ? `<div style="font-size: 9pt; margin-bottom: 6px;"><strong>Note:</strong> ${kotNote}</div>` : ''}
  `;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>KOT - ${displayKOTNo}</title>
  <style>
    @page { size: 302px auto; margin: 0; }
    html, body { 
      width: 302px !important; min-width: 302px !important; 
      margin: 0; padding: 0 6px; 
      font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.3; 
      color: #000; box-sizing: border-box; 
    }
    #kot-preview-content { min-width: 302px !important; margin: 0 auto; box-sizing: border-box; }
    .center { text-align: center; } .right { text-align: right; }
    .bold { font-weight: bold; } .text-large { font-size: 14px; }
    .text-small { font-size: 10px; } .text-smaller { font-size: 9px; }
    .separator { border: none; border-top: 1px dashed #000; margin: 5px 0; }
  </style>
</head>
<body>
  <div id="kot-preview-content">${kotContent}</div>
</body>
</html>`;
};

module.exports = { generateKOTHTML };


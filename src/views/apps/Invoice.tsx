

import React from "react";

const billData = {
  restaurant: "INDOOR RESTAURANT",
  address: "PARK, OLD P.B. ROAD, KOLHAUR",
  contact: ["0231-2524007", "2525007", "9916567007"],
  hsnCode: "996331",
  gstin: "27AFFPB5923D1ZV",
  fssai: "11515042000006",
  date: "25/07/2024",
  billNo: "14405",
  time: "23:25",
  tableNo: "4",
  items: [
    { desc: "BUTTER CHICKEN", qty: 1, rate: 370, amt: 370 },
    { desc: "BUTTER ROTI (WHEAT)", qty: 5, rate: 50, amt: 250 },
    { desc: "BUTTER NAAN", qty: 1, rate: 60, amt: 60 },
    { desc: "CHICKEN CHILLI", qty: 1, rate: 320, amt: 320 },
    { desc: "DRINKING WATER", qty: 1, rate: 20, amt: 20 },
    { desc: "JEERA RICE HALF", qty: 1, rate: 110, amt: 110 },
  ],
  taxableValue: 1130,
  cgst: 28.25,
  sgst: 28.25,
  total: 1187,
};

const BillPreview = () => (
  <div
    style={{
      maxWidth: 350,
      margin: "auto",
      padding: 20,
      fontFamily: "monospace",
      fontSize: 15,
      color: "#292929",
      background: "#fff1c1",
      border: "1px solid #dadada",
      borderRadius: 6,
      lineHeight: 1.5,
    }}
  >
    <center>
      <b>{billData.restaurant}</b>
      <div>{billData.address}</div>
      <div>
        {billData.contact.map((c, i) => (
          <span key={i}>{c}{i < billData.contact.length - 1 ? " / " : ""}</span>
        ))}
      </div>
      <div>HSN CODE-4&nbsp; SAC-{billData.hsnCode}</div>
      <div>GSTIN:{billData.gstin}</div>
      <div>FSSAI NO. {billData.fssai}</div>
    </center>
    <div style={{margin: "10px 0"}}>
      <span>DATE: {billData.date}</span>
      &nbsp; BILL NO. {billData.billNo} <br/>
      <span>TIME: {billData.time}</span>
      &nbsp; TABLE NO. {billData.tableNo}
    </div>
    <table width="100%" style={{borderCollapse:"collapse", marginTop:8, marginBottom:8}}>
      <thead>
        <tr>
          <th align="left">DESCRIPTION</th>
          <th>QTY</th>
          <th>RATE</th>
          <th>AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        {billData.items.map((item, idx) => (
          <tr key={idx}>
            <td>{item.desc}</td>
            <td align="center">{item.qty}</td>
            <td align="right">{item.rate}</td>
            <td align="right">{item.amt}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <div>TAXABLE VALUE: <span style={{float:"right"}}>{billData.taxableValue.toFixed(2)}</span></div>
    <div>CGST @2.5%: <span style={{float:"right"}}>{billData.cgst.toFixed(2)}</span></div>
    <div>SGST @2.5%: <span style={{float:"right"}}>{billData.sgst.toFixed(2)}</span></div>
    <hr style={{margin:"8px 0"}}/>
    <div style={{fontSize:18}}>
      <b>GRAND TOTAL RS. <span style={{float:"right"}}>{billData.total}</span></b>
    </div>
    <center style={{marginTop: 16}}>STAY SAFE. !! STAY HEALTH</center>
  </div>
);

export default BillPreview;

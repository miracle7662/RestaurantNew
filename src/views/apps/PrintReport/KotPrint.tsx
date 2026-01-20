import { useLocation } from "react-router-dom";

const KotPage = () => {
  const { state } = useLocation();
  const { items, kotNo, tableName } = state || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* ACTION BAR (NO PRINT) */}
      <div className="no-print mb-2">
        <button onClick={handlePrint} className="btn btn-primary">
          Print KOT
        </button>
      </div>

      {/* PREVIEW / PRINT CONTENT */}
      <div className="kot-container">
        <h4 className="text-center">KOT</h4>

        <div className="kot-header">
          <div>KOT : {kotNo}</div>
          <div>Table : {tableName}</div>
        </div>

        <hr />

        <table className="kot-table">
          <thead>
            <tr>
              <th>Item</th>
              <th align="right">Qty</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((i: any, idx: number) => (
              <tr key={idx}>
                <td>{i.name}</td>
                <td align="right">{i.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KotPage;

import { useEffect, useState } from "react";

const Logo = () => {
  const [currDate, setCurrDate] = useState("");

  useEffect(() => {
    const fetchCurrDate = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/dayend/latest-currdate");
        const data = await response.json();
        if (data.success) {
          setCurrDate(data.curr_date);
        }
      } catch (error) {
        console.error("Error fetching curr_date:", error);
      }
    };

    fetchCurrDate();
  }, []);

  return (
    <>
      <div className="barnd-logo flex items-center gap-2">
        <div className="logo-icon" style={{ width: "40px" }}>
          <img
            src="src/assets/images/logos/logo.jpg"
            alt="Logo"
            style={{ width: "100%", height: "auto" }}
          />
        </div>

        {/* 👇 Both text and date inside same logo-text div (collapses together) */}
        <div className="logo-text flex flex-col">
          <span
            style={{
              fontSize: "1.4rem",
              fontWeight: "700",
              color: "#000",
            }}
          >
            MIRACLE
          </span>
          <span
            style={{
              fontSize: "0.8rem",
              color: "#000",
              marginTop: "2px",
            }}
          >
            {currDate ? `Current
            
            Date: ${currDate}` : ""}
          </span>
        </div>
      </div>
    </>
  );
};

const LogoWhite = () => {
  return (
    <>
      <div className="barnd-logo flex items-center gap-2">
        <div className="logo-icon" style={{ width: "40px" }}>
          <img
            src="/logo-white.png"
            alt="White Logo"
            style={{ width: "100%", height: "auto" }}
          />
        </div>
        <div className="logo-text text-white flex flex-col">
          <span style={{ fontSize: "1.4rem", fontWeight: "700" }}>Miracle</span>
          <span style={{ fontSize: "0.8rem", color: "#000", marginTop: "2px" }}>
            {/* keep date logic separate if needed */}
          </span>
        </div>
      </div>
    </>
  );
};

export default Logo;
export { LogoWhite };

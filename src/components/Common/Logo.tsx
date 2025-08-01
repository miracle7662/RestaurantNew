const Logo = () => {
  return (
    <>
      <div className="barnd-logo">
        <div className="logo-icon">
          <img src="src/assets/images/logos/logo.jpg" alt="Logo" style={{ width: '100%', height: 'auto' }} />
        </div>
        <div className="logo-text">MIRACLE</div>
      </div>
    </>
  );
};

const LogoWhite = () => {
  return (
    <>
      <div className="barnd-logo">
        <div className="logo-icon">
          <img src="/logo-white.png" alt="White Logo" style={{ width: '100%', height: 'auto' }} />
        </div>
        <div className="logo-text text-white">Miracle</div>
      </div>
    </>
  );
};

export default Logo;
export { LogoWhite };
import logo from '@/assets/images/logos/logo.jpeg'

const Logo = ({ onClick }: { onClick?: () => void }) => {
 return (
  <div
    className="barnd-logo"
    style={{
      cursor: onClick ? 'pointer' : 'default',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      marginTop: '13px'   // 👈 yaha adjust karo (10–20px try karo)
    }}
    onClick={onClick}
  >
    <div className="logo-icon">
      <img src={logo} alt="Logo" style={{ maxWidth: '70px', height: 'auto' }} />
    </div>
  </div>
);
};

const LogoWhite = ({ onClick }: { onClick?: () => void }) => {
  return (
    <div className="barnd-logo" style={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div className="logo-icon">
        <img src={logo} alt="White Logo" style={{ width: '10%', height: 'auto' }} />
      </div>
     
    </div>
  );
};

export default Logo;
export { LogoWhite };
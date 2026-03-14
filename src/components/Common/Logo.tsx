import logo from '@/assets/images/logos/logo.jpg'

const Logo = ({ onClick }: { onClick?: () => void }) => {
  return (
    <div className="barnd-logo" style={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div className="logo-icon">
        <img src={logo} alt="Logo" style={{ width: '100%', height: 'auto' }} />
      </div>
      <div className="logo-text">MIRACLE</div>
    </div>
  );
};

const LogoWhite = ({ onClick }: { onClick?: () => void }) => {
  return (
    <div className="barnd-logo" style={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div className="logo-icon">
        <img src={logo} alt="White Logo" style={{ width: '100%', height: 'auto' }} />
      </div>
      <div className="logo-text text-white">Miracle</div>
    </div>
  );
};

export default Logo;
export { LogoWhite };
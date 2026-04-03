import { ThemeSettings, useThemeContext } from '@/common/context'

const DarkLight = () => {
  const { settings, updateSettings } = useThemeContext()

  const toggleDarkMode = () => {
    if (settings.theme === 'dark') {
      updateSettings({ theme: ThemeSettings.theme.light })
    } else {
      updateSettings({ theme: ThemeSettings.theme.dark })
    }
  }

  return (
    <div>
      <div className="header-btn">
        <div
          id="light-dark-mode"
          onClick={toggleDarkMode}
          style={{ cursor: 'pointer' }}
        >
          {settings.theme === 'dark' ? (
            <i className="fi fi-rr-sun fs-20 text-white" title="Light Mode" />
          ) : (
            <i className="fi fi-rr-moon fs-20 text-white" title="Dark Mode" />
          )}
        </div>
      </div>
    </div>
  )
}

export default DarkLight
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Dropdown } from 'react-bootstrap'
import { useAuthContext } from '@/common/context/useAuthContext'
import { profileDataGroup1,  profileDataGroup3 } from './data/profileData'
import NotificationOffcanvas from './Notifications/NotificationOffcanvas'
import profilePic from '@/assets/images/avatars/1.png'
import Avatar from './../UiElements/Base/Avatars/Avatar'
import Status from '../Misc/Status'
import { useNavigate } from 'react-router-dom'

const Profile = () => {
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true)
  const [dropDownOpen, setDropDownOpen] = useState<boolean>(false)
  const [showOffcanvas, setShowOffcanvas] = useState<boolean>(false)
  const toggleDropDown = () => {
    setDropDownOpen(!dropDownOpen)
  }
  const [status, setStatus] = useState('Online')
  // const statusOptions = [
  //   { label: 'Busy', color: 'warning' },
  //   { label: 'Online', color: 'success' },
  //   { label: 'Offline', color: 'secondary' },
  //   { label: 'Inactive', color: 'danger' },
  //   { label: 'Invisible', color: 'black' },
  //   { label: 'Always', color: 'info' },
  // ]
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
  }
  const toggleSound = () => {
    setIsSoundOn(!isSoundOn)
    const message = isSoundOn ? 'Sound turned off' : 'Sound turned on'

    toast(message, {
      icon: isSoundOn ? '🔕' : '🔔',
    })
  }
  const openOffcanvas = () => {
    setShowOffcanvas(true)
    setDropDownOpen(false)
  }

  const { user, removeSession } = useAuthContext()
  const navigate = useNavigate()

  const handleLogout = () => {
    removeSession()
navigate('/auth/minimal/login', { replace: true })
  }

  const handleCloseOffcanvas = () => {
    setShowOffcanvas(false)
  }

  return (
    <>
      <Dropdown show={dropDownOpen} onToggle={toggleDropDown}>
        <Dropdown.Toggle
          className="arrow-none header-btn px-2 d-flex align-items-center justify-content-center"
          as="a"
          role="button"
          onClick={toggleDropDown}
        >
          <i className="fi fi-rr-user text-white fs-5"></i>
        </Dropdown.Toggle>
        <Dropdown.Menu align="end" className="dropdown-md px-0 py-0">
          <div className="px-4 py-3 d-flex border-bottom">
            <Avatar type="image" src={profilePic} size="md" shape="2" className="flex-shrink-0" />
            <div className="flex-grow-1 ms-3">
              <h6 className="text-dark mb-0">{user?.name || 'User'}</h6>
              <small className="text-muted">{user?.role_level || 'User'}</small>
              <Status status={status} changeStatus={handleStatusChange} />
              
            </div>
          </div>
          <div className="px-2 pt-2">
            {profileDataGroup1.map(({ redirectTo, icon, label }, idx) => (
              <Link to={redirectTo} className="dropdown-item" key={idx}>
                <i className={icon}></i>
                <span className="ms-3">{label}</span>
              </Link>
            ))}
            <Link to="" className="dropdown-item" onClick={openOffcanvas}>
              <i className="fi fi-rr-bell"></i>
              <span className="ms-3">Notification</span>
            </Link>
          </div>
          <div className="dropdown-divider"></div>
          {/* <div className="px-2 py-2">
            {profileDataGroup2.map(({ redirectTo, icon, label }, idx) => (
              <Link to={redirectTo} className="dropdown-item" key={idx}>
                <i className={icon}></i>
                <span className="ms-3">{label}</span>
              </Link>
            ))}
          </div> */}
          <div className="dropdown-divider"></div>
          <div className="px-2 pb-2">
{profileDataGroup3.map(({ redirectTo, icon, label }, idx) => {
              if (label === 'Logout') {
                return (
                  <div 
                    className="dropdown-item text-danger cursor-pointer" 
                    key={idx}
                    onClick={handleLogout}
                  >
                    <i className={icon}></i>
                    <span className="ms-3">{label}</span>
                  </div>
                )
              }
              return (
                <Link to={redirectTo} className="dropdown-item text-danger" key={idx}>
                  <i className={icon}></i>
                  <span className="ms-3">{label}</span>
                </Link>
              )
            })}
          </div>
        </Dropdown.Menu>
      </Dropdown>
      {showOffcanvas && (
        <NotificationOffcanvas
          show={showOffcanvas}
          handleClose={handleCloseOffcanvas}
          toggleSound={toggleSound}
          isSoundOn={isSoundOn}
        />
      )}
    </>
  )
}

export default Profile

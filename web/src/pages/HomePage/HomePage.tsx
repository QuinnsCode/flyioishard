// import { Metadata } from '@redwoodjs/web'
import { Link, routes } from '@redwoodjs/router'

import { useAuth } from 'src/auth'
import Account from 'src/components/Account/Account'
import Auth from 'src/components/Auth/Auth'

const HomePage = () => {
  const { isAuthenticated } = useAuth()
  return (
    <div>
      {/* <Metadata title="Home" description="Home page" /> */}

      <h1>HomePage</h1>
      <>{!isAuthenticated ? <Auth /> : <Account />}</>
      <hr />
      <Link to={routes.login()}>
        <button className="rw-button mx-1 bg-black text-white">
          Go Login page
        </button>
      </Link>
    </div>
  )
}

export default HomePage

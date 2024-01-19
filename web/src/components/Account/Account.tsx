import { useState, useEffect } from 'react'

import { useAuth } from 'src/auth'

const Account = () => {
  const { client: supabase, logOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState(null)
  const [email, setEmail] = useState(null)
  const [website, setWebsite] = useState(null)
  const [avatar_url, setAvatarUrl] = useState(null)

  useEffect(() => {
    getProfile()
  }, [supabase.auth.session])

  async function getProfile() {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      setEmail(user.email)

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, website, avatar_url`)
        .eq('id', user.id)
        .single()

      if (error && status !== 406) {
        throw error
      }

      if (data) {
        console.log({ data })
        setUsername(data.username)
        setWebsite(data.website)
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile({ username, website, avatar_url }) {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const updates = {
        id: user.id,
        username,
        website,
        avatar_url,
        updated_at: new Date(),
      }

      const { error } = await supabase.from('profiles').upsert(updates, {
        returning: 'minimal', // Don't return the value after inserting
      })

      if (error) {
        throw error
      }

      alert('Updated profile!')
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="row flex-center flex">
      <div className="col-6 form-widget">
        <h1 className="header">Supabase + RedwoodJS</h1>
        <p className="description">Your profile</p>
        <div className="form-widget">
          <div className="border-2 border-black text-black">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="text"
              value={email}
              disabled
              className="text-black"
            />
          </div>
          <div className="border-2 border-green-600">
            <label htmlFor="username">Name</label>
            <input
              id="username"
              type="text"
              value={username || ''}
              onChange={(e) => setUsername(e.target.value)}
              className="text-black"
            />
          </div>
          <div className="border-2 border-green-600">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              type="text"
              value={website || ''}
              onChange={(e) => setWebsite(e.target.value)}
              className="text-black"
            />
          </div>

          <div>
            <button
              className="button primary rw-button m-1 block bg-gray-800 text-white hover:bg-gray-700"
              onClick={() => updateProfile({ username, website, avatar_url })}
              disabled={loading}
            >
              {loading ? 'Loading ...' : 'Update Profile'}
            </button>
          </div>

          <div>
            <button
              className="button rw-button m-1 block border-2 border-solid border-black bg-white text-black hover:border-2 hover:border-solid hover:bg-gray-300 hover:text-black"
              onClick={() => logOut()}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Account

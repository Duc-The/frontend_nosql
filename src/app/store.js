import { configureStore, createSlice } from '@reduxjs/toolkit'

const sessionKey = 'mua-xanh-session'

function readSession() {
  try {
    const value = JSON.parse(sessionStorage.getItem(sessionKey) || 'null')
    return value?.accessToken && Array.isArray(value.roles) ? value : null
  } catch {
    return null
  }
}

const auth = createSlice({
  name: 'auth',
  initialState: { session: readSession(), generation: 0 },
  reducers: {
    sessionRefreshed(state, { payload }) {
      state.session = payload
    },
    sessionChanged(state, { payload }) {
      state.generation += 1
      state.session = payload
    },
  },
})

export const { sessionChanged, sessionRefreshed } = auth.actions
export const store = configureStore({
  reducer: { auth: auth.reducer },
  devTools: import.meta.env.DEV,
})

store.subscribe(() => {
  const value = store.getState().auth.session
  try {
    if (value) sessionStorage.setItem(sessionKey, JSON.stringify(value))
    else sessionStorage.removeItem(sessionKey)
  } catch {
    // The in-memory session is still usable when browser storage is unavailable.
  }
})

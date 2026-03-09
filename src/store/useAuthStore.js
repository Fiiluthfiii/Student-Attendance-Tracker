import { create } from "zustand"
import supabase from "../services/supabaseClient"

const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  bootstrapAuth: async () => {
    const { data } = await supabase.auth.getUser()
    set({ user: data.user || null, loading: false })
  },
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))

export default useAuthStore

import { create } from 'zustand';
import Cookies from 'js-cookie';
import type { UserCookie } from '../types';

const COOKIE_KEY = 'int28_user';
const COOKIE_EXPIRES = 365;

interface UserStore {
  user: UserCookie | null;
  setUser: (user: UserCookie) => void;
  clearUser: () => void;
  loadFromCookie: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,

  setUser: (user) => {
    Cookies.set(COOKIE_KEY, JSON.stringify(user), { expires: COOKIE_EXPIRES });
    set({ user });
  },

  clearUser: () => {
    Cookies.remove(COOKIE_KEY);
    set({ user: null });
  },

  loadFromCookie: () => {
    const raw = Cookies.get(COOKIE_KEY);
    if (raw) {
      try {
        const user = JSON.parse(raw) as UserCookie;
        set({ user });
      } catch {
        Cookies.remove(COOKIE_KEY);
      }
    }
  },
}));

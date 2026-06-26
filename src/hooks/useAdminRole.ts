import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const ROOT_EMAIL = 'emon11vk@gmail.com';

interface AdminRoleState {
  loading: boolean;
  isAdmin: boolean;
  isRoot: boolean;
  email: string | null;
}

export function useAdminRole() {
  const [state, setState] = useState<AdminRoleState>({
    loading: true,
    isAdmin: false,
    isRoot: false,
    email: null,
  });

  useEffect(() => {
    let active = true;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (active)
          setState({ loading: false, isAdmin: false, isRoot: false, email: null });
        return;
      }

      const email = user.email ?? null;
      const isRoot = email?.toLowerCase() === ROOT_EMAIL.toLowerCase();
      let isAdmin = isRoot;

      if (!isRoot && email) {
        const { data, error } = await supabase
          .from('admins')
          .select('email')
          .ilike('email', email)
          .maybeSingle();
        isAdmin = !error && !!data;
      }

      if (active) setState({ loading: false, isAdmin, isRoot, email });
    })();

    return () => {
      active = false;
    };
  }, []);

  return state;
}

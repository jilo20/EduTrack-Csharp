// OWNER: Lopez, Mary Vincent. Data helpers for Mary's feature pages.
import { useCallback, useEffect, useState } from 'react';
import { getClasses } from '../../api/classes';
import { getCurrentUser } from '../../api/client';

export function useTeachingClasses() {
  const user = getCurrentUser();
  const id = user?.id;
  const role = user?.role;
  const loader = useCallback(async () => {
    if (!id || !['Teacher', 'Admin'].includes(role)) throw new Error('Sign in as a teacher or admin to view classes.');
    const classes = await getClasses(role === 'Teacher' ? id : undefined);
    return role === 'Teacher' ? classes.filter((c) => c.teacherId === id) : classes;
  }, [id, role]);
  return useFeatureData(loader);
}

// Ignore results from an older selection or an unmounted page.
export function useFeatureData(loader) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState(null);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(loader).then(
      (data) => { if (active) setResult({ loader, version, data, error: '' }); },
      (error) => { if (active) setResult({ loader, version, data: null, error: error.message || 'Unable to load data.' }); },
    );
    return () => { active = false; };
  }, [loader, version]);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const current = result?.loader === loader && result?.version === version;
  return { data: current ? result.data : null, error: current ? result.error : '', loading: !current, refresh };
}

export const displayNumber = (value, suffix = '') => value == null ? '—' : `${Number(value).toFixed(2)}${suffix}`;
export const localDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

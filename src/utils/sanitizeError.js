const ERROR_MAP = {
  '23505': 'ערך זה כבר קיים במערכת',
  '23503': 'לא ניתן לבצע פעולה זו — קיימת תלות בנתונים אחרים',
  '23502': 'חסרים שדות חובה',
  '42501': 'אין הרשאה לביצוע פעולה זו',
  'PGRST301': 'אין הרשאת גישה',
  'PGRST116': 'הרשומה לא נמצאה',
};

export function sanitizeError(error) {
  if (!error) return 'אירעה שגיאה בלתי צפויה';

  if (error.code && ERROR_MAP[error.code]) return ERROR_MAP[error.code];
  if (error.status === 429) return 'יותר מדי בקשות — נסה שוב בעוד מספר דקות';
  if (error.status === 403 || error.status === 401) return 'אין הרשאת גישה';
  if (error.status >= 500) return 'שגיאת שרת — נסה שוב מאוחר יותר';

  return 'אירעה שגיאה — נסה שוב';
}

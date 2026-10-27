# Customer Portal Redirect Loop Fix

## Problem
Visiting `/customer/login` caused continuous reload due to infinite redirect loop between login page and dashboard.

## Root Causes Identified

1. **Login Page**: No auth state check - stayed on login even when user was already authenticated
2. **Dashboard Page**: Redirected to login immediately without waiting for auth state to load
3. **API Interceptor**: Aggressively redirected to login on refresh failure, causing loops
4. **Auth Context**: No proper loading state handling

## Changes Made

### 1. Login Page (`app/customer/login/page.tsx`)
**Before**: No redirect logic when user is already authenticated
**After**: 
- Added `authLoading` and `isAuthenticated` checks from `useCustomerAuth()`
- Show loading spinner while `authLoading = true`
- Redirect to dashboard ONLY when `!authLoading && isAuthenticated && customer`
- Removed manual redirect after login (let useEffect handle it)

```typescript
// Wait for auth state to load
if (authLoading) {
  return <Loader2 className="animate-spin" />;
}

// Redirect if already authenticated
useEffect(() => {
  if (!authLoading && isAuthenticated && customer) {
    router.push('/customer/dashboard');
  }
}, [authLoading, isAuthenticated, customer, router]);
```

### 2. Dashboard Page (`app/customer/dashboard/page.tsx`)
**Before**: Returned `null` while loading, causing flash
**After**:
- Show proper loading UI while `authLoading = true`
- Only redirect when `!authLoading && !isAuthenticated`
- Return `null` only after redirect is triggered

```typescript
// Show loading state
if (authLoading) {
  return <LoadingScreen />;
}

// Don't render if not authenticated
if (!isAuthenticated) {
  return null;
}
```

### 3. Customer API Interceptor (`lib/customerApi.ts`)
**Before**: `window.location.href = '/customer/login'` on refresh failure
**After**:
- Removed aggressive redirect
- Let page-level auth checks handle redirects
- Prevents redirect loops

```typescript
catch (refreshError) {
  // DON'T redirect here - let pages handle it
  onRefreshed();
  return Promise.reject(refreshError);
}
```

### 4. Auth Context (`contexts/CustomerAuthContext.tsx`)
**Before**: Silent error handling
**After**:
- Added proper error logging
- Clear customer state on 401 errors
- No redirect logic in context (pages handle it)

```typescript
catch (error: any) {
  setCustomer(null);
  if (error?.response?.status === 401) {
    console.log('Session expired or invalid');
  }
}
```

### 5. Protected Pages (profile, create-job, job detail)
Applied same pattern as dashboard:
- Show loading UI while `authLoading = true`
- Redirect only when `!authLoading && !isAuthenticated`
- Return `null` after redirect is triggered

## Redirect Flow (Fixed)

### Scenario 1: User visits /customer/login (not authenticated)
1. AuthContext initializes → `isLoading = true`
2. Login page shows loading spinner
3. AuthContext fetches profile → 401 → `customer = null`, `isLoading = false`
4. Login page renders form (no redirect)
5. User logs in → `customer` set → useEffect triggers redirect to dashboard

### Scenario 2: User visits /customer/login (already authenticated)
1. AuthContext initializes → `isLoading = true`
2. Login page shows loading spinner
3. AuthContext fetches profile → 200 → `customer` set, `isLoading = false`
4. Login page useEffect detects `isAuthenticated` → redirects to dashboard
5. Dashboard loads normally

### Scenario 3: User visits /customer/dashboard (not authenticated)
1. AuthContext initializes → `isLoading = true`
2. Dashboard shows loading UI
3. AuthContext fetches profile → 401 → `customer = null`, `isLoading = false`
4. Dashboard useEffect detects `!isAuthenticated` → redirects to login
5. Login page loads normally

### Scenario 4: Token expires while on dashboard
1. API call returns 401
2. Interceptor attempts refresh → fails
3. Interceptor rejects promise (no redirect)
4. Next API call fails → AuthContext sets `customer = null`
5. Dashboard useEffect detects `!isAuthenticated` → redirects to login

## Key Principles

1. **Single Source of Truth**: Only page-level useEffect handles redirects
2. **Wait for Loading**: Never redirect while `authLoading = true`
3. **No Aggressive Redirects**: API interceptor doesn't redirect
4. **Proper Loading States**: Show UI while checking auth
5. **Conditional Rendering**: Return `null` only after redirect is triggered

## Testing Checklist

- [ ] Visit `/customer/login` when not authenticated → shows login form
- [ ] Visit `/customer/login` when authenticated → redirects to dashboard
- [ ] Visit `/customer/dashboard` when not authenticated → redirects to login
- [ ] Visit `/customer/dashboard` when authenticated → shows dashboard
- [ ] Login successfully → redirects to dashboard
- [ ] Logout → redirects to login
- [ ] Token expires → next page load redirects to login
- [ ] Refresh page on dashboard → stays on dashboard (if authenticated)
- [ ] No infinite reload loops on any page

## Files Modified

1. `projectt/app/customer/login/page.tsx`
2. `projectt/app/customer/dashboard/page.tsx`
3. `projectt/app/customer/profile/page.tsx`
4. `projectt/app/customer/create-job/page.tsx`
5. `projectt/app/customer/job/[id]/page.tsx`
6. `projectt/contexts/CustomerAuthContext.tsx`
7. `projectt/lib/customerApi.ts`

## Next Steps

1. Test the login flow manually
2. Test all protected pages
3. Test token expiration scenarios
4. Verify no console errors
5. Check network tab for unnecessary API calls

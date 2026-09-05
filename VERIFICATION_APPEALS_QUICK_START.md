# Verification Appeals - Quick Reference

## Components

### VerificationAppealForm
**Purpose**: User-facing appeal submission form for rejected verification requests

**Location**: `/client/src/components/VerificationAppealForm.tsx`

**Props**:
```typescript
interface VerificationAppealFormProps {
  requestId: string;           // ID of the rejected verification request
  rejectionReason?: string;    // Original rejection reason to display
  onSuccess?: () => void;      // Callback when appeal submitted
}
```

**Usage**:
```tsx
import { VerificationAppealForm } from '../components/VerificationAppealForm';

export function RequestVerificationPage() {
  const [existing, setExisting] = useState<VerificationRequest | null>(null);
  
  return (
    <>
      {existing?.status === 'rejected' && (
        <VerificationAppealForm
          requestId={existing.id}
          rejectionReason={existing.rejectionReason}
          onSuccess={() => {
            // Refresh verification status
            api.get('/verification/me').then(res => setExisting(res.data));
          }}
        />
      )}
    </>
  );
}
```

**Features**:
- Shows rejection reason
- Form toggles on demand
- Appeal history display
- Status badge visualization
- Character counter
- Rate limiting info
- Dark mode support

---

### AdminAppealDashboard
**Purpose**: Admin interface for reviewing and managing appeals

**Location**: `/client/src/components/AdminAppealDashboard.tsx`

**Props**: None (uses authenticated user context)

**Usage**:
```tsx
import { AdminAppealDashboard } from '../components/AdminAppealDashboard';

export function AdminPage() {
  return (
    <div className="p-8">
      <AdminAppealDashboard />
    </div>
  );
}
```

**Features**:
- Filter appeals by status (all, pending, under_review, approved, rejected)
- View full appeal context (user, evidence, links)
- Quick approve/reject with modal
- Review notes input
- Appeal count per status
- Real-time updates
- Document preview links
- Mobile responsive

---

## API Functions

All functions in `/client/src/lib/api.ts`:

### User Functions

```typescript
// Submit a new appeal
submitVerificationAppeal({
  requestId: string;
  appealDto: {
    appealReason: string;        // 20-3000 characters
    documentUrls?: string[];     // Max 5
    links?: string[];            // Max 5
    metadata?: Record<string, any>;
  }
}): Promise<VerificationAppeal>

// Get user's appeals
getUserVerificationAppeals(): Promise<VerificationAppeal[]>

// Get specific appeal
getVerificationAppeal(appealId: string): Promise<VerificationAppeal>
```

### Admin Functions

```typescript
// Get appeals by status
getAdminPendingAppeals(status?: string): Promise<VerificationAppeal[]>
// Status: 'pending', 'under_review', 'approved', 'rejected'

// Approve an appeal
approveVerificationAppeal(appealId: string): Promise<VerificationAppeal>

// Reject an appeal
rejectVerificationAppeal(appealId: string, notes: string): Promise<VerificationAppeal>

// Mark under review
markAppealUnderReview(appealId: string): Promise<VerificationAppeal>
```

---

## Data Types

```typescript
interface VerificationAppeal {
  id: string;                    // UUID
  userId: string;                // Appeal submitter
  requestId: string;             // Original verification request
  reason: string;                // Appeal explanation
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  documentUrls?: string[];       // Supporting documents
  links?: string[];              // Supporting links
  submittedAt: string;          // ISO date
  reviewedAt?: string;          // ISO date
  reviewedBy?: string;          // Admin ID
  reviewNotes?: string;         // Admin feedback
}
```

---

## Integration Example

### Complete Flow in request-verification.tsx

```tsx
import { VerificationAppealForm } from '../components/VerificationAppealForm';

export default function RequestVerificationPage() {
  const [existing, setExisting] = useState<VerificationRequest | null>(null);

  // ... existing code ...

  if (existing?.status === 'rejected') {
    return (
      <PageShell title="Request Verification">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Show rejection reason */}
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 font-semibold text-red-700">
              <XCircle size={18} />
              Previous request was not approved
            </div>
            {existing.rejectionReason && (
              <p className="mt-1 text-sm text-red-600">
                <strong>Reason:</strong> {existing.rejectionReason}
              </p>
            )}
          </div>

          {/* Integrate appeal form */}
          <VerificationAppealForm
            requestId={existing.id}
            rejectionReason={existing.rejectionReason}
            onSuccess={() => {
              // Refresh status
              api.get('/verification/me').then(res => setExisting(res.data));
            }}
          />

          {/* Helpful tip */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Provide additional evidence or context that
              addresses the reason for rejection.
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  // ... rest of component ...
}
```

### Admin Page Integration

```tsx
import { AdminAppealDashboard } from '../components/AdminAppealDashboard';

export function AdminPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-900">
      <div className="container mx-auto py-8">
        <AdminAppealDashboard />
      </div>
    </div>
  );
}
```

---

## Validation Rules

### Client-Side
- Appeal reason: 20-3000 characters
- Supporting links: Max 5, one per line
- Document URLs: Max 5, one per line
- Form submission blocked until validation passes

### Server-Side (Already Implemented)
- Only rejected requests can be appealed
- Max 3 appeals per request
- 7-day cooldown after first rejection
- 30-day cooldown after appeal rejection
- All URLs must be valid
- Sensitive data encrypted

---

## Styling

Components use:
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Dark mode support** via `dark:` prefix
- **Custom classes**: `surface`, `dark-*` (see themes.ts)

---

## Error Handling

All API functions handle errors automatically:

```typescript
try {
  await submitVerificationAppeal(payload);
  addToast('Appeal submitted!', 'success');
} catch (error: any) {
  const message = error.response?.data?.message;
  addToast(
    Array.isArray(message) ? message[0] : message || 'Failed to submit',
    'error',
  );
}
```

---

## UI States

### VerificationAppealForm States

1. **Collapsed** - "Submit an Appeal" button
2. **Form** - Appeal submission form
3. **Submitted** - Success message with checkmark
4. **History** - List of user's appeals with status

### AdminAppealDashboard States

1. **Loading** - Spinner while fetching appeals
2. **Empty** - Message when no appeals to display
3. **List** - Appeals grid with status filters
4. **Modal** - Appeal details with approve/reject options

---

## Icons Used

- `CheckCircle` - Approved appeals
- `XCircle` - Rejected appeals, rejected requests
- `Clock` - Pending/under review appeals
- `AlertCircle` - Important information
- `Loader` - Loading state

---

## Responsive Design

- Mobile-first approach
- Grid layouts stack on small screens
- Forms full width on mobile
- Modal adapts to screen size
- Touch-friendly button sizes

---

## Dark Mode

Components automatically support dark mode via Tailwind:
- Background: `dark:bg-dark-900`
- Text: `dark:text-white`, `dark:text-dark-300`
- Border: `dark:border-dark-700`
- Surface: `dark:bg-dark-900`

---

## Performance Tips

1. **Memoization**: Components use `useState` for local state
2. **Lazy Load**: Load appeals only when viewing appeal history
3. **Pagination**: Admin dashboard handles large appeal lists
4. **Caching**: Recent appeals cached in component state
5. **Debouncing**: Form input validated with debounce

---

## Debugging

### Enable console logs:
```typescript
// In components
console.log('Appeal submitted:', response);
console.log('Admin appeals:', appeals);
```

### Check network requests:
- Open DevTools > Network tab
- Look for `/verification/appeals` requests
- Check request/response payloads

### Check validation:
- Form shows character count
- Error messages display clearly
- Toast notifications for feedback

---

## Common Issues

### Appeal form not showing
✓ Check that `existing?.status === 'rejected'`
✓ Verify `requestId` is passed correctly

### Admin dashboard not loading
✓ Verify user has admin role
✓ Check that API endpoint is accessible
✓ Look for console errors

### Approval not working
✓ Verify review notes are provided
✓ Check admin permissions
✓ See server logs for errors

### Cooldown not enforced
✓ Server handles cooldown automatically
✓ User sees cooldown message in UI
✓ API rejects early submissions

---

## Next Steps

1. Deploy components to production
2. Add to admin page
3. Test with rejected verification requests
4. Monitor appeal success rates
5. Adjust validation rules if needed
6. Consider adding analytics

---

**For more details, see**: `/VERIFICATION_APPEALS_IMPLEMENTATION.md`

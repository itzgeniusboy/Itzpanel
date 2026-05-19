# Security Specification: OneCore Pro

## 1. Data Invariants
- A `License` must always have a `resellerId` corresponding to the user who created it (unless it's a bootstrapped admin key).
- An `AppBuild` must be linked to a valid `resellerId`.
- Users with the `user` role cannot access specific reseller or admin functionality until promoted.
- Promotion to `reseller` requires a valid, unused `InviteCode`.
- Once an `InviteCode` is used, it remains linked to the consumer `uid` and cannot be reused.

## 2. The "Dirty Dozen" Payloads (Red Team Test Cases)

1. **Identity Spoofing**: Attempt to create a license with a `resellerId` that is not your own.
   - Payload: `{ key: 'GHOST-KEY', resellerId: 'SOMEONE-ELSE-UID', ... }`
   - Expected: `PERMISSION_DENIED`

2. **Role Escalation**: A `user` attempting to update their own role directly without following the referral protocol.
   - Payload: `{ role: 'admin' }` (patching `/users/{uid}`)
   - Expected: `PERMISSION_DENIED`

3. **Global Config Poisoning**: A non-admin trying to modify `system/config`.
   - Expected: `PERMISSION_DENIED`

4. **Shadow Build**: Creating an `AppBuild` for a different `resellerId`.
   - Expected: `PERMISSION_DENIED`

5. **Stale License Update**: Attempting to change the `resellerId` of an existing license you own.
   - Expected: `PERMISSION_DENIED` (Immutability check)

6. **Invite Replay**: Attempting to use a already `isUsed: true` invite code.
   - Expected: `PERMISSION_DENIED`

7. **HWID Hijack**: Authenticated user trying to reset another reseller's license deviceId.
   - Expected: `PERMISSION_DENIED`

8. **Admin Lockout**: Trying to delete admin documents as a reseller.
   - Expected: `PERMISSION_DENIED`

9. **PII Leak**: Authenticated user trying to list all user profiles.
   - Expected: `PERMISSION_DENIED` (Strict `list` rule on `/users`)

10. **Data Injection**: Sending a description/note field over 1MB.
    - Expected: Rejected by `.size()` constraints in validation helpers.

11. **Future Dating**: Setting a `createdAt` timestamp in the future.
    - Note: Handled by server-side logic and validation relative to `request.time` if implemented.

12. **Orphan Cluster**: Deleting a license that has active builds attached.
    - Note: Managed via client-side logic + admin-only delete rules.

## 3. Implementation Status
- [x] Comprehensive `firestore.rules` updated.
- [x] Blueprint updated to reflect new entities.
- [x] UI conditional rendering settled.
- [x] Snapshot listeners protected from unauthorized queries.

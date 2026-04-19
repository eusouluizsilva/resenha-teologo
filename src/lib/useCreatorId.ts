// Returns the current creator ID.
// Before Clerk is connected, returns a fixed demo ID so data persists in Convex.
// After Clerk is connected, replace this with: useUser().user?.id ?? null
export function useCreatorId(): string {
  return 'demo-creator'
}

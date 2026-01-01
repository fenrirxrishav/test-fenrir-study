import { useMemo } from 'react';
import { Query, DocumentReference, queryEqual, refEqual } from 'firebase/firestore';

type FirebaseRef = Query | DocumentReference;

export function useMemoFirebase<T extends FirebaseRef | null>(
  ref: T,
): T {
  const memoizedRef = useMemo(() => ref, [ref ? getRefKey(ref) : null]);
  return memoizedRef;
}

function getRefKey(ref: FirebaseRef): string {
    if ('path' in ref) { // It's a DocumentReference
        return ref.path;
    }
    // It's a Query
    // This is a simplified way to create a key. For complex queries, you might need a more robust approach.
    return (ref as any)._query.canonicalId();
}

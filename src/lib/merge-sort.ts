export interface MergeSortState {
  queue: number[][];
  current: {
    left: number[];
    right: number[];
    leftPtr: number;
    rightPtr: number;
    merged: number[];
  } | null;
  finalOrder: number[] | null;
  totalSongs: number;
  comparisonsDone: number;
  /** Snapshot of the state before the last comparison, used for undo */
  previousSnapshot?: Omit<MergeSortState, "previousSnapshot">;
}

export function initMergeSort(songIds: number[]): MergeSortState {
  const shuffled = [...songIds].sort(() => Math.random() - 0.5);
  const queue = shuffled.map((id) => [id]);
  return advanceToNextComparison({
    queue,
    current: null,
    finalOrder: null,
    totalSongs: shuffled.length,
    comparisonsDone: 0,
  });
}

/**
 * Start the next merge from the queue, or finalize if only one list remains.
 */
function advanceToNextComparison(state: MergeSortState): MergeSortState {
  if (state.current) return state; // already have a comparison ready

  if (state.queue.length < 2) {
    return {
      ...state,
      finalOrder: state.queue[0] ?? [],
    };
  }

  const [left, right, ...rest] = state.queue;
  return {
    ...state,
    queue: rest,
    current: { left, right, leftPtr: 0, rightPtr: 0, merged: [] },
  };
}

export function getNextPair(
  state: MergeSortState
): { songAId: number; songBId: number } | null {
  if (!state.current || state.finalOrder) return null;
  return {
    songAId: state.current.left[state.current.leftPtr],
    songBId: state.current.right[state.current.rightPtr],
  };
}

/** Strip previousSnapshot to avoid deeply nested history */
function stripSnapshot(state: MergeSortState): Omit<MergeSortState, "previousSnapshot"> {
  const { previousSnapshot: _, ...rest } = state;
  return rest;
}

export function recordChoice(
  state: MergeSortState,
  winnerId: number
): MergeSortState {
  if (!state.current) return state;

  const snapshot = stripSnapshot(state);

  const { left, right, leftPtr, rightPtr, merged } = state.current;
  const newMerged = [...merged, winnerId];
  let newLeftPtr = leftPtr;
  let newRightPtr = rightPtr;

  if (left[leftPtr] === winnerId) {
    newLeftPtr++;
  } else if (right[rightPtr] === winnerId) {
    newRightPtr++;
  } else {
    return state; // invalid winner
  }

  const newComparisonsDone = state.comparisonsDone + 1;

  // If one side is exhausted, append the rest and complete the merge
  if (newLeftPtr >= left.length) {
    newMerged.push(...right.slice(newRightPtr));
    return {
      ...advanceToNextComparison({
        queue: [...state.queue, newMerged],
        current: null,
        finalOrder: null,
        totalSongs: state.totalSongs,
        comparisonsDone: newComparisonsDone,
      }),
      previousSnapshot: snapshot,
    };
  }

  if (newRightPtr >= right.length) {
    newMerged.push(...left.slice(newLeftPtr));
    return {
      ...advanceToNextComparison({
        queue: [...state.queue, newMerged],
        current: null,
        finalOrder: null,
        totalSongs: state.totalSongs,
        comparisonsDone: newComparisonsDone,
      }),
      previousSnapshot: snapshot,
    };
  }

  return {
    ...state,
    current: {
      left,
      right,
      leftPtr: newLeftPtr,
      rightPtr: newRightPtr,
      merged: newMerged,
    },
    comparisonsDone: newComparisonsDone,
    previousSnapshot: snapshot,
  };
}

/**
 * Remove songs from the sort entirely (for skip).
 */
export function removeSongs(
  state: MergeSortState,
  songIdsToRemove: number[]
): MergeSortState {
  const toRemove = new Set(songIdsToRemove);

  // Remove from queue
  const newQueue = state.queue
    .map((list) => list.filter((id) => !toRemove.has(id)))
    .filter((list) => list.length > 0);

  if (!state.current) {
    return advanceToNextComparison({
      queue: newQueue,
      current: null,
      finalOrder: null,
      totalSongs: state.totalSongs - songIdsToRemove.length,
      comparisonsDone: state.comparisonsDone,
    });
  }

  const { left, right, leftPtr, rightPtr, merged } = state.current;
  const newMerged = merged.filter((id) => !toRemove.has(id));
  const newLeft = left.filter((id) => !toRemove.has(id));
  const newRight = right.filter((id) => !toRemove.has(id));

  // Count how many removed items were before the pointers
  const leftBeforePtr = left
    .slice(0, leftPtr)
    .filter((id) => toRemove.has(id)).length;
  const rightBeforePtr = right
    .slice(0, rightPtr)
    .filter((id) => toRemove.has(id)).length;
  const adjLeftPtr = leftPtr - leftBeforePtr;
  const adjRightPtr = rightPtr - rightBeforePtr;

  // If one or both sides exhausted after removal, complete the merge
  if (adjLeftPtr >= newLeft.length && adjRightPtr >= newRight.length) {
    const finalMerged =
      newMerged.length > 0 ? [...newQueue, newMerged] : newQueue;
    return advanceToNextComparison({
      queue: finalMerged,
      current: null,
      finalOrder: null,
      totalSongs: state.totalSongs - songIdsToRemove.length,
      comparisonsDone: state.comparisonsDone,
    });
  }

  if (adjLeftPtr >= newLeft.length) {
    newMerged.push(...newRight.slice(adjRightPtr));
    return advanceToNextComparison({
      queue: [...newQueue, newMerged],
      current: null,
      finalOrder: null,
      totalSongs: state.totalSongs - songIdsToRemove.length,
      comparisonsDone: state.comparisonsDone,
    });
  }

  if (adjRightPtr >= newRight.length) {
    newMerged.push(...newLeft.slice(adjLeftPtr));
    return advanceToNextComparison({
      queue: [...newQueue, newMerged],
      current: null,
      finalOrder: null,
      totalSongs: state.totalSongs - songIdsToRemove.length,
      comparisonsDone: state.comparisonsDone,
    });
  }

  return {
    queue: newQueue,
    current: {
      left: newLeft,
      right: newRight,
      leftPtr: adjLeftPtr,
      rightPtr: adjRightPtr,
      merged: newMerged,
    },
    finalOrder: null,
    totalSongs: state.totalSongs - songIdsToRemove.length,
    comparisonsDone: state.comparisonsDone,
  };
}

export function isComplete(state: MergeSortState): boolean {
  return state.finalOrder !== null;
}

export function hasPreviousSnapshot(state: MergeSortState): boolean {
  return !!state.previousSnapshot;
}

export function restoreSnapshot(state: MergeSortState): MergeSortState {
  if (!state.previousSnapshot) return state;
  return { ...state.previousSnapshot };
}

export function estimateTotal(n: number): number {
  if (n <= 1) return 0;
  return n * Math.ceil(Math.log2(n));
}

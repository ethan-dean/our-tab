import { useReducer, useMemo } from 'react';
import { type Profile } from '../../../types/database';

// --- State and Action Types ---

export type SplitMode = 'even' | 'custom';

export interface MemberSplit {
  profile: Profile;
  inputValue: string; // Raw string from the input for custom split
  calculatedAmount: number;
  isLocked: boolean; // For custom split: if user has entered a value
  isContributing: boolean; // For even split: if user is part of the split
}

interface State {
  memberSplits: MemberSplit[];
  totalAmount: number;
  splitMode: SplitMode;
  payerId: string | null;
}

type Action =
  | { type: 'SET_MEMBERS'; payload: { members: Profile[], payerId: string | null } }
  | { type: 'SET_TOTAL_AMOUNT'; payload: number }
  | { type: 'SET_SPLIT_MODE'; payload: SplitMode }
  | { type: 'SET_PAYER'; payload: string | null }
  | { type: 'UPDATE_SPLIT_VALUE'; payload: { userId: string; value: string } }
  | { type: 'TOGGLE_CONTRIBUTING'; payload: { userId: string } };

// --- Helper Function ---

const recalculateSplits = (state: State): MemberSplit[] => {
  if (state.splitMode === 'even') {
    const contributingMembers = state.memberSplits.filter(ms => ms.isContributing);
    const share = contributingMembers.length > 0 ? state.totalAmount / contributingMembers.length : 0;
    return state.memberSplits.map(ms => ({
      ...ms,
      calculatedAmount: ms.isContributing ? share : 0,
    }));
  }

  // Custom split logic
  let remainingAmount = state.totalAmount;
  let lockedAmount = 0;
  let unlockedMemberCount = 0;

  state.memberSplits.forEach(ms => {
    if (ms.isLocked) {
      const value = parseFloat(ms.inputValue) || 0;
      lockedAmount += value;
    } else {
      unlockedMemberCount++;
    }
  });

  remainingAmount -= lockedAmount;
  const equalShare = unlockedMemberCount > 0 ? remainingAmount / unlockedMemberCount : 0;

  return state.memberSplits.map(ms => ({
    ...ms,
    calculatedAmount: ms.isLocked ? parseFloat(ms.inputValue) || 0 : equalShare,
  }));
};


// --- Reducer Function ---

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_MEMBERS': {
      const intermediateState = {
        ...state,
        payerId: action.payload.payerId,
        memberSplits: action.payload.members.map(profile => ({
          profile,
          inputValue: '',
          calculatedAmount: 0,
          isLocked: false,
          isContributing: profile.id === action.payload.payerId,
        })),
      };
      const newMemberSplits = recalculateSplits(intermediateState);
      return { ...intermediateState, memberSplits: newMemberSplits };
    }

    case 'SET_TOTAL_AMOUNT': {
      const intermediateState = { ...state, totalAmount: action.payload };
      const newMemberSplits = recalculateSplits(intermediateState);
      return { ...intermediateState, memberSplits: newMemberSplits };
    }

    case 'SET_SPLIT_MODE': {
      const intermediateState = { ...state, splitMode: action.payload };
      const newMemberSplits = recalculateSplits(intermediateState);
      return { ...intermediateState, memberSplits: newMemberSplits };
    }

    case 'SET_PAYER': {
      let memberSplits = state.memberSplits;
      if (state.splitMode === 'even') {
        memberSplits = state.memberSplits.map(ms => ({...ms, isContributing: ms.profile.id === action.payload }))
      }
      const intermediateState = { ...state, payerId: action.payload, memberSplits };
      const newMemberSplits = recalculateSplits(intermediateState);
      return { ...intermediateState, memberSplits: newMemberSplits };
    }

    case 'TOGGLE_CONTRIBUTING': {
      const intermediateState = {
        ...state,
        memberSplits: state.memberSplits.map(ms =>
          ms.profile.id === action.payload.userId
            ? { ...ms, isContributing: !ms.isContributing }
            : ms
        ),
      };
      const newMemberSplits = recalculateSplits(intermediateState);
      return { ...intermediateState, memberSplits: newMemberSplits };
    }

    case 'UPDATE_SPLIT_VALUE': {
      const intermediateState = {
        ...state,
        memberSplits: state.memberSplits.map(ms =>
          ms.profile.id === action.payload.userId
            ? { ...ms, inputValue: action.payload.value, isLocked: true }
            : ms
        ),
      };
      const newMemberSplits = recalculateSplits(intermediateState);
      return { ...intermediateState, memberSplits: newMemberSplits };
    }

    default:
      return state;
  }
};

// --- The Hook ---

export const useExpenseSplit = () => {
  const initialState: State = {
    memberSplits: [],
    totalAmount: 0,
    splitMode: 'even',
    payerId: null,
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  const totalSplitAmount = useMemo(() => 
    state.memberSplits.reduce((acc, ms) => acc + ms.calculatedAmount, 0),
    [state.memberSplits]
  );

  const isSplitValid = Math.abs(state.totalAmount - totalSplitAmount) < 0.01;

  return {
    ...state,
    dispatch,
    totalSplitAmount,
    isSplitValid,
  };
};
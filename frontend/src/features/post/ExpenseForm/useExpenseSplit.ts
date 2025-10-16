import { useReducer, useEffect, useMemo } from 'react';
import { type Profile } from '../../../types/database';

// --- State and Action Types ---

export interface MemberSplit {
  profile: Profile;
  inputValue: string; // Raw string from the input
  calculatedAmount: number;
  isLocked: boolean;
}

interface State {
  memberSplits: MemberSplit[];
  totalAmount: number;
}

type Action =
  | { type: 'SET_MEMBERS'; payload: Profile[] }
  | { type: 'SET_TOTAL_AMOUNT'; payload: number }
  | { type: 'UPDATE_SPLIT_VALUE'; payload: { userId: string; value: string } }
  | { type: 'TOGGLE_LOCK'; payload: { userId: string; isLocked: boolean } }
  | { type: 'RECALCULATE_SPLITS' };

// --- Reducer Function ---

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_MEMBERS':
      return {
        ...state,
        memberSplits: action.payload.map(profile => ({
          profile,
          inputValue: '',
          calculatedAmount: 0,
          isLocked: false,
        })),
      };
    case 'SET_TOTAL_AMOUNT':
      return { ...state, totalAmount: action.payload };
    case 'UPDATE_SPLIT_VALUE':
      return {
        ...state,
        memberSplits: state.memberSplits.map(ms =>
          ms.profile.id === action.payload.userId
            ? { ...ms, inputValue: action.payload.value, isLocked: true }
            : ms
        ),
      };
    case 'TOGGLE_LOCK':
        return {
            ...state,
            memberSplits: state.memberSplits.map(ms =>
              ms.profile.id === action.payload.userId
                ? { ...ms, isLocked: action.payload.isLocked, inputValue: action.payload.isLocked ? ms.calculatedAmount.toFixed(2) : '' }
                : ms
            ),
          };
    case 'RECALCULATE_SPLITS': {
      let remainingAmount = state.totalAmount;
      let lockedAmount = 0;
      let unlockedMemberCount = 0;

      state.memberSplits.forEach(ms => {
        if (ms.isLocked) {
          const value = parseFloat(ms.inputValue) || 0;
          lockedAmount += value;
        }
      });

      remainingAmount -= lockedAmount;

      state.memberSplits.forEach(ms => {
        if (!ms.isLocked) {
          unlockedMemberCount++;
        }
      });

      const equalShare = unlockedMemberCount > 0 ? remainingAmount / unlockedMemberCount : 0;

      const newMemberSplits = state.memberSplits.map(ms => ({
        ...ms,
        calculatedAmount: ms.isLocked ? parseFloat(ms.inputValue) || 0 : equalShare,
      }));

      return { ...state, memberSplits: newMemberSplits };
    }
    default:
      return state;
  }
};

// --- The Hook ---

export const useExpenseSplit = (initialMembers: Profile[], initialTotal: number = 0) => {
  const initialState: State = {
    memberSplits: initialMembers.map(profile => ({
      profile,
      inputValue: '',
      calculatedAmount: 0,
      isLocked: false,
    })),
    totalAmount: initialTotal,
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  // Recalculate splits whenever total amount or locked members change
  useEffect(() => {
    dispatch({ type: 'RECALCULATE_SPLITS' });
  }, [state.totalAmount, state.memberSplits.filter(m => m.isLocked).map(m => m.profile.id).join(','), state.memberSplits.map(m => m.isLocked).join(',')]);

  const totalSplitAmount = useMemo(() => 
    state.memberSplits.reduce((acc, ms) => acc + ms.calculatedAmount, 0),
    [state.memberSplits]
  );

  const isSplitValid = Math.abs(state.totalAmount - totalSplitAmount) < 0.01;

  return {
    memberSplits: state.memberSplits,
    dispatch,
    totalSplitAmount,
    isSplitValid,
  };
};

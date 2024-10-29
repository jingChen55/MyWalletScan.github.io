import { useReducer } from 'react';

const initialState = {
  loading: {
    table: false,
    batch: false,
    refresh: false
  },
  selectedKeys: [],
  hideColumn: true,
  isBatchModalVisible: false
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, ...action.payload }};
    case 'SET_SELECTED_KEYS':
      return { ...state, selectedKeys: action.payload };
    case 'TOGGLE_HIDE_COLUMN':
      return { ...state, hideColumn: !state.hideColumn };
    case 'SET_BATCH_MODAL':
      return { ...state, isBatchModalVisible: action.payload };
    default:
      return state;
  }
}

export const useLineaState = () => {
  return useReducer(reducer, initialState);
};

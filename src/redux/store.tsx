import { configureStore } from '@reduxjs/toolkit';
import { createWrapper } from 'next-redux-wrapper';
import rootReducer from './rootReducers'; // Your root reducer

// Create a Redux store using Redux Toolkit's configureStore
const store = configureStore({
    reducer: rootReducer, // Pastikan rootReducer sudah terkonfigurasi
    devTools: process.env.NODE_ENV !== 'production', // Menyalakan Redux DevTools di development mode
  });

// Function to create and return the store
const makeStore = () => store;

// Create and export the wrapper using createWrapper from next-redux-wrapper
export const wrapper = createWrapper(makeStore);

import React, { createContext, useContext, useState, ReactNode } from "react";

// Definisikan tipe untuk context
interface DataContextType {
  data: any; // Ubah `any` ke tipe spesifik jika diketahui
  setData: React.Dispatch<React.SetStateAction<any>>;
}

// Buat context dengan default `undefined`
const dataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [data, setData] = useState<any>(null); // Ubah `any` sesuai kebutuhan

  return (
    <dataContext.Provider value={{ data, setData }}>
      {children}
    </dataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(dataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

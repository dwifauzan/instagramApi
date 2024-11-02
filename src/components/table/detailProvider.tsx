import React, {createContext, useContext, useState} from "react";
const dataContext = createContext()

export const DataProvider = ({children}:{children:any}) => {
    const [data, setData] = useState(null)
    
    return (
        <dataContext.Provider value={{data, setData}}>
            {children}
        </dataContext.Provider>
    )
}

export const useData = () => {
    return useContext(dataContext)
}

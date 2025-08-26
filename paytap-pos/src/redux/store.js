import { configureStore } from "@reduxjs/toolkit";
import customerSlice from "./customerSlice"

const store = configureStore({
    reducer: {
        customer: customerSlice
    },

    devTools: import.meta.env.NODE_ENV !=="prodcution",
});

export default store;
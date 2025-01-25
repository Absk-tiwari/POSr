import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios"; 

const initialState= {
    loading:true,
    labels:[],
    series:[]
}

const fetchCollections = createAsyncThunk('collections/fetchCollections',  () => {
    return axios.get('/collections').then(response=> response.data )
})

  
const collectionSlice = createSlice({
    name:'collections',
    initialState,
    reducers:{},
    extraReducers:builder=>{
        builder.addCase(fetchCollections.pending, state => {
            state.loading=true
        })
        builder.addCase(fetchCollections.fulfilled, (state,action)=>{   
            state.loading=false
            state.labels=action.payload.labels
            state.series=action.payload.series            
        })
        builder.addCase(fetchCollections.rejected, (state,action)=>{
            state.loading=false
            state.error=action.error.message
        })
    }
})
 
export default collectionSlice.reducer
export { fetchCollections }
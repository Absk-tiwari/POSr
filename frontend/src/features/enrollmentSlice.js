import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import axios from "axios";

export const enrollmentApiSlice = createApi({
	reducerPath:'enrollmentApi',
	baseQuery: fetchBaseQuery({ baseUrl:process.env.REACT_APP_BACKEND_URI,
	  prepareHeaders: ( headers ) => {   
		headers.set('Accept','application/json' ) 
		headers.set('Content-Type', 'application/json') 
		headers.set('Authorization', `Bearer ${localStorage.getItem('auth-token')}`) 
		return headers
	  }
	}),  
	endpoints: builder => ({
	  searchEnrollments:builder.query({
		query:(term)=>{
			return {
				url:`/search-enrolled`,
				method: 'POST',
				body:{term}
			}
		}
	  })
	})	
})

const initialState = {
    loading:true,
    data:[],
	error:''
}

const fetchEnrolled = createAsyncThunk('enrollments/fetchEnrolled', ()=> axios.get('/search-enrolled').then(res=> res.data))

const enrollmentSlice = createSlice({
    name:'center',
    initialState,
    reducers:{},
    extraReducers:builder=>{
        builder.addCase(fetchEnrolled.pending, state => {
            state.loading=true
        })
        builder.addCase(fetchEnrolled.fulfilled, (state,action)=>{   
            state.loading=false
            state.data = action.payload.data
        })
        builder.addCase(fetchEnrolled.rejected, (state,action)=>{
            state.loading=false
            state.error=action.error.message
        })
    }
})
 
export default enrollmentSlice.reducer
export const {  useSearchEnrollmentsQuery } = enrollmentApiSlice  
export { fetchEnrolled }
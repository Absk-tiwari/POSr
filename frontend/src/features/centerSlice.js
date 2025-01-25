import { createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import toast from "react-hot-toast";

export const commonApiSlice = createApi({
	reducerPath:'commonApi',
	baseQuery: fetchBaseQuery({ baseUrl:process.env.REACT_APP_BACKEND_URI ,
		prepareHeaders: ( headers, { getState }) => {   
			headers.set('Accept','application/json' ) 
			headers.set('Content-Type', 'application/json') 
			headers.set("pos-token", localStorage.getItem('pos-token')) 
			return headers
		}
	}),
	
	endpoints: builder => ({
	   
		getProductCategories:builder.query({
			query:()=>{
				return {
					url:`/category`,
					method: 'GET',
				}
			}
		}),
		getTaxes: builder.query({
			query: () => ({
				url: '/tax',
				method: 'GET'
			})
		}),
		getProducts:builder.query({
			query:()=> ({
				url:`/products`,
				method: 'GET',
			})
		}),
		getNotes: builder.query({
			query:()=> ({
				url:`/notes`,
				method: 'GET',
			})
		}),
		getPosProducts: builder.query({
			query:()=> ({
				url:`/pos/products`,
				method:'GET'
			})
		}),
		updateProduct: builder.mutation({
			query:(fd)=> ({
				url:`/products/update`,
				method:'POST',
				headers:{ 
					"Accept"       :"application/json",
					"Content-Type" : "multipart/form-data",
					"pos-token": localStorage.getItem('pos-token')
				},
				body:fd
			})
		}),
		updateStock: builder.mutation({
			query: ({id, updated}) => ({
				url:`/products/updateStock/${id}`,
				method:"POST",
				body: updated
			}),
			async onQueryStarted(updatedItem, { dispatch, queryFulfilled }) {
				try 
				{
					const {data} = await queryFulfilled; // Wait for the mutation to succeed
					if(data.status) {
						toast.success(data.message)
					} else {
						toast.error(data.message);
					} 
				
					dispatch(
						commonApiSlice.util.updateQueryData('getProducts', undefined, (draft) => {
							const {products} = draft
							const {updated} = updatedItem
							const index = products.findIndex((item) => item.id === updated.id);
							if (index !== -1) draft['products'][index] = updated; // Update the item in the cache
						})
					);

				} catch (error) {
					console.error('Failed to update cache:', error);
				}
			}
		}),
		togglePOS: builder.mutation({ // for updation in pos status
			query: ({id, status}) => ({
				url:`/products/update-product-pos/${id}/${status}`,
				method:"GET"
			}),
			async onQueryStarted(args, {dispatch, queryFulfilled}) {
				try {
					const {data} = await queryFulfilled;
					
					if(data.status) {
						toast.success("POS status updated!")
					} else {
						toast.error("Something went wrong");
					}
					dispatch(
						commonApiSlice.util.updateQueryData('getProducts', undefined, (draft) => {
							const {products} = draft;
							if(products) {
								draft['products'] = products.map(item => {
									if(item.id===parseInt(args.id)){
										item.pos = args.status
									}
									return item
								})
							}
						})
					);

					dispatch(
						commonApiSlice.util.updateQueryData('getPosProducts', undefined, draft => {
							const {products} = draft; 
							if(products) {
								if(args.status===0)
								{ 
									draft['products'] = products.filter(item => item.id !== parseInt(args.id))
								} else { 
									draft['products'].push(data.product)
								}
							}
						})
					)

				} catch (error) {
					console.log(`Exception occurred:- ${error.message}`);
				}
			}
		}),
		deleteProduct: builder.mutation({
			query: ({id}) => ({
				url: `/products/remove/${id}`,
				method: "GET",
			}),
			async onQueryStarted(args, {queryFulfilled, dispatch}) {
				try {
					const{data} = await queryFulfilled;
					if(data.status) {
						toast.success(data.message)
					} else {
						toast.error(data.message)
					}
					dispatch(
						commonApiSlice.util.updateQueryData('getProducts', undefined, (draft) => {
							let {products} = draft
							if( products ) {
								draft['products'] = products?.filter( product => product?.id !== parseInt(args.id) )
							}
						})
					)
				} catch (error) {
					console.log( "Error occurred:- " + error.message )
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

const centerSlice = createSlice({
    name:'api',
    initialState,
    reducers:{
		updateItem(state, action) {
			const { id, data } = action.payload;
			console.log("payload received:- ", data)
			const item = state.items.find(item => item.id === id);
			if (item) {
			  Object.assign(item, data); // Update the item with new data
			}
		},
	},
    
})
 
export default centerSlice.reducer
export const { 
	useGetProductCategoriesQuery,
	useGetProductsQuery,
	useGetNotesQuery,
	useGetPosProductsQuery,
	useGetTaxesQuery,
	useUpdateProductMutation,
	useUpdateStockMutation,
	useDeleteProductMutation,
	useTogglePOSMutation,
} = commonApiSlice;
export const { updateItem } = centerSlice.actions ;
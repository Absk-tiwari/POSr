import React, { useEffect, useState } from 'react';
import uploader from '../../asset/images/uploader.png';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Form, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import { useGetNotesQuery } from '../../features/centerSlice';


export default function Notes() {
    const [fields, setFields] = useState({})
    const dispatch = useDispatch();

    const {currency} = useSelector( state => state.auth )
    const [notes, setNotes] = useState([]);
    const [open, setModal] = useState(false);
    const [image, setImage] = useState(null);
    const {data, isSuccess} = useGetNotesQuery();

    const toggleModal = () => setModal(!open)

    const change = e => setFields({...fields, [e.target.name]:e.target.value})

    const deleteNote = (id) => {

        if(!window.confirm('Are you sure?')) return;

        dispatch({type:"LOADING"});

        axios.get(`/notes/remove/${id}`).then(({data})=> {
            console.log(data)
            setNotes(notes.filter(item => item.id!== id));
        }).catch(err => {})
        .finally(()=> dispatch({type:"STOP_LOADING"}));
        
    }

    const createNote = e => {

        e.preventDefault();
        if(!image) return toast.error("Choose an image!");
        dispatch({ type:"LOADING" });
        let fd = new FormData();
        fd.append('image', image);
        fd.append('amount', fields.amount);

        axios.post(`/notes/create`, fd , {
            headers: {
                'Accept': 'application/json',
                "Content-Type" : "multipart/form-data",
                'pos-token' : localStorage.getItem('pos-token')
            }
        }).then(({data}) => {
            setNotes([...notes, data.note])
        }).catch( er => toast.error(er.response?.responseText?? 'Something went wrong!') )
        .finally(() => dispatch({ type: "STOP_LOADING" }) )
    }
    
    useEffect(() => {
        if(isSuccess) {
            setNotes(data.notes)
        }
    },[data, isSuccess])
    
    return (
        <>
            <div className="content-wrapper">
                <div className="d-grid mt-3" >
                    <div id="category">
                        <div className="col-lg-12 grid-margin stretch-card">
                            <div className="card">
                                <div className="card-header">
                                    <button className="btn btn-sm btn-success" onClick={toggleModal}> Add New</button>
                                </div>
                                <div className="card-body">
                                    <div className="table-responsive w-100 categoryTable">
                                        <table className='table table-bordered' style={{borderRadius:10}}>
                                            <thead>
                                                <tr>
                                                    <th>S.No</th>
                                                    <th>Amount</th>
                                                    <th>Image</th>
                                                    <th>Status</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {notes.map( item => (
                                                    <tr key={item.id}>
                                                        <td>{item.id}</td>
                                                        <td> {currency} {item.amount} </td>
                                                        <td><img src={process.env.REACT_APP_BACKEND_URI+'images/'+item.image} style={{ borderRadius:0,width:60 }} alt='' /></td>
                                                        <td>
                                                            <input type={`checkbox`} style={{display:'none'}} id={`btn`+item.id} name={'status'} defaultChecked={item.status} className='status'/>
                                                            <label htmlFor={`btn`+item.id} />
                                                            <div className='plate'/>
                                                        </td>
                                                        <td>
                                                            <button className={`btn btn-danger btn-sm`} onClick={deleteNote} >
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <Modal isOpen={open} toggle={toggleModal} > 
                <Form onSubmit={createNote} >
                    <ModalHeader > Update Product </ModalHeader>
                        <ModalBody>
                            <Container>
                                <Row>
                                    <FormGroup>
                                        <Label> Amount </Label>
                                        <Input
                                            type={'text'}
                                            name='amount'
                                            pattern="^\d+(\.\d+)?$"
                                            onChange={change}
                                        />
                                    </FormGroup>
                                </Row>
                                <Row>
                                    <FormGroup>
                                        <Label> Image </Label>
                                        <Input 
                                            type='file'
                                            onChange={e => setImage(e.target.files[0])}
                                        />
                                    </FormGroup>
                                </Row> 
                            </Container>
                        </ModalBody>
                    <ModalFooter>
                        <button className="btn btn-light btn-rounded" type="button" onClick={toggleModal}>
                            Close
                        </button>
                        <button className="btn btn-success btn-rounded" type="submit" >
                            Upload
                        </button>
                    </ModalFooter> 
                </Form>
            </Modal>
        </>
    )
}

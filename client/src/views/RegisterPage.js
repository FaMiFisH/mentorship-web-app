import React, { useState, useEffect } from "react";
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    FormGroup,
    Form,
    Input,
    InputGroupAddon,
    InputGroupText,
    InputGroup,
    Container,
    Row,
    Col,
    UncontrolledPopover,
    PopoverHeader,
    PopoverBody,
    Badge,
    Progress,
    Modal
  } from "reactstrap";
import {
    Redirect
} from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import api from "../api/api";
import MainFooter from "../components/Navs/MainFooter.js";
import AuthServices from "../api/authService";

function RegisterPage () {

    // app navigation
    const history = useHistory();

    // keep track of terms anc conditions popup
    const [termsPopup, setTermsPopup] = useState(false);

    // keep track of user inputs
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [bio, setBio] = useState("");
    const [accountType, setAccountType] = useState("");
    const [activeDepartment, setActiveDepartment] = useState("");
    const [activeInterests, setActiveInterests] = useState([]);
    const [activeSpecialties, setActiveSpecialties] = useState([]);
    const [pass, setPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");

    // maximum number of interests a user can select
    const maxInterests = 5;

     // get the list of departments and topics
     const [departments, setDepartments] = useState([]);
     const [topics, setTopics] = useState([]);
     const [isLoggedIn, setIsLoggedIn] = useState(false);
     useEffect( () => {
         const authState = localStorage.getItem('authState');
         // if user is already logged in
         if (authState) {
             setIsLoggedIn(true);
         }
         // if user is not already logged in
         else{
             api.get("/api/v1/register").then(
                 (res) => {
                     console.log(res);
                     if(res.data){
                        setDepartments(res.data.departments);  
                        setTopics(res.data.topics);    
                    }
                 }
                 );
         }
         }, []);
        
    // filter the departments by user input
    const [filteredDepartments, setFilteredDepartments] = useState([]);
    const handleDepartmentChange = (e) => {
        const input = e.target.value;
        // if user input is empty, show all
        if (input === ""){
            setFilteredDepartments(departments);
        }else{
            const filter = departments.filter((value) => {
                return value.includes(input);
            });
            setFilteredDepartments(filter);
        }
    }

    // filter the interests by user input
    const [filteredInterests, setFilteredInterests] = useState([]);
    const handleInterestChange = (e) => {
        const input = e.target.value;
        if(input === ""){
            setFilteredInterests(topics);
        }else{
            const filter = topics.filter((value) => {
                return value.includes(input);
            });
            setFilteredInterests(filter);
        }
    }

    // filter the specialists by user input
    const [filteredSpecialties, setFilteredSpecialties] = useState([]);
    const handleSpecialtiesChange = (e) => {
        const input = e.target.value;
        if (input === "") {
            setFilteredSpecialties(topics);
        } else {
            const filter = topics.filter((value) => {
                return value.includes(input);
            });
            setFilteredSpecialties(filter);
        }
    }

    // initialise filtered data to departments once fetched, this is so the first empty search will show all departments
    useEffect( () => {
        setFilteredDepartments(departments);
        setFilteredInterests(topics);
        setFilteredSpecialties(topics);
    }, [departments, topics]);

    // function to handle interest click
    const handleInterestClick = (value) => {
        
        // get the index of the value in the array
        const i = activeInterests.indexOf(value);
        
        // if array does not contain the value
        if(i === -1){
            // only add if array is not at its limit
            if(activeInterests.length < maxInterests){
                // add value to array
                const newArray = activeInterests.slice();
                newArray.push(value);
                setActiveInterests(newArray);
            }
        }
        // if topic is already added in array
        else{
            // remove it from array
            const newArray = activeInterests.slice();
            newArray.splice(i, 1);
            setActiveInterests(newArray);
        } 
    }

    // function to handle interest click
    const handleSpecialtiesClick = (value) => {
        
        // get the index of the value in the array
        const i = activeSpecialties.indexOf(value);
        
        // if array does not contain the value
        if(i === -1){
            // only add if array is not at its limit
            if(activeSpecialties.length < maxInterests){
                // add value to array
                const newArray = activeSpecialties.slice();
                newArray.push(value);
                setActiveSpecialties(newArray);
            }
        }
        // if topic is already added in array
        else{
            // remove it from array
            const newArray = activeSpecialties.slice();
            newArray.splice(i, 1);
            setActiveSpecialties(newArray);
        } 
    }

    // keep track of any errors
    const [nameErrorMsg, setNameErrorMsg] = useState("");
    const [emailErrorMsg, setEmailErrorMsg] = useState("");
    const [bioErrorMsg, setBioErrorMsg] = useState("");
    const [accountErrorMsg, setAccountErrorMsg] = useState("");
    const [departmentErrorMsg, setDepartmentErrorMsg] = useState("");
    const [interestsErrorMsg, setInterestsErrorMsg] = useState("");
    const [specialtiesErrorMsg, setSpecialtiesErrorMsg] = useState("");
    const [passwordErrorMsg, setPasswordErrorMsg] = useState("");
    const [confirmPassErrorMsg, setConfirmPassErrorMsg] = useState("");

    // function to handle users register request
    const handleRegister = () => {

        // validate user input; inform user input at a time
        // check if name input field is empty
        if (name === ""){
            setNameErrorMsg("Input field is empty");
            return;
        }
        else{
            // reset name error message
            setNameErrorMsg("");

            // check if email input is empty
            if (email === ""){
                setEmailErrorMsg("Email field is empty");
                return;
            }
            else{
                // if email doesn't contain an '@' 
                const char = "@";
                if( !email.includes(char) ){
                    setEmailErrorMsg("Email does not contain an '@'");
                    return;
                }
                else{
                    // reset email error message
                    setEmailErrorMsg("");

                    // check if user has selected an account type
                    if(accountType === ""){
                        setAccountErrorMsg("Please select an account type");
                        return;
                    }else{
                        // reset account error
                        setAccountErrorMsg("");

                        // check if user has selected a department
                        if(activeDepartment === ""){
                            setDepartmentErrorMsg("Please select a department");
                            return;
                        }else{
                            // reset department error message
                            setDepartmentErrorMsg("");

                            // check if user has selected interests
                            if(activeInterests.length === 0 && accountType !== "mentor"){
                                setInterestsErrorMsg("Please select atleast one interest");
                                return;
                            }else{
                                // reset interest error message
                                setInterestsErrorMsg("");

                                // check if user has selected specialties
                                if(activeSpecialties.length === 0 && accountType !== "mentee"){
                                    setSpecialtiesErrorMsg("Please select atleast one specialty");
                                    return;
                                }else{
                                    // reset specialties error message
                                    setSpecialtiesErrorMsg("");

                                    // check user has inputted a password
                                    if(pass === ""){
                                        setPasswordErrorMsg("Input field is empty");
                                        return;
                                    }else{
                                        setPasswordErrorMsg("");
                                        
                                        // check password strength 
                                        if(passStrength === "weak"){
                                            setPasswordErrorMsg("Password strength is weak");
                                            return;
                                        }else{
                                            setPasswordErrorMsg("");

                                            // check confirm password
                                            if(confirmPass !== pass){
                                                setConfirmPassErrorMsg("Input does not match the password");
                                                return;
                                            }else{
                                                setConfirmPassErrorMsg("");

                                                // set default bio
                                                const tempBio = bio === "" ? "Empty bio" : bio;

                                                // send register request to backend
                                                const data = {
                                                    'name': name,
                                                    'email': email,
                                                    'bio': tempBio,
                                                    'userType': accountType,
                                                    'department': activeDepartment,
                                                    'interests': activeInterests,
                                                    'specialties': activeSpecialties,
                                                    'password': pass,
                                                }
                                                AuthServices.register(data)
                                                .then( response => {
                                                    if(response.status === 500){
                                                        // TODO: set error message
                                                        
                                                    }else{
                                                        // on successful registeration
                                                        history.push("/login");
                                                    }
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // password strength regex
    const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[_!@#\$%\^&\*])(?=.{8,})");
    const goodRegex = new RegExp("^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})");

    const [passStrength, setPassStrength] = useState("");
    // function to handle password input
    const handlePasswordChange = (event) => {
        // get user input
        const input = event.target.value;

        
        // set the password state to user input
        setPass(input);
        
        // determine password strength
        if(strongRegex.test(input)){setPassStrength("strong");}
        else if(goodRegex.test(input)){setPassStrength("good");}
        else{ setPassStrength("weak");}

        // reset pass strength is user input is empty
        if(input === ""){setPassStrength("");}
    }


    // if user is already logged in, redirect user to home page
    if (isLoggedIn) {
    return <Redirect to="/home" />
    }

    
    return(
        <>
            <Container className="pt-lg-7 mb-md">
            <Row className="justify-content-center">
                <Col lg="5">
                <Card className="bg-secondary shadow border-0">
                    <CardHeader className="bg-white pb-2">
                        <div className="btn-wrapper text-center">
                            <h1>REGISTER</h1>
                        </div>
                    </CardHeader>
                    <CardBody className="px-lg-5 py-lg-5">
                    
                    <Form role="form">
                        <FormGroup className="mb-3">
                            <InputGroup className="input-group-alternative">
                                <InputGroupAddon addonType="prepend">
                                    <InputGroupText>
                                        <i className="ni ni-circle-08" />
                                    </InputGroupText>
                                </InputGroupAddon>
                                <Input 
                                    placeholder="Name" 
                                    type="text" 
                                    onChange={ (event) => {
                                        setName(event.target.value);
                                    }}
                                    />
                                {nameErrorMsg === ""
                                ? <></>
                                : <div className="has-danger"></div>}
                            </InputGroup>
                        </FormGroup>

                        {nameErrorMsg === "" 
                        ? <></>
                        : <Row className="mb-3">
                            <small className="text-uppercase text-danger font-weight-bold mt-1 mr-2 ml-3">Error:</small>
                            <p className="text-danger mb-0">{nameErrorMsg}</p>
                        </Row>
                        }

                        <FormGroup className="mb-3">
                            <InputGroup className="input-group-alternative">
                                <InputGroupAddon addonType="prepend">
                                <InputGroupText>
                                    <i className="ni ni-email-83" />
                                </InputGroupText>
                                </InputGroupAddon>
                                <Input 
                                    placeholder="Email"
                                    type="email"
                                    onChange={ (event) => {
                                        setEmail(event.target.value);
                                    }}
                                />
                                {emailErrorMsg === ""
                                ? <></>
                                : <div className="has-danger"></div>}
                            </InputGroup>
                        </FormGroup>

                        {emailErrorMsg === "" 
                        ? <></>
                        : <Row className="mb-3">
                            <small className="text-uppercase text-danger font-weight-bold mt-1 mr-2 ml-3">Error:</small>
                            <p className="text-danger mb-0">{emailErrorMsg}</p>
                        </Row>
                        }

                        <hr/>
                        <div className="mb-2">
                            <small className="text-uppercase text-muted font-weight-bold mb">Tell us about youreself</small>
                        </div>
                        <FormGroup className="mb-3">
                            <InputGroup className="input-group-alternative">
                                <Input 
                                    placeholder="Enter bio" 
                                    type="textarea" 
                                    onChange={ (event) => {
                                        setBio(event.target.value);
                                    }}
                                    />
                            </InputGroup>
                        </FormGroup>

                       <hr/>

                        <Row className="justify-content-center">
                                <Col sm="4">
                                    <small className="text-uppercase text-muted font-weight-bold">
                                        Account
                                    </small>
                                </Col>
                                <Col sm="8">
                                    <div className="custom-control custom-radio">
                                        <input
                                            className="custom-control-input"
                                            id="customRadio1"
                                            name="custom-radio-1"
                                            type="radio"
                                            onChange={() => setAccountType("mentor")}
                                        />
                                        <label className="custom-control-label" htmlFor="customRadio1">
                                            <span>Mentor</span>
                                        </label>
                                    </div>
                                    <div className="custom-control custom-radio mt-2">
                                        <input
                                            className="custom-control-input"
                                            id="customRadio2"
                                            name="custom-radio-1"
                                            type="radio"
                                            onChange={() => setAccountType("mentee")}
                                        />
                                        <label className="custom-control-label" htmlFor="customRadio2">
                                            <span>Mentee</span>
                                        </label>
                                    </div>
                                    <div className="custom-control custom-radio mt-2">
                                        <input
                                            className="custom-control-input"
                                            id="customRadio3"
                                            name="custom-radio-1"
                                            type="radio"
                                            onChange={() => setAccountType("both")}
                                        />
                                        <label className="custom-control-label" htmlFor="customRadio3">
                                            <span>Both</span>
                                        </label>
                                    </div>
                                </Col>
                            </Row>

                            {accountErrorMsg === "" 
                            ? <></>
                            : <Row className="mb-3 mt-2">
                                <small className="text-uppercase text-danger font-weight-bold mt-1 mr-2 ml-3">Error:</small>
                                <p className="text-danger mb-0">{accountErrorMsg}</p>
                            </Row>
                            }

                            <hr/>

                        {/* search department */}
                            <Row className="mb-4">
                                <Col className="mt-2" sm="5">
                                    <small className="text-uppercase text-muted font-weight-bold">
                                        Department
                                    </small>
                                </Col>
                                <Col sm="7">
                                    <Input
                                    className="form-control-alternative"
                                    disabled
                                    value={activeDepartment === ""
                                        ? "Empty"
                                        : activeDepartment}
                                    type="text"/>
                                </Col>
                        </Row>
                        <Row className="mr-3">
                            <Col lg="8">
                                <div>
                                    <InputGroup className="input-group-alternative mb-4">
                                        <InputGroupAddon addonType="prepend">
                                        <InputGroupText>
                                            <i className="ni ni-zoom-split-in" />
                                        </InputGroupText>
                                        </InputGroupAddon>
                                        <Input
                                        placeholder="Find department"
                                        type="text"
                                        onChange={handleDepartmentChange}
                                        />
                                    </InputGroup>
                                </div>
                                <div>
                                    <UncontrolledPopover
                                    placement="right"
                                    target="departmentSearch"
                                    trigger="legacy"
                                    >
                                        <PopoverHeader>
                                            <div>
                                                <h3 className="heading mb-0">Departments</h3>
                                            </div>
                                        </PopoverHeader>
                                        <PopoverBody>
                                            <div>
                                                {filteredDepartments.length === 0
                                                ? <p>No such department exists</p>
                                                : filteredDepartments.map( (value) => {
                                                    return(
                                                        <div>
                                                            <div onClick={() => setActiveDepartment(value)}>
                                                                <p>{value}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </PopoverBody>
                                    </UncontrolledPopover>
                                    </div>
                            </Col>
                            <Col lg="4">
                                <Button 
                                    id="departmentSearch"
                                    className="btn-1 btn-neutral ml-1"
                                    color="default"
                                    type="button">
                                        Search
                                </Button>
                            </Col>
                        </Row>  

                        {departmentErrorMsg === "" 
                        ? <></>
                        : <Row className="mb-3 mt-2">
                            <small className="text-uppercase text-danger font-weight-bold mt-1 mr-2 ml-3">Error:</small>
                            <p className="text-danger mb-0">{departmentErrorMsg}</p>
                        </Row>}
                        
                        {accountType === "mentor" || accountType === ""
                        ? <></>
                        : <>
                            <hr/>

                            <Row className="mb-4">
                                <Col className="" sm="5">
                                    <small className="text-uppercase text-muted font-weight-bold">
                                        Interests
                                    </small>
                                </Col>
                                <Col sm="7">
                                    {activeInterests.length === 0
                                    ? <small className="text-light">Select in order of priority</small>
                                    : activeInterests.map( (topic) => {
                                        return(
                                            <Badge className="text-uppercase mr-2 mb-1 px-2" color="primary" pill>
                                                {topic}
                                            </Badge>
                                        );
                                    })                                
                                    }
                                </Col>
                            </Row>
                            <Row className="mr-3">
                                <Col md="8">
                                    <div>
                                        <InputGroup className="input-group-alternative mb-4">
                                            <InputGroupAddon addonType="prepend">
                                            <InputGroupText>
                                                <i className="ni ni-zoom-split-in" />
                                            </InputGroupText>
                                            </InputGroupAddon>
                                            <Input
                                            placeholder="Find topic"
                                            type="text"
                                            onChange={handleInterestChange}
                                            />
                                        </InputGroup>
                                    </div>
                                    <div>
                                        <UncontrolledPopover
                                        placement="right"
                                        target="interestSearch"
                                        trigger="legacy"
                                        >
                                            <PopoverHeader>
                                                <div>
                                                    <h3 className="heading mb-0">Topics</h3>
                                                </div>
                                            </PopoverHeader>
                                            <PopoverBody>
                                                <div>
                                                    {filteredInterests.length === 0
                                                    ? <p>No such interest exists</p>
                                                    : filteredInterests.map( (value) => {
                                                        return(
                                                            <div>
                                                                <div onClick={() => handleInterestClick(value)}>
                                                                    <p>{value}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </PopoverBody>
                                        </UncontrolledPopover>
                                    </div>
                                </Col>
                                <Col md="4">
                                    <Button 
                                        id="interestSearch"
                                        className="btn-1 btn-neutral ml-1"
                                        color="default"
                                        type="button">
                                            Search
                                    </Button>
                                </Col>
                            </Row>
                        </>}

                        {interestsErrorMsg === "" 
                        ? <></>
                        : <Row className="mb-3 mt-2">
                            <small className="text-uppercase text-danger font-weight-bold mt-1 mr-2 ml-3">Error:</small>
                            <p className="text-danger mb-0">{interestsErrorMsg}</p>
                        </Row>
                        }

                        {accountType === "mentee" || accountType === ""
                        ? <></>
                        : <>
                            <hr/>

                            <Row className="mb-4">
                                <Col className="" sm="5">
                                    <small className="text-uppercase text-muted font-weight-bold">
                                        Specialties
                                    </small>
                                </Col>
                                <Col sm="7">
                                    {activeSpecialties.length === 0
                                    ? <small className="text-light">Select in order of priority</small>
                                    : activeSpecialties.map( (topic) => {
                                        return(
                                            <Badge className="text-uppercase mr-2 mb-1 px-2" color="primary" pill>
                                                {topic}
                                            </Badge>
                                        );
                                    })                                
                                    }
                                </Col>
                            </Row>
                            <Row className="mr-3">
                                <Col md="8">
                                    <div>
                                        <InputGroup className="input-group-alternative mb-4">
                                            <InputGroupAddon addonType="prepend">
                                            <InputGroupText>
                                                <i className="ni ni-zoom-split-in" />
                                            </InputGroupText>
                                            </InputGroupAddon>
                                            <Input
                                            placeholder="Find topic"
                                            type="text"
                                            onChange={handleSpecialtiesChange}
                                            />
                                        </InputGroup>
                                    </div>
                                    <div>
                                        <UncontrolledPopover
                                        placement="right"
                                        target="specialtiesSearch"
                                        trigger="legacy"
                                        >
                                            <PopoverHeader>
                                                <div>
                                                    <h3 className="heading mb-0">Specialties</h3>
                                                </div>
                                            </PopoverHeader>
                                            <PopoverBody>
                                                <div>
                                                    {filteredSpecialties.length === 0
                                                    ? <p>No such specialty exists</p>
                                                    : filteredSpecialties.map( (value) => {
                                                        return(
                                                            <div>
                                                                <div onClick={() => handleSpecialtiesClick(value)}>
                                                                    <p>{value}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </PopoverBody>
                                        </UncontrolledPopover>
                                    </div>
                                </Col>
                                <Col md="4">
                                    <Button 
                                        id="specialtiesSearch"
                                        className="btn-1 btn-neutral ml-1"
                                        color="default"
                                        type="button">
                                            Search
                                    </Button>
                                </Col>
                            </Row>
                        </>}

                        {specialtiesErrorMsg === "" 
                        ? <></>
                        : <Row className="mb-3 mt-2">
                            <small className="text-uppercase text-danger font-weight-bold mt-1 mr-2 ml-3">Error:</small>
                            <p className="text-danger mb-0">{specialtiesErrorMsg}</p>
                        </Row>
                        }

                        <hr/>

                        {passStrength === ""
                        ? <></>
                        : <div>
                                <div className="progress-percentage">
                                    {passStrength === "weak"
                                    ? <span className="text-danger">Weak</span>
                                    : passStrength === "good"
                                    ? <span className="text-warning">Good</span>
                                    : <span className="text-success">Strong</span>
                                    }               
                                </div>
                                <Progress max="100" value={passStrength === "weak" ? "33" : passStrength === "good" ? "66" : "100"} color={passStrength === "weak" ? "danger" : passStrength === "good" ? "warning" : "success"} />
                        </div>}

                        <FormGroup className="mb-3">
                        <InputGroup className="input-group-alternative">
                            <InputGroupAddon addonType="prepend">
                            <InputGroupText>
                                <i className="ni ni-lock-circle-open" />
                            </InputGroupText>
                            </InputGroupAddon>
                            <Input
                            placeholder="Password"
                            type="password"
                            autoComplete="off"
                            onChange={handlePasswordChange}
                            />
                        </InputGroup>
                        </FormGroup>

                        {passwordErrorMsg === "" 
                        ? <></>
                        : <Row className="mb-3 mt-2">
                            <small className="text-uppercase text-danger font-weight-bold mt-1 mr-2 ml-3">Error:</small>
                            <p className="text-danger mb-0">{passwordErrorMsg}</p>
                        </Row>
                        }

                        <FormGroup className="mb-3">
                            <InputGroup className="input-group-alternative">
                                <InputGroupAddon addonType="prepend">
                                <InputGroupText>
                                    <i className="ni ni-lock-circle-open" />
                                </InputGroupText>
                                </InputGroupAddon>
                                <Input
                                placeholder="Confirm Password"
                                type="password"
                                autoComplete="off"
                                onChange={ (event) => {
                                    setConfirmPass(event.target.value);
                                }}
                                />
                            </InputGroup>
                        </FormGroup>

                        {confirmPassErrorMsg === "" 
                        ? <></>
                        : <Row className="mb-3 mt-2">
                            <small className="text-uppercase text-danger font-weight-bold mt-1 mr-2 ml-3">Error:</small>
                            <p className="text-danger mb-0">{confirmPassErrorMsg}</p>
                        </Row>
                        }   
                        <hr/>
                        <Row className="mt-4">
                            <div className="custom-control custom-control-alternative custom-checkbox">
                                <input
                                    className="custom-control-input"
                                    id=" customCheckLogin"
                                    type="checkbox"
                                />
                                <label
                                    className="custom-control-label"
                                    htmlFor=" customCheckLogin"
                                >
                                    <p>
                                        view <a href="#group38" onClick={() => setTermsPopup(true)}>Terms & Conditions</a>
                                    </p>

                                </label>
                            </div>
                        </Row>
                        {/* <div className="custom-control custom-control-alternative custom-checkbox">
                        <input
                            className="custom-control-input"
                            id=" customCheckLogin"
                            type="checkbox"
                        />
                        <label
                            className="custom-control-label"
                            htmlFor=" customCheckLogin"
                        >
                            <span>Remember me</span>
                        </label>
                        </div> */}
                        <div className="text-center mt-2">
                        <Button
                            className=""
                            color="primary"
                            type="button"
                            onClick={handleRegister}
                        >
                            Register
                        </Button>
                        </div>
                    </Form>
                    </CardBody>
                </Card>
                <Row className="mt-3">
                    <Col xs="6">
                    {/* <a
                        className="text-light"
                        // href="#pablo"
                        onClick={e => e.preventDefault()}
                    >
                        <small>Forgot password?</small>
                    </a> */}
                    </Col>
                    <Col className="text-right" xs="6">
                        <Row>
                            <div className="text-light mr-2">
                                <small>Already have an account?</small>
                            </div>
                            <a
                                className="text-light"
                                href="#pablo"
                                onClick={() => history.push("/login")}
                                >
                                <small className="text-primary">Login</small>
                            </a>
                        </Row>
                    </Col>
                </Row>
                </Col>
            </Row>
            </Container>
            <MainFooter />




            {/* terms and conditions popup */}
            <Modal
                    className="modal-dialog-centered"
                    isOpen={termsPopup}
                    toggle={() => setTermsPopup(false)}
                    >
                    <div className="modal-header">
                        <h6 className="modal-title mt-2 " id="modal-title-default">
                            Terms & Conditions
                        </h6>
                        <button
                        aria-label="Close"
                        className="close"
                        data-dismiss="modal"
                        type="button"
                        onClick={() => setTermsPopup(false)}
                        >
                        <span aria-hidden={true}>×</span>
                        </button>
                    </div>

                    <div className="modal-body">
                        {/* CONTENT HERE */}
<>
<h1>Terms of Service</h1>
    Updated on 10/03/2022
    <br/>

    Welcome to Discipulo. If you continue to browse and use this website, you are agreeing to comply with and be bound by the following terms and conditions of use, which together with our privacy policy govern Discipulo's relationship with you in relation to this website. If you disagree with any part of these terms and conditions, please stop using Discipulo. 

    The term 'Discipulo' or 'us' or 'we' refers to the owner of the Dicispulo website. 

    The term 'you' refers to the user or viewer of our website.

    The use of this website is subject to the following terms of use:


    <ol>
        <li>The content of the pages of this website is for your general information and use only. It is subject to change without notice.
        Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness or suitability of the information and materials found or offered on this website for any particular purpose. You acknowledge that such information and materials may contain inaccuracies or errors and we expressly exclude liability for any such inaccuracies or errors to the fullest extent permitted by law.</li>
        <li>Your use of any information or materials on this website is entirely at your own risk, for which we shall not be liable. It shall be your own responsibility to ensure that any products, services or information available through this website meet your specific requirements.</li>
        <li>This website contains material which is owned by or licensed to us. All material under the website falls under the MIT License. This material includes, but is not limited to, design language, design layout, appearance, images, logos and other such graphics. Reproduction is prohibited other than in accordance with the copyright notice, which forms part of these terms and conditions.</li>
        <li>All trademarks reproduced in this website, which are not the property of, or licensed to the operator, are acknowledged on the website.</li>
        <li>Unauthorised use of this website may give rise to a claim for damages and/or be a criminal offence. Offences include but are not limited to storing criminal information on our servers through feedback forms, hatespeech or the posting of illicit links.</li>
        <li>From time to time, this website may also include links to other websites. This is since users may submit links as part of their feedback or plans of action, which are not moderated. They do not signify that we endorse the website(s). We have no responsibility for the content of the linked website(s).</li>
        <li>Your use of this website and any dispute arising out of such use of the website is subject to the laws of England, Northern Ireland, Scotland and Wales. </li>
    </ol>

    <h1>Privacy Policy</h1>
    Updated on 10/03/2022
    <ol>
        <li><h3>Type of personal information we collect</h3></li>

        Personal identifiers and contact information.
        <li><h3>How we get your personal information and why we have it</h3>

        All of the personal information we process is provided to us directly by you for one of the following reasons:
        <ul>
            <li>We request for your email address, in order to ensure you are a valid employee of the given company, and to ensure every user is unique.</li>
            <li>We request for your name and other personal identifiers so that users are able to identify other uses so that in-person mentoring can follow onto the Discipulo system.</li>
            <li>We request for business areas and subjects of interest in order to facilitate intelligent matching between mentees and mentors.</li>
        </ul></li>
        

        <li><h3>We do not recieve your personal information from any other external sources.</h3></li>
        <li><h3>We will not share your personal information with any other external organisations or individuals.</h3></li>

        <li><h3>How we store your personal information</h3>

        We ensure all personal data is stored securely. Discipulo is secure against attacks and security measures will be maintained and updated regularly. Account deactivation of an account leads to an immediate and permenant deletion of user data on Discipulo's servers.</li>

        <li><h3>General Data Protection Act (GDPR)</h3>

        Under the GDPR, the lawful bases we rely on for processing this information are:
        <ul>
            <li>Your consent. You are able to remove your consent at any time. You can do this by contacting contact@discipulo.com.</li>
            <li>We have a contractual obligation.</li>
            <li>We have a vital interest.</li>
            <li>We have a legitimate interest.</li>
        </ul></li>


        <li><h3>Your data protection rights</h3>

        Under data protection law, you have rights including:
        <ul>
            <li>Your right of access - You have the right to ask us for copies of your personal information.</li>
            <li>Your right to rectification - You have the right to ask us to rectify personal information you think is inaccurate. You also have the right to ask us to complete information you think is incomplete.</li>
            <li>Your right to erasure - You have the right to ask us to erase your personal information in certain circumstances.</li>
            <li>Your right to restriction of processing - You have the right to ask us to restrict the processing of your personal information in certain circumstances.</li>
            <li>Your right to object to processing - You have the the right to object to the processing of your personal information in certain circumstances.</li>
            <li>Your right to data portability - You have the right to ask that we transfer the personal information you gave us to another organisation, or to you, in certain circumstances.</li>
        </ul>

        You are not required to pay any charge for exercising your rights. If you make a request, we have one month to respond to you. Please contact us at [insert email address, phone number and or postal address] if you wish to make a request.

        <h3>How to contact us</h3>

        If you have any concerns about our use of your personal information, you can make a complaint to us at contact@discipulo.com.</li>
    </ol>
    </>

                    </div>

                    <div className="modal-footer">
                        <Button
                        className="ml-auto"
                        color="link"
                        data-dismiss="modal"
                        type="button"
                        onClick={() => setTermsPopup(false)}
                        >
                        Close
                        </Button>
                    </div>
                    </Modal>
        </>
    );
}

export default RegisterPage;
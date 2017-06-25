/*================================================

	Login 
	=====
	- component for user login


	Initial State
	-------------
		@var login
		@var password
		@var message - message for display info about login

	Core functions
	--------------
		@function handleLogin - handling click event for login
		@function login - POST ajax request on url login

	Setters
	-------
		@function setLogin
		@function setPassword
		

================================================ */

var Login = React.createClass({

	// initial state
	getInitialState: function() {
		return {
			login: "",
			password: "",
			message: ""
		};
	},

	/** handleLogin
	   	===========
	   	
	   	- function handles login
		- display warning messages if there is some mistake

		- calling login function with backend request

	*/
	handleLogin: function(event) {
		event.preventDefault();

	    var password = this.state.password,
	    	login = this.state.login;

	    if (password && login) {
	      	this.login({
		    	login: login,
		    	password: password
		   	});
	    } else {
	    	this.setState({
				message: "You forgot to fill some of the informations."
			});
	    }
	},

	/** login
	   	=====
	   	- ajax function handles login communication with backend
		- if is success then redirect on main page with logged user,
		if NOT warning message will displayed
		
		@get - user data
	*/
	login: function(data) {

		$.ajax({
			dataType: "json",
			url: 'login',
			method: "POST",
			data: data,
			success: function (data) {

				// wrong password
				if(data[1] === 1) { 
					this.setState({
						message: "Wrong password."
					});
				// login was not faound
				} else if(data[1] === 2) { // set message
					this.setState({
						message: "Login was not found." 
					});
				// redirect on main page
				} else {
					window.location.href = data[0]; // redirect
				}

			}.bind(this),
			error: function(xhr, status, err) {
		        console.warn(xhr.responseText, status, err);
		    }.bind(this)
		});
	},

	// login setter
	setLogin: function(event) {
		this.setState({
			login: event.target.value.trim()
		});
	},

	// password setter
	setPassword: function(event) {
		this.setState({
			password: event.target.value.trim()
		});
	},

	// render
	render: function() {
		return (
			<div className="container log">
				<h1>Login</h1>
				<div className="row error">
					{this.state.message}
				</div>
				<div className="row">
				    <label htmlFor="login">Login</label>
					<input className="u-full-width" type="text" placeholder="Login" id="login" value={this.state.login} onChange={this.setLogin}/>
				</div>
				<div className="row">
				    <label htmlFor="password">Password</label>
					<input className="u-full-width" type="password" placeholder="Password" id="password" value={this.state.password} onChange={this.setPassword}/>
				</div>
				<div className="row">
					<button className="button button-primary u-full-width" onClick={this.handleLogin}>Login</button>
				</div>
			</div>
		);
	}
});

// react dom render
ReactDOM.render(
	<Login />,
	document.getElementById('login')
);
/*================================================

	Signup
	======
	- signup is component for registration


	Initial State
	-------------
		@var login
		@var email
		@var password
		@var passwordRepeated
		@var message - message for display info about signup

	Core functions
	--------------
		@function handleSignup - handling click event for signup
		@function signUp - POST ajax request on url signup

	Setters
	-------
		@function setLogin
		@function setEmail
		@function setPassword - password
		@function setPasswordRepeated


================================================ */

var SignUp = React.createClass({

	// initial state
	getInitialState: function() {
		return {
			login: "",
			email: "",
			password: "",
			passwordRepeated: "",
			message: ""
		};
	},

	/** handleSignup
	   	============
	   	
	   	- function handles signup button on click
		- display warning messages if there is some mistake

		- calling signUp function with backend request
	*/
	handleSignup: function(event) {
		event.preventDefault();

		var login = this.state.login,
			email = this.state.email,
			password = this.state.password,
			passwordRepeated = this.state.passwordRepeated,
			message = this.state.message;

		// if everything is filled
		if(	login &&
		 	email &&
		 	password &&
		 	passwordRepeated) {

			// if passwords are same
			if(password === passwordRepeated) {

				// send request
				this.signUp({
					login: login,
					email: email,
					password: password
				});

			} else {
				message = "Passwords are not same!"
			}

		} else {
			message = "The informations are not completed."
		}
		
		this.setState({
			message: message
		});
	},

	/** signUp
	   	======
	   	- ajax function handles signup communication with backend
		- if is success then redirect on main page with logged user,
		if NOT warning message will displayed
		
		@get - user data
	*/
	signUp: function(user) {

		$.ajax({
			dataType: "json",
			url: 'signup',
			method: "POST",
			data: user,
			success: function (data) {

				// if there is user
				if(data[1] === 1) {
					this.setState({
						message: "Login " + this.state.login + " is not unique. Try another one."
					});
				// else redirect
				} else {
					window.location.href = data[0];
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
			login: event.target.value
		});
	},

	// email setter
	setEmail: function(event) {
		this.setState({
			email: event.target.value
		});
	},

	// password setter
	setPassword: function(event) {
		this.setState({
			password: event.target.value
		});
	},

	// password repeated setter
	setPasswordRepeated: function(event) {
		this.setState({
			passwordRepeated: event.target.value
		});
	},

	// render
	render: function()  {
		return (
			<div className="container log">
				<h1>Sign Up</h1>
				<div className="row error">
					{this.state.message}
				</div>
				<div className="row">
					<label htmlFor="login">Login:</label>
					<input className="u-full-width" type="text" placeholder="Login" id="login" value={this.state.login} onChange={this.setLogin}/>
				</div>
				<div className="row">
			    	<label htmlFor="email">E-mail:</label>
					<input className="u-full-width" type="email" placeholder="Email" id="email" value={this.state.email} onChange={this.setEmail} required />
			    </div>
				<div className="row">
			    	<label htmlFor="password">Password:</label>
					<input className="u-full-width" type="password" placeholder="Password" id="password" value={this.state.password} onChange={this.setPassword}/>
			    </div>
			    <div className="row">
			    	<label htmlFor="passwordRepeat">Repeat password:</label>
					<input className="u-full-width" type="password" placeholder="Repeat password" id="passwordRepeated" value={this.state.passwordRepeated} onChange={this.setPasswordRepeated}/>
			    </div>
			    <div className="row">
					<button className="button button-primary u-full-width" onClick={this.handleSignup}>Sign up</button>
				</div>
			</div>
		)
	}
});

// react dom render
ReactDOM.render(
	<SignUp />,
	document.getElementById('signup')
);
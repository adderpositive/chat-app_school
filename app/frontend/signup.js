"use strict";

var SignUp = React.createClass({
	getInitialState: function getInitialState() {
		return {
			login: "",
			email: "",
			password: "",
			passwordRepeated: "",
			message: ""
		};
	},

	handleSignup: function handleSignup(event) {
		event.preventDefault();

		var login = this.state.login,
		    email = this.state.email,
		    password = this.state.password,
		    passwordRepeated = this.state.passwordRepeated,
		    message = this.state.message;

		if (login && email && password && passwordRepeated) {
			if (password === passwordRepeated) {
				this.signUp({
					login: login,
					email: email,
					password: password
				});
			} else {
				message = "Passwords are not same!";
			}
		} else {
			message = "The informations are not completed.";
		}

		this.setState({
			message: message
		});
	},

	signUp: function signUp(user) {

		$.ajax({
			dataType: "json",
			url: 'signup',
			method: "POST",
			data: user,
			success: function (data) {
				if (data[1] === 1) {
					this.setState({
						message: "Login " + this.state.login + " is not unique. Try another one."
					});
				} else {
					window.location.href = data[0];
				}
			}.bind(this),
			error: function (xhr, status, err) {
				console.warn(xhr.responseText, status, err);
			}.bind(this)
		});
	},

	setLogin: function setLogin(event) {
		this.setState({
			login: event.target.value
		});
	},

	setEmail: function setEmail(event) {
		this.setState({
			email: event.target.value
		});
	},

	setPassword: function setPassword(event) {
		this.setState({
			password: event.target.value
		});
	},

	setPasswordRepeated: function setPasswordRepeated(event) {
		this.setState({
			passwordRepeated: event.target.value
		});
	},

	render: function render() {
		return React.createElement(
			"div",
			{ className: "container log" },
			React.createElement(
				"h1",
				null,
				"Sign Up"
			),
			React.createElement(
				"div",
				{ className: "row error" },
				this.state.message
			),
			React.createElement(
				"div",
				{ className: "row" },
				React.createElement(
					"label",
					{ htmlFor: "login" },
					"Login:"
				),
				React.createElement("input", { className: "u-full-width", type: "text", placeholder: "Login", id: "login", value: this.state.login, onChange: this.setLogin })
			),
			React.createElement(
				"div",
				{ className: "row" },
				React.createElement(
					"label",
					{ htmlFor: "email" },
					"E-mail:"
				),
				React.createElement("input", { className: "u-full-width", type: "email", placeholder: "Email", id: "email", value: this.state.email, onChange: this.setEmail, required: true })
			),
			React.createElement(
				"div",
				{ className: "row" },
				React.createElement(
					"label",
					{ htmlFor: "password" },
					"Password:"
				),
				React.createElement("input", { className: "u-full-width", type: "password", placeholder: "Password", id: "password", value: this.state.password, onChange: this.setPassword })
			),
			React.createElement(
				"div",
				{ className: "row" },
				React.createElement(
					"label",
					{ htmlFor: "passwordRepeat" },
					"Repeat password:"
				),
				React.createElement("input", { className: "u-full-width", type: "password", placeholder: "Repeat password", id: "passwordRepeated", value: this.state.passwordRepeated, onChange: this.setPasswordRepeated })
			),
			React.createElement(
				"div",
				{ className: "row" },
				React.createElement(
					"button",
					{ className: "button button-primary u-full-width", onClick: this.handleSignup },
					"Sign up"
				)
			)
		);
	}
});

ReactDOM.render(React.createElement(SignUp, null), document.getElementById('signup'));

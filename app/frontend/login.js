"use strict";

var Login = React.createClass({
	getInitialState: function getInitialState() {
		return {
			login: "",
			password: "",
			message: ""
		};
	},

	handleLogin: function handleLogin(event) {
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

	login: function login(data) {

		$.ajax({
			dataType: "json",
			url: 'login',
			method: "POST",
			data: data,
			success: function (data) {
				if (data[1] === 1) {
					this.setState({
						message: "Wrong password."
					});
				} else if (data[1] === 2) {
					this.setState({
						message: "Login was not found."
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
			login: event.target.value.trim()
		});
	},

	setPassword: function setPassword(event) {
		this.setState({
			password: event.target.value.trim()
		});
	},

	render: function render() {
		return React.createElement(
			"div",
			{ className: "container log" },
			React.createElement(
				"h1",
				null,
				"Login"
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
					"Login"
				),
				React.createElement("input", { className: "u-full-width", type: "text", placeholder: "Login", id: "login", value: this.state.login, onChange: this.setLogin })
			),
			React.createElement(
				"div",
				{ className: "row" },
				React.createElement(
					"label",
					{ htmlFor: "password" },
					"Password"
				),
				React.createElement("input", { className: "u-full-width", type: "password", placeholder: "Password", id: "password", value: this.state.password, onChange: this.setPassword })
			),
			React.createElement(
				"div",
				{ className: "row" },
				React.createElement(
					"button",
					{ className: "button button-primary u-full-width", onClick: this.handleLogin },
					"Login"
				)
			)
		);
	}
});

ReactDOM.render(React.createElement(Login, null), document.getElementById('login'));

"use strict";

var Introduce = React.createClass({
	render: function render() {

		return React.createElement(
			"div",
			{ className: "container intro" },
			React.createElement(
				"h1",
				null,
				"Welcome to the chat app!"
			),
			React.createElement(
				"p",
				null,
				"The app is a school project created by Martin Homola to accomplish an subject. Now you can log to the app or if you are new one, then you should sign up to this awesome application!"
			),
			React.createElement(
				"a",
				{ className: "button intro__button", href: "login" },
				"Login"
			),
			React.createElement(
				"a",
				{ className: "button button-primary intro__button", href: "signup" },
				"Sign up"
			)
		);
	}
});

ReactDOM.render(React.createElement(Introduce, null), document.getElementById('introduce'));

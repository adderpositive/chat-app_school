/*================================================

	Introduce
	=========
	- render introduce page
	

================================================ */

var Introduce = React.createClass({

	// render
	render: function() {

		return (
			<div className="container intro">
				<h1>Welcome to the chat app!</h1>
				<p>The app is a school project created by Martin Homola to accomplish an subject. Now you can log to the app or if you are new one, then you should sign up to this awesome application!</p>
				<a className="button intro__button" href="login">Login</a>
				<a className="button button-primary intro__button" href="signup">Sign up</a>
			</div>
		);
	}
});

// react dom render
ReactDOM.render(
	<Introduce />,
	document.getElementById('introduce')
);
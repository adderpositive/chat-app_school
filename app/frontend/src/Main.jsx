/*================================================

	Main
	====
	- main component is displaying information about chat,
	displaying chat rooms and handle creating new rooms,
	logout and editing profile

	Proptypes
	---------

		@delay - delay for request (default 3000ms)
		@kicktime - time for kicked user (15s)

	Initial State
	-------------

		@var id
		@var login
		@var name
		@var surname
		@var gender
		@var email
		@var nameHelper - helper for displaying name during editing
	
		@var chatRoomName - name of new created room

		@var chatList - list of rooms

		@var updateMessage - information messages

		@var kicked - Info about kicked user
		@var kickedRoom - Info about kicked user

	Lifecycle methods
	-----------------
		@function componentWillMount
		@function componentDidMount
		@function componentWillUnmount

	Core functions
	--------------
		@function getChatRooms - POST ajax for getting list of chat rooms
		@function createChatRoom - POST ajax request on url signup
		@function deleteRoom - POST ajax request deleting room
		@function updateProfile - POST ajax for updating profile

	Setters
	-------
		@function handleGender - set gender
		@function setName
		@function setSurname
		@function setEmail
		@function setChatRoomName


================================================ */

var Main = React.createClass({

	// initial state
	getInitialState: function() {
		return {
			// user info
			id: "",
			login: "",
			name: "",
			surname: "",
			gender: "",
			email: "",
			nameHelper: "",

			// name of new created room
			chatRoomName: "",

			// list of caht rooms
			chatList: [],

			// information messages
			updateMessage: "",

			// kicked time if user is kicked else null
			kicked: null,
			kickedRoom: ""
		};
	},

	/** componentWillMount
	   	==================
	   
	   	- get information before page will be rendered
	   	and save them to the component state

	   	- if is requested user IS NOT in some room OR IS
	   	kicked than set the component state ELSE redirect 
	   	to logged room
		
		- set @function getChatRooms after ajax
	*/ 
	componentWillMount: function(){

		// get information about actual logged user
		$.ajax({
			dataType: "json",
			url: "main",
			method: "POST",
			success: function (data) {
				var user = data.user; // get user
				// if user is NOT in room OR is NOT kicked
				if(data.inRoom && data.inRoom.kicked === null) {
					window.location.href = "chatroom/" + data.inRoom.id_rooms; // redirect to room logged in
				} else {
					this.setState({
						id: user.id,
						login: user.login,
						name: user.name,
						nameHelper: user.name,
						surname: user.surname,
						gender: user.gender,
						email: user.email,
						kicked: data.inRoom.kicked,
						kickedRoom: data.inRoom.id_rooms
					});
				}
			}.bind(this),
			error: function(xhr, status, err) {
		        console.warn(xhr.responseText, status, err);
		    }.bind(this)
		});

		// get active chat roooms
		this.getChatRooms();
	},

	/** componentDidMount
	   	=================
		
		- set interval for updating list of chatrooms
		once per set delay

		- used @var delay from proptypes 
		& @function getChatRooms

	*/
	componentDidMount: function() {
		var _this = this;

		// active people
		this.roomsInterval = setInterval( function() {
			// updating people in room
			_this.getChatRooms();

			// loop chat list
			_this.state.chatList.map(function(room) {
				var deleteDate = new Date(room.last_used), // delete date of room
					now = new Date(); // actual date
				
				deleteDate.setTime( deleteDate.getTime() + (12 * 60 * 60 * 1000)); // set delete date + 12h
				// if is room epmty and deleteDate IS lower -> delete room
				if(room.id_users_owner == null && deleteDate < now ) {
					_this.deleteRoom(room.id)
				}
			});

		}, _this.props.delay);
	},

	
	/** componentWillUnmount
	   	====================
	   	
	   	- kill request & clear timer
	*/
	componentWillUnmount: function() {
		clearInterval(this.roomsInterval); // clear a timer set with
		this.serverRequest.abort(); // kill requests
	},

	/** getChatRooms
	   	============
	   	
	   	- ajax request for getting list chat rooms

	   	- gotten chat rooms are saved in the component
	   	state
	*/
	getChatRooms: function() {
		
		$.ajax({
			dataType: "json",
			url: "getchatrooms",
			method: "POST",
			success: function (data) {
				console.log(data);
				this.setState({
					chatList: data.rooms
				});
			}.bind(this),
			error: function(xhr, status, err) {
		        console.warn(xhr.responseText, status, err);
		    }.bind(this)
		});
	},

	/** createChatRoom
	   	==============
	   	
	   	- ajax request for creating new chat room
	   	
	   	- redirect to new created chat room

	   	@send chatRoomName
	*/
	createChatRoom: function(event) {
		event.preventDefault();

		// create new room
		$.ajax({
			dataType: "json",
			url: "createroom",
			method: "POST",
			data: {
				title: this.state.chatRoomName 
			},
			success: function (data) {
				window.location.href = "chatroom/" + data.roomId; // redirect
			}.bind(this),
			error: function(xhr, status, err) {
		        console.warn(xhr.responseText, status, err);
		    }.bind(this)
		});
	},

	/** deleteRoom
	   	==========
		
		- ajax req. for deleting room according roomId
	*/
	deleteRoom: function(roomId) {
		$.ajax({
			dataType: "json",
			url: "deleteroom",
			method: "POST",
			data: {
				id: roomId
			}
		});
	},

	/** updateProfile
	   	=============
	   	
	   	- three types of ajax requests
	   		- first if IS NOT filled one of inputs of password 
	   		will update basic information about user
	   		- second is controling whether password in input IS EQUALED
			password in database
			- third request handles fully profile editing

		1. @send name, surname, email, gender
		2. @send oldPsw
		3. @send name, surname, email, gender, newPassword
	*/
	updateProfile: function(event) {
		event.preventDefault();

		var _this = this, 
			oldPsw = ReactDOM.findDOMNode(_this.refs.oldPassword).value, // old password
			newPsw1 = ReactDOM.findDOMNode(_this.refs.newPassword1).value, // new password
			newPsw2 = ReactDOM.findDOMNode(_this.refs.newPassword2).value, // repeated new password
			isRightPsw = false, // if old password = actucal
			message = "",
			name = _this.state.name,
			surname = _this.state.surname,
			email = _this.state.email,
			gender = _this.state.gender;

		// if passwords are not filled
		if(!(oldPsw.length > 0 && newPsw1.length > 0 && newPsw2.length > 0)) {

			// edit basic information
			$.ajax({
				dataType: "json",
				url: 'editbasic',
				method: "POST",
				data: {
					name: name,
					surname: surname,
					email: email,
					gender: gender
				},
				success: function (data) {
					// update just basic information
					message = "Profile update was successful! If you want to change your passwords you have fill all inputs.";
					_this.setState({
						updateMessage: message,
						nameHelper: name 
					});
				}.bind(this),
				error: function(xhr, status, err) {
			        console.warn(xhr.responseText, status, err);
			    }.bind(this)
			});

		} else {
			// update just ALL of user information also paswords

			// control password
			$.when( 
				$.ajax({
					dataType: "text",
					url: "psw",
					method: "POST",
					data: {
						"password": oldPsw
					},
					success: function (data) {
						isRightPsw = data == 'true';
					}.bind(this),
					error: function(xhr, status, err) {
				        console.warn(xhr.responseText, status, err);
				    }.bind(this)
				})

			// after ajax call
			).then( function() {

				// is actual passwords are equal
				if(isRightPsw) {

					// if new passwords are equal
					if(newPsw1 === newPsw2) {

						// update ALL information - basic & psw
						$.ajax({
							dataType: "json",
							url: 'editall',
							method: "POST",
							data: {
								name: name,
								surname: surname,
								email: email,
								gender: gender,
								newPassword: newPsw1
							},
							success: function (data) {
								// update just basic information
								message = "Profile update was fully successful!";
								_this.setState({
									updateMessage: message,
									nameHelper: name 
								});
							}.bind(this),
							error: function(xhr, status, err) {
						        console.warn(xhr.responseText, status, err);
						    }.bind(this)
						});

					} else {
						message = "New passwords are not same! Be careful!";
					}
				} else {
					message = "Actual passwords are not same! Are you hacker?";
				}

				_this.setState({
					updateMessage: message
				});
			});
		}

		_this.setState({
			updateMessage: message
		});
	},

	//
	// setters
	//

	// handle gender
	handleGender: function(event) {
		this.setState({
			gender: event.target.value
		});
	},

	// set name
	setName: function(event) {
		this.setState({
			name: event.target.value
		});
	},

	// set surname
	setSurname: function(event) {
		this.setState({
			surname: event.target.value
		});
	},

	// set email
	setEmail: function(event) {
		this.setState({
			email: event.target.value
		});
	},

	// set chat room name
	setChatRoomName: function(event) {
		this.setState({
			chatRoomName: event.target.value
		});
	},

	// render
	render: function() {

		// get rooms
		var chatList,
			_this = this;

		// if exist chat list
		if(this.state.chatList.length > 0) {

			// loop trought chat list
			chatList = _this.state.chatList.map(function(room) {

				// if room IS NOT locked
				if(room.lock_room === "f") {

					_this.state.kickedRoom == room.id

					// if person is kicked - date
					if(_this.state.kicked) {

						// kicked date
						var kickedDate = new Date(_this.state.kicked),
							date = new Date();

						// set kicked date + kicktime to think about user's behaviour
						kickedDate.setSeconds( kickedDate.getSeconds() + _this.props.kicktime ); 

						// if kicked date IS lower than actual date - can go in
						if(kickedDate < date) {
							return(
								<li className="main-list__item">
					   				<a className="main-list__item-link" href={"chatroom/" + room.id}>{room.title}</a>
					   			</li>
							);
						// can not go in
						} else {
							return(
								<li className="main-list__item">
					   				<div className="main-list__item-link locked">{room.title} (kicked)</div>
					   			</li>
					   		);
						}
					
					// is not kicked
					} else {
						return(
							<li className="main-list__item">
				   				<a className="main-list__item-link" href={"chatroom/" + room.id}>{room.title}</a>
				   			</li>
						);
					}

				// locked
				} else {
					return(
						<li className="main-list__item">
			   				<div className="main-list__item-link locked">{room.title} (locked)</div>
			   			</li>
					);
				}
			});

		} else {
			chatList = <div className="row error">No rooms were found.</div>;
		}

		return(
			<div className="container main">
				<div className="row">
				    <div className="five columns">
				    	<h1 className="main__heading">Hello {this.state.nameHelper}!</h1>
				    	<a className="button button-primary main__button jsPopupOpener" href="#" data-popup="createRoom">Create chat room</a>
				    	<a className="button main__button jsPopupOpener" href="#" data-popup="settings">Settings</a>
				    	<a className="button main__button jsPopupOpener" href="#" data-popup="logout">Logout</a>
				    </div>
				    <div className="seven columns">
				   		<h2 className="main__subheading">List of rooms</h2>
				   		<ul className="main-list">
				   			{chatList}
				   		</ul>
				    </div>
				</div>
				{/*

					POPUPS

				*/}
				<form className="popup createRoom mfp-hide" onSubmit={this.createChatRoom}>
					<div className="popup__text">Create new room</div>
					<label className="popup__label" htmlFor="room-name">Name of new room</label>
					<input id="room-name" className="input popup__input" type="text" value={this.state.chatRoomName} onChange={this.setChatRoomName} />
					<div className="popup__button-wrap">
						<input className="button button-primary popup__button" type="submit" value="Create" />
					</div>
				</form>
				<form className="popup settings mfp-hide" onSubmit={this.updateProfile}>
					<div className="popup__text">Profile settings</div>
					<div className="row error">
						{this.state.updateMessage}
					</div>
					<label className="popup__label" htmlFor="user-login">Login</label>
					<input id="user-login" className="input popup__input" type="text" value={this.state.login} disabled />
					<label className="popup__label" htmlFor="user-name">Name</label>
					<input id="user-name" className="input popup__input" type="text" value={this.state.name} onChange={this.setName} />
					<label className="popup__label" htmlFor="user-surname">Surname</label>
					<input id="user-surname" className="input popup__input" type="text" value={this.state.surname} onChange={this.setSurname} />
					<label className="popup__label" htmlFor="user-email">E-mail</label>
					<input id="user-email" className="input popup__input" type="email" value={this.state.email} onChange={this.setEmail} />
					<div className="row print-languages">
						<label className="popup__label" htmlFor="user-surname">Gender</label>
						<div className="three columns">
			      			<label>
								<input type="radio" name="gender" checked={this.state.gender === "m"} value="m" onChange={this.handleGender} />
								<span className="label-body">Male</span>
							</label>
			      		</div>
			      		<div className="three columns">
			      			<label>
								<input type="radio" name="gender" checked={this.state.gender === "f"} value="f" onChange={this.handleGender}/>
								<span className="label-body">Female</span>
							</label>
			      		</div>
				    </div>
					<label className="popup__label popup__label--password" htmlFor="user-old-password">Old password:</label>
					<input id="user-old-password" className="input popup__input" type="password" ref="oldPassword" />
					<label className="popup__label" htmlFor="user-new-password">New password</label>
					<input id="user-new-password" className="input popup__input" type="password" ref="newPassword1" />
					<label className="popup__label" htmlFor="user-new-password2">Repeat new password</label>
					<input id="user-new-password2" className="input popup__input" type="password" ref="newPassword2" />
					<div className="popup__button-wrap">
						<input className="button button-primary popup__button" type="submit" value="Update profile settings"/>
					</div>
				</form>
				<div className="popup logout mfp-hide">
					<div className="popup__text">Do you really want to logout?</div>
					<div className="popup__button-wrap">
						<a className="button button-primary popup__button" href="logout">YES</a>
						<a className="button popup__button close" href="#">NO</a>
					</div>
				</div>
			</div>
		);
	}

});

// react dom render
ReactDOM.render(
	<Main delay={5000} kicktime={15}/>,
	document.getElementById('main')
);